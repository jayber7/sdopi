import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProyectosService {
  constructor(private prisma: PrismaService) {}

  findAll(municipio?: string, provincia?: string) {
    return this.prisma.proyecto.findMany({
      where: {
        activo: true,
        ...(municipio && { municipio }),
        ...(provincia && { provincia }),
      },
      include: {
        rubros: {
          include: { items: { select: { id: true, numero: true, descripcion: true, unidad: true, precioUnitario: true, cantidadContrato: true, montoOriginal: true } } },
        },
      },
      orderBy: { nombre: 'asc' },
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
    anticipoPct?: number; ordenProceder: string; fechaConclusion: string;
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
