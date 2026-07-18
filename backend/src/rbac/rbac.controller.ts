import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/permission.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class RbacController {
  constructor(private rbacService: RbacService) {}

  // ── Roles CRUD ──
  @Get('roles')
  @RequirePermission('roles', 'read')
  findAllRoles() {
    return this.rbacService.findAllRoles();
  }

  @Get('roles/:id')
  @RequirePermission('roles', 'read')
  findRole(@Param('id') id: string) {
    return this.rbacService.findRoleById(+id);
  }

  @Post('roles')
  @RequirePermission('roles', 'create')
  createRole(@Body() body: { name: string; description?: string; permissionIds?: number[] }) {
    return this.rbacService.createRole(body);
  }

  @Patch('roles/:id')
  @RequirePermission('roles', 'update')
  updateRole(@Param('id') id: string, @Body() body: { name?: string; description?: string; permissionIds?: number[] }) {
    return this.rbacService.updateRole(+id, body);
  }

  @Delete('roles/:id')
  @RequirePermission('roles', 'delete')
  deleteRole(@Param('id') id: string) {
    return this.rbacService.deleteRole(+id);
  }

  // ── Permissions ──
  @Get('permisos')
  @RequirePermission('permisos', 'read')
  findAllPermissions() {
    return this.rbacService.findAllPermissions();
  }
}
