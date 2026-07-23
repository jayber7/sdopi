import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BoletasService {
  constructor(private prisma: PrismaService) {}

  async findAll(proyectoId: number) {
    return this.prisma.boleta.findMany({ where: { proyectoId }, orderBy: { id: 'asc' } });
  }

  async create(data: { proyectoId: number; numero: string; fecha: string; vigencia: string; vencimiento: string }) {
    return this.prisma.boleta.create({
      data: { ...data, fecha: new Date(data.fecha), vigencia: new Date(data.vigencia), vencimiento: new Date(data.vencimiento) },
    });
  }

  async update(id: number, data: { numero?: string; fecha?: string; vigencia?: string; vencimiento?: string }) {
    const updateData: any = { ...data };
    if (data.fecha) updateData.fecha = new Date(data.fecha);
    if (data.vigencia) updateData.vigencia = new Date(data.vigencia);
    if (data.vencimiento) updateData.vencimiento = new Date(data.vencimiento);
    return this.prisma.boleta.update({ where: { id }, data: updateData });
  }

  async remove(id: number) {
    return this.prisma.boleta.delete({ where: { id } });
  }

  async nextNumero(proyectoId: number) {
    const last = await this.prisma.boleta.findFirst({ where: { proyectoId }, orderBy: { id: 'desc' } });
    const n = last ? parseInt(last.numero.split('-')[1]) + 1 : 1;
    return { numero: `BG-${String(n).padStart(4, '0')}` };
  }
}
