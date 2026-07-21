import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificacionesService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: { userId: number; tipo: string; mensaje: string; planillaId: number; proyectoId: number }) {
    return this.prisma.notificacion.create({ data: dto });
  }

  async obtenerNoLeidas(userId: number) {
    return this.prisma.notificacion.findMany({
      where: { userId, leida: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async marcarLeida(id: number, userId: number) {
    return this.prisma.notificacion.updateMany({
      where: { id, userId },
      data: { leida: true },
    });
  }

  async marcarTodasLeidas(userId: number) {
    return this.prisma.notificacion.updateMany({
      where: { userId, leida: false },
      data: { leida: true },
    });
  }
}
