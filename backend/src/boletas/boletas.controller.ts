import { Controller, Get, Post, Patch, Delete, Param, Query, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BoletasService } from './boletas.service';

@UseGuards(JwtAuthGuard)
@Controller('boletas')
export class BoletasController {
  constructor(private service: BoletasService) {}

  @Get()
  findAll(@Query('proyectoId', ParseIntPipe) proyectoId: number) {
    return this.service.findAll(proyectoId);
  }

  @Get('next-numero')
  nextNumero(@Query('proyectoId', ParseIntPipe) proyectoId: number) {
    return this.service.nextNumero(proyectoId);
  }

  @UseGuards(RolesGuard)
  @Roles('operador', 'admin')
  @Post()
  create(@Body() body: { proyectoId: number; numero: string; fecha: string; vigencia: string; vencimiento: string }) {
    return this.service.create(body);
  }

  @UseGuards(RolesGuard)
  @Roles('operador', 'admin')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { numero?: string; fecha?: string; vigencia?: string; vencimiento?: string }) {
    return this.service.update(id, body);
  }

  @UseGuards(RolesGuard)
  @Roles('operador', 'admin')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
