import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMultaDto, QueryMultaDto } from './dto/multa.dto';
import { CreateDesembolsoProgramadoDto } from './dto/desembolso-programado.dto';

@Injectable()
export class DatosComplementariosService {
  constructor(private prisma: PrismaService) {}

  // ── Multas ──

  async createMulta(dto: CreateMultaDto) {
    return this.prisma.multa.create({
      data: {
        monto: dto.monto,
        descripcion: dto.descripcion,
        fecha: new Date(dto.fecha),
        planilla: { connect: { id: dto.planillaId } },
      },
    });
  }

  async listMultas(query: QueryMultaDto) {
    const where = query.planillaId ? { planillaId: query.planillaId } : {};
    return this.prisma.multa.findMany({
      where,
      include: { planilla: { select: { id: true, numero: true, periodo: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteMulta(id: number) {
    await this.prisma.multa.delete({ where: { id } });
    return { message: 'Multa eliminada' };
  }

  // ── Desembolsos Programados ──

  async createDesembolsoProgramado(dto: CreateDesembolsoProgramadoDto) {
    return this.prisma.desembolsoProgramado.create({
      data: {
        mes: dto.mes,
        montoProgramado: dto.montoProgramado,
        descripcion: dto.descripcion,
        proyecto: { connect: { id: dto.proyectoId } },
      },
    });
  }

  async listDesembolsosProgramados(proyectoId: number) {
    const programados = await this.prisma.desembolsoProgramado.findMany({
      where: { proyectoId },
      orderBy: { mes: 'asc' },
    });

    const planillas = await this.prisma.planillaCAO.findMany({
      where: { proyectoId },
      include: { avances: { select: { monto: true } } },
      orderBy: { numero: 'asc' },
    });

    const ejecutadoPorMes = new Map<string, number>();
    for (const p of planillas) {
      const mes = p.periodo;
      const total = p.avances.reduce((sum, a) => sum + a.monto, 0);
      ejecutadoPorMes.set(mes, (ejecutadoPorMes.get(mes) || 0) + total);
    }

    return programados.map((p) => {
      const ejecutado = ejecutadoPorMes.get(p.mes) || 0;
      return {
        ...p,
        montoEjecutado: ejecutado,
        diferencia: p.montoProgramado - ejecutado,
        ejecucionPct: p.montoProgramado > 0 ? ejecutado / p.montoProgramado : 0,
      };
    });
  }
}
