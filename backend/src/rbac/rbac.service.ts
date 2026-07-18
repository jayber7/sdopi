import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  // ── Roles ──
  async createRole(data: { name: string; description?: string; permissionIds?: number[] }) {
    const existing = await this.prisma.role.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException(`El rol '${data.name}' ya existe`);
    return this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissionIds
          ? { create: data.permissionIds.map(id => ({ permissionId: id })) }
          : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async findAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findRoleById(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role;
  }

  async updateRole(id: number, data: { name?: string; description?: string; permissionIds?: number[] }) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Rol no encontrado');

    if (data.permissionIds !== undefined) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      if (data.permissionIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: data.permissionIds.map(permissionId => ({ roleId: id, permissionId })),
        });
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: { name: data.name, description: data.description },
      include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
    });
  }

  async deleteRole(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    if (role._count.users > 0) {
      throw new ConflictException(`No se puede eliminar el rol '${role.name}' porque tiene ${role._count.users} usuario(s) asignado(s). Reasigne los usuarios primero.`);
    }
    await this.prisma.role.delete({ where: { id } });
    return { message: `Rol '${role.name}' eliminado` };
  }

  // ── Permissions ──
  async findAllPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
  }

  async ensurePermission(resource: string, action: string) {
    return this.prisma.permission.upsert({
      where: { resource_action: { resource, action } },
      update: {},
      create: { resource, action },
    });
  }

  // ── User Permission Overrides ──
  async setUserPermissions(userId: number, permissionIds: number[]) {
    await this.prisma.userPermission.deleteMany({ where: { userId } });
    if (permissionIds.length > 0) {
      await this.prisma.userPermission.createMany({
        data: permissionIds.map(permissionId => ({ userId, permissionId, granted: true })),
      });
    }
    return this.getEffectivePermissions(userId);
  }

  async removeUserPermission(userId: number, permissionId: number) {
    await this.prisma.userPermission.deleteMany({ where: { userId, permissionId } });
    return this.getEffectivePermissions(userId);
  }

  async getUserPermissions(userId: number) {
    const [rolePermissions, userOverrides] = await Promise.all([
      this.prisma.rolePermission.findMany({
        where: { role: { users: { some: { id: userId } } } },
        include: { permission: true },
      }),
      this.prisma.userPermission.findMany({
        where: { userId },
        include: { permission: true },
      }),
    ]);
    return {
      inherited: rolePermissions.map(rp => `${rp.permission.resource}:${rp.permission.action}`),
      overrides: userOverrides.filter(u => u.granted).map(up => `${up.permission.resource}:${up.permission.action}`),
      denied: userOverrides.filter(u => !u.granted).map(up => `${up.permission.resource}:${up.permission.action}`),
    };
  }

  async getEffectivePermissions(userId: number): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleRel: { include: { permissions: { include: { permission: true } } } },
        userPermissions: { include: { permission: true } },
      },
    });
    if (!user) return [];

    const rolePerms = user.roleRel?.permissions.map(rp => `${rp.permission.resource}:${rp.permission.action}`) ?? [];
    const grantedOverrides = user.userPermissions.filter(up => up.granted).map(up => `${up.permission.resource}:${up.permission.action}`);
    const deniedSet = new Set(user.userPermissions.filter(up => !up.granted).map(up => `${up.permission.resource}:${up.permission.action}`));

    const effective = new Set([...rolePerms, ...grantedOverrides]);
    for (const d of deniedSet) effective.delete(d);
    return [...effective];
  }
}
