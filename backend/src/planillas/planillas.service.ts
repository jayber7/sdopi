import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class PlanillasService {
  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  private include = {
    proyecto: true,
    planillaBase: {
      include: {
        avances: {
          include: { item: { include: { rubro: true } } },
          orderBy: { id: 'asc' as const },
        },
      },
    },
    avances: {
      include: { item: { include: { rubro: true } } },
      orderBy: { id: 'asc' as const },
    },
  } as const;

  async findAll(proyectoId: number) {
    return this.prisma.planillaCAO.findMany({
      where: { proyectoId },
      include: this.include,
      orderBy: { numero: 'asc' },
    });
  }

  async findOne(id: number) {
    const planilla = await this.prisma.planillaCAO.findUnique({ where: { id }, include: this.include });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');

    // ponytail: fetch evidencias in bulk and attach to each avance
    const evidencias = await this.prisma.evidenciaFotografica.findMany({
      where: { planillaId: id },
      select: { avanceItemId: true, verificacionEstado: true },
    });
    const evidenciaMap: Record<number, { count: number; mejorEstado: string; estados: string[] }> = {};
    for (const e of evidencias) {
      if (!evidenciaMap[e.avanceItemId]) {
        evidenciaMap[e.avanceItemId] = { count: 0, mejorEstado: 'PENDIENTE', estados: [] };
      }
      evidenciaMap[e.avanceItemId].count++;
      evidenciaMap[e.avanceItemId].estados.push(e.verificacionEstado);
      const jerarquia = ['RECHAZADO', 'SOSPECHOSO', 'PENDIENTE', 'VERIFICADO'];
      const idx = jerarquia.indexOf(evidenciaMap[e.avanceItemId].mejorEstado);
      const nIdx = jerarquia.indexOf(e.verificacionEstado);
      if (nIdx > idx) evidenciaMap[e.avanceItemId].mejorEstado = e.verificacionEstado;
    }

    const planillaConEvidencia = {
      ...planilla,
      avances: planilla.avances.map((av) => ({
        ...av,
        evidencia: evidenciaMap[av.id] || { count: 0, mejorEstado: null, estados: [] },
      })),
    };

    if (planilla.tipo === 'CAO' && planilla.planillaBaseId) {
      const historico = await this.getHistorial(planilla);
      return { ...planillaConEvidencia, historico };
    }

    return planillaConEvidencia;
  }

  private async getHistorial(planilla: { id: number; numero: number; planillaBaseId: number | null }) {
    if (!planilla.planillaBaseId) return {};
    const previous = await this.prisma.planillaCAO.findMany({
      where: {
        planillaBaseId: planilla.planillaBaseId,
        estado: 'aprobado',
        numero: { lt: planilla.numero },
      },
      include: { avances: true },
    });
    const map: Record<number, { cantidad: number; monto: number }> = {};
    for (const cao of previous) {
      for (const av of cao.avances) {
        if (av.itemId == null) continue;
        const prev = map[av.itemId] || { cantidad: 0, monto: 0 };
        map[av.itemId] = { cantidad: prev.cantidad + av.cantidad, monto: prev.monto + av.monto };
      }
    }
    return map;
  }

  async create(data: {
    proyectoId: number; numero: number; periodo: string; fechaInicio: Date; fechaFin: Date;
    tipo?: 'BASE' | 'CAO'; planillaBaseId?: number;
  }) {
    const tipo = data.tipo || 'CAO';

    if (tipo === 'BASE') {
      return this.prisma.$transaction(async (tx) => {
        const existingBase = await tx.planillaCAO.findFirst({ where: { proyectoId: data.proyectoId, tipo: 'BASE' } });
        if (existingBase) throw new BadRequestException('El proyecto ya tiene una Planilla Base');

        const items = await tx.item.findMany({
          where: { rubro: { proyectoId: data.proyectoId } },
          include: { rubro: true },
          orderBy: { numero: 'asc' },
        });

        return tx.planillaCAO.create({
          data: {
            tipo: 'BASE',
            numero: data.numero,
            periodo: data.periodo,
            fechaInicio: data.fechaInicio,
            fechaFin: data.fechaFin,
            proyectoId: data.proyectoId,
            avances: {
              create: items.map((i) => ({
                itemId: i.id,
                descripcion: i.descripcion,
                unidad: i.unidad,
                precioUnitario: i.precioUnitario,
                cantidadContrato: i.cantidadContrato,
                rubroCodigo: i.rubro.codigo, rubroNombre: i.rubro.nombre,
                cantidad: 0, monto: 0, avancePct: 0,
              })),
            },
          },
          include: this.include,
        });
      });
    }

    if (!data.planillaBaseId) throw new BadRequestException('CAO requiere planillaBaseId');
    throw new BadRequestException('Los CAOs se crean automáticamente al aprobar la planilla anterior');
  }

  async update(id: number, d: { periodo?: string; fechaInicio?: Date; fechaFin?: Date }) {
    return this.prisma.planillaCAO.update({ where: { id }, data: d });
  }

  async updateItems(
    id: number,
    items: {
      avanceId?: number; itemId?: number | null; cantidad: number;
      monto?: number; descripcion?: string; unidad?: string; precioUnitario?: number;
      cantidadContrato?: number; rubroCodigo?: string; rubroNombre?: string;
    }[],
  ) {
    const planilla = await this.prisma.planillaCAO.findUnique({ where: { id } });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');
    if (planilla.estado !== 'borrador') throw new ForbiddenException('Solo se puede editar en estado borrador');

    for (const it of items) {
      if (it.avanceId) {
        const existing = await this.prisma.avanceItem.findUnique({ where: { id: it.avanceId } });
        if (!existing || existing.planillaId !== id) continue;
        const baseItem = it.itemId ? await this.prisma.item.findUnique({ where: { id: it.itemId } }) : null;
        const pu = it.precioUnitario ?? existing.precioUnitario ?? baseItem?.precioUnitario ?? 0;
        const monto = it.monto ?? it.cantidad * pu;
        const cc = (it.cantidadContrato ?? baseItem?.cantidadContrato) || 1;
        const avancePct = cc > 0 ? (it.cantidad / cc) * 100 : 0;
        await this.prisma.avanceItem.update({
          where: { id: it.avanceId },
          data: {
            cantidad: it.cantidad, monto, avancePct,
            ...(it.descripcion !== undefined ? { descripcion: it.descripcion } : {}),
            ...(it.unidad !== undefined ? { unidad: it.unidad } : {}),
            ...(it.precioUnitario !== undefined ? { precioUnitario: it.precioUnitario } : {}),
            ...(it.cantidadContrato !== undefined ? { cantidadContrato: it.cantidadContrato } : {}),
            ...(it.rubroCodigo !== undefined ? { rubroCodigo: it.rubroCodigo } : {}),
            ...(it.rubroNombre !== undefined ? { rubroNombre: it.rubroNombre } : {}),
          },
        });
      } else if (it.itemId) {
        const existing = await this.prisma.avanceItem.findFirst({
          where: { planillaId: id, itemId: it.itemId },
        });
        if (existing) {
          const pu = it.precioUnitario ?? existing.precioUnitario ?? 0;
          const monto = it.monto ?? it.cantidad * pu;
          const cc = (it.cantidadContrato ?? existing.cantidadContrato) || 1;
          const avancePct = cc > 0 ? (it.cantidad / cc) * 100 : 0;
          await this.prisma.avanceItem.update({
            where: { id: existing.id },
            data: { cantidad: it.cantidad, monto, avancePct },
          });
        } else {
          const pu = it.precioUnitario ?? 0;
          const monto = it.monto ?? it.cantidad * pu;
          const cc = it.cantidadContrato || 1;
          const avancePct = cc > 0 ? (it.cantidad / cc) * 100 : 0;
          await this.prisma.avanceItem.create({
            data: {
              planillaId: id, itemId: it.itemId,
              cantidad: it.cantidad, monto, avancePct,
              descripcion: it.descripcion, unidad: it.unidad,
              precioUnitario: it.precioUnitario, cantidadContrato: it.cantidadContrato,
              rubroCodigo: it.rubroCodigo, rubroNombre: it.rubroNombre,
            },
          });
        }
      }
    }

    return this.findOne(id);
  }

  async enviar(id: number, userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { nombre: true } });
    await this.prisma.planillaCAO.update({
      where: { id },
      data: { estado: 'enviado', enviadoPor: user?.nombre ?? 'Desconocido', enviadoEn: new Date(), enviadoPorUserId: userId },
    });
    const planilla = await this.prisma.planillaCAO.findUnique({ where: { id }, select: { numero: true, proyectoId: true } });
    const admins = await this.prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } });
    for (const admin of admins) {
      await this.notificaciones.crear({
        userId: admin.id,
        tipo: 'planilla_enviada',
        mensaje: `${user?.nombre ?? 'Desconocido'} envió la Planilla N°${planilla?.numero}`,
        planillaId: id,
        proyectoId: planilla!.proyectoId,
      });
    }
    return this.findOne(id);
  }

  async pendientes() {
    const planillas = await this.prisma.planillaCAO.findMany({
      where: { estado: 'enviado' },
      select: { id: true, numero: true, periodo: true, enviadoPor: true, enviadoEn: true, proyectoId: true, tipo: true },
      orderBy: { enviadoEn: 'desc' },
    });
    const proyectos = await this.prisma.proyecto.findMany({
      where: { id: { in: [...new Set(planillas.map(p => p.proyectoId))] } },
      select: { id: true, nombre: true, jefatura: true },
    });
    const proyectoMap = Object.fromEntries(proyectos.map(p => [p.id, p]));
    return planillas.map(p => ({ ...p, proyecto: proyectoMap[p.proyectoId] || null }));
  }

  async aprobarItem(id: number, avanceId: number) {
    const avance = await this.prisma.avanceItem.findUnique({ where: { id: avanceId } });
    if (!avance || avance.planillaId !== id) throw new NotFoundException();

    if (!avance.itemId) {
      const proyectoId = (await this.prisma.planillaCAO.findUnique({ where: { id }, select: { proyectoId: true } }))!.proyectoId;
      const maxNum = await this.prisma.item.aggregate({ _max: { numero: true } });
      const existing = await this.prisma.rubro.findFirst({
        where: { proyectoId, codigo: avance.rubroCodigo ?? '' },
      });
      let rubroId = existing?.id;
      if (!rubroId) {
        const newRubro = await this.prisma.rubro.create({
          data: { codigo: avance.rubroCodigo ?? 'EXTRA', nombre: avance.rubroNombre ?? 'EXTRA', proyectoId },
        });
        rubroId = newRubro.id;
      }
      const newItem = await this.prisma.item.create({
        data: {
          numero: (maxNum._max.numero ?? 0) + 1,
          descripcion: avance.descripcion ?? '',
          unidad: avance.unidad ?? '',
          precioUnitario: avance.precioUnitario ?? 0,
          cantidadContrato: avance.cantidadContrato ?? 0,
          montoOriginal: (avance.precioUnitario ?? 0) * (avance.cantidadContrato ?? 0),
          rubroId,
        },
      });
      await this.prisma.avanceItem.update({ where: { id: avanceId }, data: { itemId: newItem.id, aprobado: true } });
    } else {
      await this.prisma.avanceItem.update({ where: { id: avanceId }, data: { aprobado: true } });
    }
    return this.findOne(id);
  }

  async rechazarItem(id: number, avanceId: number, adminUserId: number) {
    const avance = await this.prisma.avanceItem.findUnique({ where: { id: avanceId } });
    if (!avance || avance.planillaId !== id) throw new NotFoundException();
    await this.prisma.avanceItem.update({ where: { id: avanceId }, data: { aprobado: false } });
    const planilla = await this.prisma.planillaCAO.findUnique({ where: { id }, select: { enviadoPorUserId: true, numero: true, proyectoId: true } });
    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId }, select: { nombre: true } });
    if (planilla?.enviadoPorUserId && planilla.enviadoPorUserId !== adminUserId) {
      await this.notificaciones.crear({
        userId: planilla.enviadoPorUserId,
        tipo: 'item_rechazado',
        mensaje: `${admin?.nombre ?? 'Admin'} rechazó un ítem en Planilla N°${planilla.numero}`,
        planillaId: id,
        proyectoId: planilla.proyectoId,
      });
    }
    return this.findOne(id);
  }

  async devolverABorrador(id: number, adminUserId: number) {
    await this.prisma.avanceItem.updateMany({
      where: { planillaId: id, aprobado: false },
      data: { aprobado: null },
    });
    const planilla = await this.prisma.planillaCAO.update({
      where: { id },
      data: { estado: 'borrador' },
      include: this.include,
    });
    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId }, select: { nombre: true } });
    if (planilla.enviadoPorUserId && planilla.enviadoPorUserId !== adminUserId) {
      await this.notificaciones.crear({
        userId: planilla.enviadoPorUserId,
        tipo: 'planilla_devuelta',
        mensaje: `${admin?.nombre ?? 'Admin'} devolvió la Planilla N°${planilla.numero} a borrador`,
        planillaId: id,
        proyectoId: planilla.proyectoId,
      });
    }
    return planilla;
  }

  async aprobarTodos(id: number, force = false, adminUserId?: number) {
    const skipEvidenceCheck = process.env.SKIP_EVIDENCE_CHECK === 'true';
    if (!force && !skipEvidenceCheck) {
      const itemsSinEvidencia = await this.prisma.avanceItem.findMany({
        where: {
          planillaId: id,
          itemId: { not: null },
          NOT: { evidencias: { some: { verificacionEstado: 'VERIFICADO' } } },
        },
        include: { item: true },
      });
      if (itemsSinEvidencia.length > 0) {
        const descs = itemsSinEvidencia.map((a) => `N°${a.item?.numero ?? '?'}`).join(', ');
        throw new BadRequestException(
          `Todos los ítems del catálogo deben tener evidencia fotográfica verificada. Items pendientes: ${descs}`,
        );
      }
    }

    const avances = await this.prisma.avanceItem.findMany({
      where: { planillaId: id, itemId: null, aprobado: { not: true } },
    });
    for (const avance of avances) {
      try { await this.aprobarItem(id, avance.id); } catch { /* skip */ }
    }
    await this.prisma.avanceItem.updateMany({
      where: { planillaId: id, OR: [{ aprobado: null }, { aprobado: false }] },
      data: { aprobado: true },
    });
    await this.prisma.planillaCAO.update({ where: { id }, data: { estado: 'aprobado' } });

    const planilla = await this.prisma.planillaCAO.findUnique({ where: { id }, include: { avances: true } });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');
    const baseId = planilla.tipo === 'BASE' ? planilla.id : planilla.planillaBaseId;
    if (baseId) {
      const base = planilla.tipo === 'BASE' ? planilla : await this.prisma.planillaCAO.findUnique({ where: { id: baseId }, include: { avances: true } });
      if (base) {
        const max = await this.prisma.planillaCAO.aggregate({ where: { planillaBaseId: baseId, tipo: 'CAO' }, _max: { numero: true } });
        const nextNum = (max._max.numero ?? 0) + 1;
        try {
          await this.prisma.planillaCAO.create({
            data: {
              tipo: 'CAO', planillaBaseId: baseId, numero: nextNum,
              periodo: '', fechaInicio: base.fechaInicio, fechaFin: base.fechaFin,
              proyectoId: planilla.proyectoId,
              avances: { create: base.avances.map((a) => ({
                itemId: a.itemId, descripcion: a.descripcion, unidad: a.unidad,
                precioUnitario: a.precioUnitario, cantidadContrato: a.cantidadContrato,
                rubroCodigo: a.rubroCodigo, rubroNombre: a.rubroNombre,
                cantidad: 0, monto: 0, avancePct: 0,
              })) },
            },
          });
        } catch {
          // ponytail: CAO ya existe (unique constraint), omitir
        }
      }
    }

    return this.findOne(id);
  }

  async syncFromItems(id: number) {
    const planilla = await this.prisma.planillaCAO.findUnique({ where: { id } });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');
    if (planilla.tipo !== 'BASE') throw new BadRequestException('Solo Planillas Base pueden sincronizarse');
    if (planilla.estado !== 'borrador') throw new ForbiddenException('Solo se puede sincronizar en estado borrador');

    const items = await this.prisma.item.findMany({
      where: { rubro: { proyectoId: planilla.proyectoId } },
      include: { rubro: true },
      orderBy: { numero: 'asc' },
    });

    const existingAvances = await this.prisma.avanceItem.findMany({
      where: { planillaId: id, itemId: { not: null } },
    });
    const existingByItemId = new Map(existingAvances.map(a => [a.itemId!, a]));

    const itemIds = new Set(items.map(i => i.id));
    for (const av of existingAvances) {
      if (!itemIds.has(av.itemId!)) {
        await this.prisma.avanceItem.delete({ where: { id: av.id } });
      }
    }

    for (const item of items) {
      const existing = existingByItemId.get(item.id);
      if (existing && (!existing.rubroCodigo || !existing.rubroNombre)) {
        await this.prisma.avanceItem.update({
          where: { id: existing.id },
          data: { rubroCodigo: item.rubro.codigo, rubroNombre: item.rubro.nombre },
        });
      }
    }

    for (const item of items) {
      if (!existingByItemId.has(item.id)) {
        await this.prisma.avanceItem.create({
          data: {
            planillaId: id, itemId: item.id,
            cantidad: 0, monto: 0, avancePct: 0,
            descripcion: item.descripcion, unidad: item.unidad,
            precioUnitario: item.precioUnitario, cantidadContrato: item.cantidadContrato,
            rubroCodigo: item.rubro.codigo, rubroNombre: item.rubro.nombre,
          },
        });
      }
    }

    return this.findOne(id);
  }

  async removeItem(id: number, avanceId: number) {
    const planilla = await this.prisma.planillaCAO.findUnique({ where: { id } });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');
    if (planilla.estado !== 'borrador') throw new ForbiddenException('Solo se puede editar en estado borrador');
    const avance = await this.prisma.avanceItem.findUnique({ where: { id: avanceId } });
    if (!avance || avance.planillaId !== id) throw new NotFoundException();
    await this.prisma.avanceItem.delete({ where: { id: avanceId } });
    return this.findOne(id);
  }

  async syncAllBases() {
    const proyectos = await this.prisma.proyecto.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, ordenProceder: true, fechaConclusion: true },
    });

    let basesCreated = 0;
    let basesSynced = 0;
    let totalItemsCreated = 0;
    const errors: { proyectoId: number; error: string }[] = [];

    for (const proyecto of proyectos) {
      try {
        let base = await this.prisma.planillaCAO.findFirst({
          where: { proyectoId: proyecto.id, tipo: 'BASE' },
        });

        if (!base) {
          base = await this.prisma.planillaCAO.create({
            data: {
              tipo: 'BASE', numero: 0,
              periodo: 'PLANILLA BASE - DATOS DE CONTRATO',
              fechaInicio: proyecto.ordenProceder ?? new Date(),
              fechaFin: proyecto.fechaConclusion ?? new Date(),
              proyectoId: proyecto.id,
            },
          });
          basesCreated++;
        } else if (base.estado !== 'borrador') {
          continue;
        }

        const items = await this.prisma.item.findMany({
          where: { rubro: { proyectoId: proyecto.id } },
          include: { rubro: true },
        });
        if (items.length === 0) continue;

        const existingAvances = await this.prisma.avanceItem.findMany({
          where: { planillaId: base.id, itemId: { not: null } },
        });
        const existingByItemId = new Set(existingAvances.map(a => a.itemId!));

        let created = 0;
        for (const item of items) {
          if (!existingByItemId.has(item.id)) {
            await this.prisma.avanceItem.create({
              data: {
                planillaId: base.id, itemId: item.id,
                cantidad: 0, monto: 0, avancePct: 0,
                descripcion: item.descripcion, unidad: item.unidad,
                precioUnitario: item.precioUnitario, cantidadContrato: item.cantidadContrato,
                rubroCodigo: item.rubro.codigo, rubroNombre: item.rubro.nombre,
              },
            });
            created++;
          }
        }

        if (created > 0) {
          basesSynced++;
          totalItemsCreated += created;
        }
      } catch (e: any) {
        errors.push({ proyectoId: proyecto.id, error: e.message });
      }
    }

    return { basesCreated, basesSynced, totalItemsCreated, errors };
  }

  async manualCao(data: { proyectoId: number; planillaBaseId: number; numero: number; periodo: string; fechaInicio: Date; fechaFin: Date }) {
    const base = await this.prisma.planillaCAO.findUnique({ where: { id: data.planillaBaseId } });
    if (!base || base.tipo !== 'BASE') throw new BadRequestException('Planilla Base no encontrada');
    if (base.estado !== 'aprobado') throw new BadRequestException('La Planilla Base debe estar aprobada');

    const existing = await this.prisma.planillaCAO.findFirst({
      where: { planillaBaseId: data.planillaBaseId, numero: data.numero },
    });
    if (existing) throw new BadRequestException(`Ya existe una CAO N°${data.numero} para esta Base`);

    const baseItems = await this.prisma.avanceItem.findMany({
      where: { planillaId: data.planillaBaseId, itemId: { not: null } },
    });

    return this.prisma.planillaCAO.create({
      data: {
        tipo: 'CAO',
        numero: data.numero,
        periodo: data.periodo,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        proyectoId: data.proyectoId,
        planillaBaseId: data.planillaBaseId,
        avances: {
          create: baseItems.map((a) => ({
            itemId: a.itemId, descripcion: a.descripcion, unidad: a.unidad,
            precioUnitario: a.precioUnitario, cantidadContrato: a.cantidadContrato,
            rubroCodigo: a.rubroCodigo, rubroNombre: a.rubroNombre,
            cantidad: 0, monto: 0, avancePct: 0,
          })),
        },
      },
      include: this.include,
    });
  }

  async cleanupOrphans(proyectoId?: number) {
    const where: any = { itemId: null, rubroCodigo: null, descripcion: null };
    if (proyectoId) where.planilla = { proyectoId };
    const { count } = await this.prisma.avanceItem.deleteMany({ where });
    return { deleted: count };
  }

  async remove(id: number) {
    const planilla = await this.prisma.planillaCAO.findUnique({
      where: { id },
      include: { _count: { select: { derivados: true } } },
    });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');
    if (planilla.estado !== 'borrador') throw new ForbiddenException('Solo se puede eliminar en estado borrador');
    if (planilla.tipo === 'BASE' && planilla._count.derivados > 0) {
      throw new BadRequestException('No se puede eliminar la Planilla Base porque tiene CAOs vinculados');
    }
    await this.prisma.avanceItem.deleteMany({ where: { planillaId: id } });
    return this.prisma.planillaCAO.delete({ where: { id } });
  }
}
