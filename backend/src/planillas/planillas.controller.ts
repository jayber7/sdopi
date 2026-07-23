import { Controller, Get, Post, Patch, Delete, Param, Query, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlanillasService } from './planillas.service';

@UseGuards(JwtAuthGuard)
@Controller('planillas')
export class PlanillasController {
  constructor(private service: PlanillasService) {}

  @Get()
  findAll(@Query('proyectoId', ParseIntPipe) proyectoId: number) {
    return this.service.findAll(proyectoId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles('operador', 'admin')
  @Post()
  create(@Body() body: { proyectoId: number; numero: number; periodo: string; fechaInicio: string; fechaFin: string; tipo?: 'BASE' | 'CAO'; planillaBaseId?: number }) {
    return this.service.create({
      ...body,
      fechaInicio: new Date(body.fechaInicio),
      fechaFin: new Date(body.fechaFin),
    });
  }

  @UseGuards(RolesGuard)
  @Roles('operador', 'admin')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { periodo?: string; fechaInicio?: string; fechaFin?: string }) {
    const data: { periodo?: string; fechaInicio?: Date; fechaFin?: Date } = {};
    if (body.periodo) data.periodo = body.periodo;
    if (body.fechaInicio) data.fechaInicio = new Date(body.fechaInicio);
    if (body.fechaFin) data.fechaFin = new Date(body.fechaFin);
    return this.service.update(id, data);
  }

  @UseGuards(RolesGuard)
  @Roles('operador', 'admin')
  @Patch(':id/items')
  updateItems(@Param('id', ParseIntPipe) id: number, @Body() body: { items: any[] }) {
    return this.service.updateItems(id, body.items);
  }

  @UseGuards(RolesGuard)
  @Roles('operador')
  @Patch(':id/enviar')
  enviar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { userId: number }) {
    return this.service.enviar(id, user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('pendientes')
  pendientes() {
    return this.service.pendientes();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id/aprobar')
  aprobarTodos(@Param('id', ParseIntPipe) id: number, @Query('force') force?: string, @CurrentUser() user?: { userId: number }) {
    return this.service.aprobarTodos(id, force === 'true', user?.userId);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id/aprobar-item/:avanceId')
  aprobarItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('avanceId', ParseIntPipe) avanceId: number,
  ) {
    return this.service.aprobarItem(id, avanceId);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id/rechazar-item/:avanceId')
  rechazarItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('avanceId', ParseIntPipe) avanceId: number,
    @CurrentUser() user: { userId: number },
  ) {
    return this.service.rechazarItem(id, avanceId, user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles('operador')
  @Delete(':id/items/:avanceId')
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('avanceId', ParseIntPipe) avanceId: number,
  ) {
    return this.service.removeItem(id, avanceId);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id/revisar')
  devolverABorrador(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { userId: number }) {
    return this.service.devolverABorrador(id, user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles('operador', 'admin')
  @Patch(':id/sync-from-items')
  syncFromItems(@Param('id', ParseIntPipe) id: number) {
    return this.service.syncFromItems(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('sync-all-bases')
  syncAllBases() {
    return this.service.syncAllBases();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('cleanup-orphans')
  cleanupOrphans(@Body() body?: { proyectoId?: number }) {
    return this.service.cleanupOrphans(body?.proyectoId);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('manual-cao')
  manualCao(@Body() body: { proyectoId: number; planillaBaseId: number; numero: number; periodo: string; fechaInicio: string; fechaFin: string }) {
    return this.service.manualCao({
      ...body,
      fechaInicio: new Date(body.fechaInicio),
      fechaFin: new Date(body.fechaFin),
    });
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
