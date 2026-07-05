import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CatalogController {
  constructor(private prisma: PrismaService) {}

  // --- Catálogo de rubros ---

  @Get('catalogo/rubros')
  catalogoRubros(@Query('jefatura') jefatura?: string) {
    const where: any = jefatura ? { jefatura } : {};
    return this.prisma.rubroCatalogo.findMany({
      where,
      include: { _count: { select: { items: true } } },
      orderBy: { nombre: 'asc' },
    });
  }

  @Get('catalogo/rubros/:id/items')
  catalogoItems(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.itemCatalogo.findMany({
      where: { rubroCatalogoId: id },
      orderBy: { numero: 'asc' },
    });
  }

  @Roles('admin', 'operador')
  @Post('proyectos/:id/importar-items')
  async importarItems(
    @Param('id', ParseIntPipe) proyectoId: number,
    @Body() body: { rubros: { rubroCatalogoId: number; itemCatalogoIds: number[] }[] },
  ) {
    const rubrosExistentes = await this.prisma.rubro.count({ where: { proyectoId } });
    for (let idx = 0; idx < body.rubros.length; idx++) {
      const r = body.rubros[idx];
      const cat = await this.prisma.rubroCatalogo.findUnique({
        where: { id: r.rubroCatalogoId },
        include: { items: { where: { id: { in: r.itemCatalogoIds } } } },
      });
      if (!cat) continue;

      const codigo = `M${String(rubrosExistentes + idx + 1).padStart(2, '0')}`;
      const rubro = await this.prisma.rubro.create({
        data: { codigo, nombre: cat.nombre, proyectoId },
      });

      if (cat.items.length > 0) {
        await this.prisma.item.createMany({
          data: cat.items.map((ci) => ({
            rubroId: rubro.id,
            numero: ci.numero,
            descripcion: ci.descripcion,
            unidad: ci.unidad,
            precioUnitario: 0,
            cantidadContrato: 0,
            montoOriginal: 0,
          })),
        });
      }
    }

    // sync BASE planilla with newly imported items
    const base = await this.prisma.planillaCAO.findFirst({
      where: { proyectoId, tipo: 'BASE', estado: 'borrador' },
    });
    if (base) {
      const items = await this.prisma.item.findMany({
        where: { rubro: { proyectoId } },
      });
      const existingAvances = await this.prisma.avanceItem.findMany({
        where: { planillaId: base.id, itemId: { not: null } },
      });
      const existingByItemId = new Set(existingAvances.map(a => a.itemId!));
      for (const item of items) {
        if (!existingByItemId.has(item.id)) {
          await this.prisma.avanceItem.create({
            data: {
              planillaId: base.id, itemId: item.id,
              descripcion: item.descripcion, unidad: item.unidad,
              precioUnitario: item.precioUnitario, cantidadContrato: item.cantidadContrato,
              cantidad: 0, monto: 0, avancePct: 0,
            },
          });
        }
      }
    }

    return { imported: body.rubros.length };
  }

  @Roles('admin', 'operador')
  @Post('catalogo/importar-csv')
  async importarCsv(@Body() body: { jefatura: string; csv: string }) {
    const lines = body.csv.split('\n').map(l => l.trim()).filter(Boolean);
    const jefatura = body.jefatura.toUpperCase() as any;
    let rubrosCreados = 0;
    let rubrosExistentes = 0;
    let itemsAgregados = 0;
    const prisma = this.prisma;

    const parseLine = (line: string): { isRubro: boolean; nombre?: string; descripcion?: string; unidad?: string } => {
      const parts = line.split(',');
      if (parts.length === 2 && parts[1] === '') {
        return { isRubro: true, nombre: parts[0].trim() };
      }
      if (parts.length >= 2) {
        let desc = parts.slice(0, -1).join(',').trim();
        if (desc.startsWith('"') && desc.endsWith('"')) desc = desc.slice(1, -1);
        return { isRubro: false, descripcion: desc, unidad: parts[parts.length - 1].trim() };
      }
      return { isRubro: false };
    };

    const flushRubro = async (nombre: string, items: { descripcion: string; unidad: string }[]) => {
      let cat = await prisma.rubroCatalogo.findFirst({
        where: { jefatura, nombre },
        include: { items: { select: { descripcion: true } } },
      });
      if (cat) {
        rubrosExistentes++;
        const existingDescs = new Set(cat.items.map(i => i.descripcion));
        const newItems = items.filter(i => !existingDescs.has(i.descripcion));
        if (newItems.length > 0) {
          const maxNum = await prisma.itemCatalogo.aggregate({
            where: { rubroCatalogoId: cat.id },
            _max: { numero: true },
          });
          let nextNum = (maxNum._max.numero ?? 0) + 1;
          await prisma.itemCatalogo.createMany({
            data: newItems.map(i => ({ rubroCatalogoId: cat.id, numero: nextNum++, descripcion: i.descripcion, unidad: i.unidad })),
          });
          itemsAgregados += newItems.length;
        }
      } else {
        rubrosCreados++;
        await prisma.rubroCatalogo.create({
          data: { jefatura, nombre, items: { create: items.map((i, idx) => ({ numero: idx + 1, descripcion: i.descripcion, unidad: i.unidad })) } },
        });
        itemsAgregados += items.length;
      }
    };

    let currentNombre: string | null = null;
    const itemsBuffer: { descripcion: string; unidad: string }[] = [];

    for (const line of lines) {
      const parsed = parseLine(line);
      if (parsed.isRubro && parsed.nombre) {
        if (currentNombre && itemsBuffer.length > 0) {
          await flushRubro(currentNombre, itemsBuffer);
        }
        currentNombre = parsed.nombre;
        itemsBuffer.length = 0;
      } else if (parsed.descripcion && parsed.unidad) {
        itemsBuffer.push({ descripcion: parsed.descripcion, unidad: parsed.unidad });
      }
    }
    if (currentNombre && itemsBuffer.length > 0) {
      await flushRubro(currentNombre, itemsBuffer);
    }

    return { rubrosCreados, rubrosExistentes, itemsAgregados };
  }

  // --- Catálogo CRUD ---

  @Roles('admin', 'operador')
  @Post('catalogo/rubros')
  createCatalogoRubro(@Body() body: { jefatura: string; nombre: string }) {
    return this.prisma.rubroCatalogo.create({ data: { jefatura: body.jefatura as any, nombre: body.nombre } });
  }

  @Roles('admin', 'operador')
  @Patch('catalogo/rubros/:id')
  updateCatalogoRubro(@Param('id', ParseIntPipe) id: number, @Body() body: { jefatura?: string; nombre?: string }) {
    const data: any = { ...body };
    if (body.jefatura) data.jefatura = body.jefatura as any;
    return this.prisma.rubroCatalogo.update({ where: { id }, data });
  }

  @Roles('admin', 'operador')
  @Delete('catalogo/rubros/:id')
  async deleteCatalogoRubro(@Param('id', ParseIntPipe) id: number) {
    await this.prisma.itemCatalogo.deleteMany({ where: { rubroCatalogoId: id } });
    return this.prisma.rubroCatalogo.delete({ where: { id } });
  }

  @Roles('admin', 'operador')
  @Post('catalogo/rubros/:id/items')
  createCatalogoItem(@Param('id', ParseIntPipe) rubroCatalogoId: number, @Body() body: { numero: number; descripcion: string; unidad: string }) {
    return this.prisma.itemCatalogo.create({ data: { ...body, rubroCatalogoId } });
  }

  @Roles('admin', 'operador')
  @Patch('catalogo/items/:id')
  updateCatalogoItem(@Param('id', ParseIntPipe) id: number, @Body() body: { numero?: number; descripcion?: string; unidad?: string }) {
    return this.prisma.itemCatalogo.update({ where: { id }, data: body });
  }

  @Roles('admin', 'operador')
  @Delete('catalogo/items/:id')
  deleteCatalogoItem(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.itemCatalogo.delete({ where: { id } });
  }

  // --- Rubros ---

  @Roles('admin', 'operador')
  @Post('rubros')
  createRubro(@Body() body: { codigo: string; nombre: string; proyectoId: number }) {
    return this.prisma.rubro.create({ data: body });
  }

  @Roles('admin', 'operador')
  @Patch('rubros/:id')
  updateRubro(@Param('id', ParseIntPipe) id: number, @Body() body: { codigo?: string; nombre?: string }) {
    return this.prisma.rubro.update({ where: { id }, data: body });
  }

  @Roles('admin', 'operador')
  @Delete('rubros/:id')
  async deleteRubro(@Param('id', ParseIntPipe) id: number) {
    const noBorrador = await this.prisma.avanceItem.count({
      where: { item: { rubroId: id }, planilla: { estado: { not: 'borrador' } } }
    });
    if (noBorrador > 0)
      throw new BadRequestException('No se puede eliminar el rubro porque tiene items vinculados a planillas');
    await this.prisma.avanceItem.deleteMany({
      where: { item: { rubroId: id }, planilla: { estado: 'borrador' } }
    });
    await this.prisma.item.deleteMany({ where: { rubroId: id } });
    return this.prisma.rubro.delete({ where: { id } });
  }

  // --- Items ---

  @Roles('admin', 'operador')
  @Post('items')
  createItem(@Body() body: { rubroId: number; numero: number; descripcion: string; unidad: string; precioUnitario: number; cantidadContrato: number }) {
    return this.prisma.item.create({
      data: { ...body, montoOriginal: body.precioUnitario * body.cantidadContrato },
    });
  }

  @Roles('admin', 'operador')
  @Patch('items/:id')
  async updateItem(@Param('id', ParseIntPipe) id: number, @Body() body: { numero?: number; descripcion?: string; unidad?: string; precioUnitario?: number; cantidadContrato?: number }) {
    const data: any = { ...body };
    if (body.precioUnitario !== undefined || body.cantidadContrato !== undefined) {
      const item = await this.prisma.item.findUnique({ where: { id } });
      if (item) data.montoOriginal = (body.precioUnitario ?? item.precioUnitario) * (body.cantidadContrato ?? item.cantidadContrato);
    }
    return this.prisma.item.update({ where: { id }, data });
  }

  @Roles('admin', 'operador')
  @Delete('items/:id')
  async deleteItem(@Param('id', ParseIntPipe) id: number) {
    const noBorrador = await this.prisma.avanceItem.count({
      where: { itemId: id, planilla: { estado: { not: 'borrador' } } }
    });
    if (noBorrador > 0)
      throw new BadRequestException(
        'No se puede eliminar el item porque está vinculado a planillas'
      );
    const item = await this.prisma.item.findUnique({ where: { id }, select: { rubroId: true } });
    if (!item) throw new BadRequestException('Item no encontrado');
    await this.prisma.avanceItem.deleteMany({
      where: { itemId: id, planilla: { estado: 'borrador' } }
    });
    await this.prisma.item.delete({ where: { id } });
    const remaining = await this.prisma.item.count({ where: { rubroId: item.rubroId } });
    if (remaining === 0) {
      await this.prisma.rubro.delete({ where: { id: item.rubroId } });
    }
    return { deleted: true };
  }
}
