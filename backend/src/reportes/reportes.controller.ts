import { Controller, Get, Param, ParseIntPipe, Query, UseGuards, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportesService } from './reportes.service';
import { Response } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private service: ReportesService) {}

  @Roles('admin', 'supervisor', 'operador', 'consulta')
  @Get('analisis-cao/:proyectoId')
  analisisCao(
    @Param('proyectoId', ParseIntPipe) proyectoId: number,
    @Query('hastaCao') hastaCao?: string,
  ) {
    return this.service.analisisCao(proyectoId, hastaCao ? Number(hastaCao) : undefined);
  }

  @Roles('admin', 'supervisor', 'operador', 'consulta')
  @Get('planillas/:proyectoId')
  planillaDetalle(
    @Param('proyectoId', ParseIntPipe) proyectoId: number,
    @Query('hastaCao') hastaCao?: string,
  ) {
    return this.service.planillaDetalle(proyectoId, hastaCao ? Number(hastaCao) : undefined);
  }

  @Roles('admin', 'supervisor', 'operador', 'consulta')
  @Get('cao/:planillaId/pdf')
  async caoPdf(@Param('planillaId', ParseIntPipe) planillaId: number, @Res() res: Response) {
    const pdf = await this.service.generateCaoPdf(planillaId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=cao-${planillaId}.pdf`);
    res.send(pdf);
  }
}
