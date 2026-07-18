import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private rbacService: RbacService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.activo) throw new UnauthorizedException('Credenciales invalidas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales invalidas');

    const permissions = await this.rbacService.getEffectivePermissions(user.id);
    const token = this.jwtService.sign({
      sub: user.id,
      role: user.role,
      permissions,
    });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role,
        permissions,
      },
    };
  }

  async me(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    const permissions = await this.rbacService.getEffectivePermissions(userId);
    return { ...user, permissions };
  }

  async register(data: { email: string; password: string; nombre: string; roleName: string }) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) throw new ConflictException('El email ya esta registrado');

    const role = await this.usersService.findRoleByName(data.roleName);
    if (!role) throw new NotFoundException(`Rol '${data.roleName}' no encontrado`);

    return this.usersService.create({
      email: data.email,
      password: data.password,
      nombre: data.nombre,
      role: data.roleName,
    });
  }

  async refreshPermissions(userId: number) {
    const permissions = await this.rbacService.getEffectivePermissions(userId);
    const token = this.jwtService.sign({
      sub: userId,
      role: '',
      permissions,
    });
    return { token, permissions };
  }
}
