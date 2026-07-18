import { Controller, Get, Patch, Delete, Post, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { RbacService } from '../rbac/rbac.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/permission.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private rbacService: RbacService,
  ) {}

  @Get()
  @RequirePermission('usuarios', 'read')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermission('usuarios', 'read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @RequirePermission('usuarios', 'update')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { email?: string; nombre?: string; role?: string; activo?: boolean }) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  @RequirePermission('usuarios', 'delete')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deactivate(id);
  }

  // ── Permission overrides ──
  @Get(':id/permisos')
  @RequirePermission('usuarios', 'read')
  getUserPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.getUserPermissions(id);
  }

  @Post(':id/permisos')
  @RequirePermission('usuarios', 'update')
  setUserPermissions(@Param('id', ParseIntPipe) id: number, @Body() body: { permissionIds: number[] }) {
    return this.rbacService.setUserPermissions(id, body.permissionIds);
  }
}
