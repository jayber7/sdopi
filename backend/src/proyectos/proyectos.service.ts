import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Jefatura } from '@prisma/client';

@Injectable()
export class ProyectosService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const [proyectos, planillas, multas, evidencias] = await Promise.all([
      this.prisma.proyecto.findMany({
        where: { activo: true },
        select: {
          id: true, nombre: true, jefatura: true, situacion: true,
          montoContrato: true, fechaConclusion: true, ordenProceder: true,
        },
      }),
      this.prisma.planillaCAO.findMany({
        where: { NOT: { tipo: 'BASE' } },
        select: { estado: true, proyectoId: true, avances: { select: { monto: true } } },
      }),
      this.prisma.multa.aggregate({ _sum: { monto: true } }),
      this.prisma.evidenciaFotografica.groupBy({
        by: ['verificacionEstado'], _count: true,
      }),
    ]);

    const montoContratadoTotal = proyectos.reduce((s, p) => s + p.montoContrato, 0);
    const montoEjecutadoTotal = planillas.reduce((s, pl) => s + pl.avances.reduce((a, av) => a + av.monto, 0), 0);
    const avanceFisicoPromedio = montoContratadoTotal > 0 ? montoEjecutadoTotal / montoContratadoTotal : 0;

    const totalPlanillas = planillas.length;
    const planillasPorEstado: Record<string, number> = {};
    for (const pl of planillas) {
      planillasPorEstado[pl.estado] = (planillasPorEstado[pl.estado] || 0) + 1;
    }

    const jefaturaCount: Record<string, number> = {};
    const situacionCount: Record<string, number> = {};
    const hoy = new Date();
    let proyectosAtrasados = 0;
    let proyectosSinAtraso = 0;

    for (const p of proyectos) {
      jefaturaCount[p.jefatura] = (jefaturaCount[p.jefatura] || 0) + 1;
      const sit = p.situacion || 'SIN_ASIGNAR';
      situacionCount[sit] = (situacionCount[sit] || 0) + 1;
      if (p.fechaConclusion && p.fechaConclusion < hoy && p.situacion !== 'CONCLUIDO') {
        proyectosAtrasados++;
      } else {
        proyectosSinAtraso++;
      }
    }

    const evidenciasPorEstado: Record<string, number> = {};
    for (const e of evidencias) {
      evidenciasPorEstado[e.verificacionEstado] = e._count;
    }

    return {
      totalProyectos: proyectos.length,
      montoContratadoTotal,
      montoEjecutadoTotal,
      avanceFisicoPromedio: Math.round(avanceFisicoPromedio * 10000) / 10000,
      proyectosAtrasados,
      proyectosSinAtraso,
      jefaturaCount,
      situacionCount,
      totalPlanillas,
      planillasPorEstado,
      totalMultas: multas._sum.monto || 0,
      evidenciasPorEstado,
    };
  }

  async findAll(municipio?: string, provincia?: string, jefatura?: Jefatura) {
    const proyectos = await this.prisma.proyecto.findMany({
      where: {
        activo: true,
        ...(municipio && { municipio }),
        ...(provincia && { provincia }),
        ...(jefatura && { jefatura }),
      },
      include: {
        rubros: {
          include: { items: { select: { id: true, numero: true, descripcion: true, unidad: true, precioUnitario: true, cantidadContrato: true, montoOriginal: true } } },
        },
        planillas: {
          where: { NOT: { tipo: 'BASE' } },
          include: { avances: { select: { monto: true } } },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return proyectos.map(({ planillas, ...p }) => {
      const montoContrato = p.montoContrato;
      const anticipoPct = p.anticipoPct;
      const anticipoMonto = p.anticipoMonto ?? Math.round(montoContrato * (anticipoPct / 100) * 100) / 100;

      let totalDesembolso = 0;
      let totalLiquido = anticipoMonto;

      for (const pl of planillas) {
        const periodoDesembolso = pl.avances.reduce((s, a) => s + a.monto, 0);
        const periodoDescuento = periodoDesembolso * (anticipoPct / 100);
        const periodoLiquido = periodoDesembolso - periodoDescuento;
        totalDesembolso += periodoDesembolso;
        totalLiquido += periodoLiquido;
      }

      const avanceFisico = montoContrato > 0
        ? Math.round((totalDesembolso / montoContrato) * 10000) / 10000
        : 0;
      const avanceFinanciero = montoContrato > 0
        ? Math.round((totalLiquido / montoContrato) * 10000) / 10000
        : 0;

      return { ...p, avanceFisico, avanceFinanciero };
    });
  }

  contarPorMunicipio(jefatura?: Jefatura) {
    return this.prisma.proyecto.groupBy({
      by: ['municipio'],
      where: {
        activo: true,
        municipio: { not: null },
        ...(jefatura && { jefatura }),
      },
      _count: { municipio: true },
    });
  }

  findOne(id: number) {
    return this.findOneOrThrow(id);
  }

  private async findOneOrThrow(id: number) {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id },
      include: {
        rubros: {
          include: { items: { include: { avances: true } } },
          orderBy: { codigo: 'asc' },
        },
        planillas: { orderBy: { numero: 'desc' } },
      },
    });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    return proyecto;
  }

  async create(data: {
    nombre: string; contratoNro: string; montoContrato: number;
    anticipoPct?: number; anticipoMonto?: number; ordenProceder: string; fechaConclusion: string;
    suspendidoDias?: number; direccion: string;
    latitud?: number; longitud?: number;
    contratista: string; supervisor: string; fiscal: string;
    jefatura?: string;
  }) {
    const ordenProceder = new Date(data.ordenProceder);
    const fechaConclusion = new Date(data.fechaConclusion);
    const proyecto = await this.prisma.proyecto.create({
      data: {
        ...data,
        ordenProceder,
        fechaConclusion,
        jefatura: (data.jefatura ?? 'DI') as any,
      },
      include: { rubros: true },
    });

    await this.prisma.planillaCAO.create({
      data: {
        tipo: 'BASE', numero: 0,
        periodo: 'PLANILLA BASE - DATOS DE CONTRATO',
        fechaInicio: ordenProceder,
        fechaFin: fechaConclusion,
        proyectoId: proyecto.id,
      },
    });

    return proyecto;
  }

  async update(id: number, data: any) {
    await this.findOneOrThrow(id);
    const payload: any = { ...data };
    if (data.ordenProceder) payload.ordenProceder = new Date(data.ordenProceder);
    if (data.fechaConclusion) payload.fechaConclusion = new Date(data.fechaConclusion);
    return this.prisma.proyecto.update({
      where: { id },
      data: payload,
      include: { rubros: true, planillas: { orderBy: { numero: 'desc' } } },
    });
  }

  async softDelete(id: number) {
    await this.findOneOrThrow(id);
    return this.prisma.proyecto.update({
      where: { id },
      data: { activo: false },
    });
  }
}
