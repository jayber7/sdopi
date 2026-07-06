import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProyectosService } from './proyectos.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('proyectos')
export class ProyectosController {
  constructor(private service: ProyectosService) {}

  @Get()
  findAll(@Query('municipio') municipio?: string, @Query('provincia') provincia?: string) {
    return this.service.findAll(municipio, provincia);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Roles('admin', 'operador')
  @Post()
  create(@Body() body: any) {
    const required = ['nombre', 'contratoNro', 'montoContrato', 'ordenProceder', 'fechaConclusion', 'direccion', 'contratista', 'supervisor', 'fiscal', 'latitud', 'longitud'];
    for (const k of required) {
      if (body[k] === undefined || body[k] === null || body[k] === '') throw new BadRequestException(`${k} es requerido`);
    }
    if (typeof body.latitud !== 'number' || typeof body.longitud !== 'number') {
      throw new BadRequestException('latitud y longitud deben ser números');
    }
    return this.service.create(body);
  }

  @Roles('admin', 'operador')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    if (body.latitud !== undefined || body.longitud !== undefined) {
      if (body.latitud == null || body.longitud == null || body.latitud === '' || body.longitud === '') {
        throw new BadRequestException('latitud y longitud son requeridas');
      }
    }
    return this.service.update(id, body);
  }

  @Roles('admin', 'operador')
  @Delete(':id')
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.service.softDelete(id);
  }
}
