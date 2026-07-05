import { Controller, Get, Post, Delete, Param, Query, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DatosComplementariosService } from './datos-complementarios.service';
import { CreateMultaDto, QueryMultaDto } from './dto/multa.dto';
import { CreateDesembolsoProgramadoDto } from './dto/desembolso-programado.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class DatosComplementariosController {
  constructor(private service: DatosComplementariosService) {}

  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @Post('multas')
  createMulta(@Body() dto: CreateMultaDto) {
    return this.service.createMulta(dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor', 'operador', 'consulta')
  @Get('multas')
  listMultas(@Query() query: QueryMultaDto) {
    return this.service.listMultas(query);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete('multas/:id')
  deleteMulta(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteMulta(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'operador')
  @Post('desembolsos-programados')
  createDesembolsoProgramado(@Body() dto: CreateDesembolsoProgramadoDto) {
    return this.service.createDesembolsoProgramado(dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor', 'operador', 'consulta')
  @Get('desembolsos-programados/:proyectoId')
  listDesembolsosProgramados(@Param('proyectoId', ParseIntPipe) proyectoId: number) {
    return this.service.listDesembolsosProgramados(proyectoId);
  }
}
