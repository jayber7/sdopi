import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExifExtractorService } from './services/exif-extractor.service';
import { GeoVerificationService } from './services/geo-verification.service';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';
import { UploadFotoDto, RechazarEvidenciaDto } from './dto/upload-foto.dto';
import { EstadoEvidencia } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class EvidenciaService {
  constructor(
    private prisma: PrismaService,
    private exifExtractor: ExifExtractorService,
    private geoVerification: GeoVerificationService,
  ) {}

  async upload(
    planillaId: number,
    avanceItemId: number,
    file: Express.Multer.File,
    dto: UploadFotoDto,
    userId: number,
  ) {
    const planilla = await this.prisma.planillaCAO.findUnique({ where: { id: planillaId } });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');
    if (planilla.estado !== 'borrador') {
      throw new ForbiddenException('No se pueden agregar fotos a una planilla que no está en borrador');
    }

    const avanceItem = await this.prisma.avanceItem.findUnique({
      where: { id: avanceItemId },
      include: { item: true, planilla: { include: { proyecto: true } } },
    });
    if (!avanceItem || avanceItem.planillaId !== planillaId) {
      throw new NotFoundException('Item de avance no encontrado en esta planilla');
    }
    if (!avanceItem.itemId) {
      throw new BadRequestException('Solo los ítems del catálogo pueden tener evidencia fotográfica');
    }

    const proyecto = avanceItem.planilla.proyecto;
    if (proyecto.latitud == null || proyecto.longitud == null) {
      throw new BadRequestException('El proyecto no tiene coordenadas configuradas');
    }

    // Upload to Cloudinary
    const filename = `evidencia_${planillaId}_${avanceItemId}_${Date.now()}`;
    const { url, publicId } = await uploadToCloudinary(file.buffer, filename);

    // Extract EXIF
    const exif = await this.exifExtractor.extract(file.buffer);

    // Geo-verification: EXIF primary, browser fallback
    const verification = this.geoVerification.verify({
      exifLat: exif?.latitud,
      exifLng: exif?.longitud,
      browserGpsLat: dto.browserGpsLat ?? null,
      browserGpsLng: dto.browserGpsLng ?? null,
      proyectoLat: proyecto.latitud,
      proyectoLng: proyecto.longitud,
      radio: dto.radio ?? 500,
    });

    return this.prisma.evidenciaFotografica.create({
      data: {
        url,
        publicId,
        exifLatitud: exif?.latitud ?? null,
        exifLongitud: exif?.longitud ?? null,
        exifAltitud: exif?.altitud ?? null,
        exifFechaCaptura: exif?.fechaCaptura ?? null,
        exifDispositivo: exif?.dispositivo ?? null,
        exifModeloCamara: exif?.modeloCamara ?? null,
        exifTieneGPS: exif?.tieneGPS ?? false,
        verificacionEstado: verification.estado as EstadoEvidencia,
        verificacionDistancia: verification.distancia,
        verificacionRadio: verification.radio,
        verificacionFuente: verification.fuente,
        verificacionObservaciones: verification.observaciones,
        categoria: dto.categoria as any ?? 'VISTA_GENERAL',
        descripcion: dto.descripcion ?? null,
        avanceItem: { connect: { id: avanceItemId } },
        planilla: { connect: { id: planillaId } },
        user: { connect: { id: userId } },
      },
      include: { avanceItem: true, user: { select: { id: true, nombre: true } } },
    });
  }

  async findByPlanilla(planillaId: number) {
    const planilla = await this.prisma.planillaCAO.findUnique({ where: { id: planillaId } });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');

    return this.prisma.evidenciaFotografica.findMany({
      where: { planillaId },
      include: {
        avanceItem: { include: { item: true } },
        user: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async stats(planillaId: number) {
    const planilla = await this.prisma.planillaCAO.findUnique({
      where: { id: planillaId },
      include: { avances: { where: { itemId: { not: null } } } },
    });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');

    const evidencias = await this.prisma.evidenciaFotografica.findMany({
      where: { planillaId },
      select: { id: true, avanceItemId: true, verificacionEstado: true },
    });

    const itemsTotal = planilla.avances.length;
    const porItem: Record<number, { count: number; mejorEstado: string | null }> = {};
    const itemsConEvidencia = new Set<number>();

    for (const e of evidencias) {
      itemsConEvidencia.add(e.avanceItemId);
      if (!porItem[e.avanceItemId]) {
        porItem[e.avanceItemId] = { count: 0, mejorEstado: null };
      }
      porItem[e.avanceItemId].count++;
      const estadoJerarquia = ['RECHAZADO', 'SOSPECHOSO', 'PENDIENTE', 'VERIFICADO'];
      const currentIdx = estadoJerarquia.indexOf(porItem[e.avanceItemId].mejorEstado ?? '');
      const newIdx = estadoJerarquia.indexOf(e.verificacionEstado);
      if (newIdx > currentIdx) {
        porItem[e.avanceItemId].mejorEstado = e.verificacionEstado;
      }
    }

    for (const av of planilla.avances) {
      if (!porItem[av.id]) {
        porItem[av.id] = { count: 0, mejorEstado: null };
      }
    }

    const estados = evidencias.map((e) => e.verificacionEstado);
    const total = evidencias.length;
    const itemsSinEvidencia = itemsTotal - itemsConEvidencia.size;

    return {
      total,
      verificadas: estados.filter((e) => e === 'VERIFICADO').length,
      sospechosas: estados.filter((e) => e === 'SOSPECHOSO').length,
      rechazadas: estados.filter((e) => e === 'RECHAZADO').length,
      pendientes: estados.filter((e) => e === 'PENDIENTE').length,
      itemsSinEvidencia,
      itemsTotal,
      porItem,
    };
  }

  async findOne(id: number) {
    const evidencia = await this.prisma.evidenciaFotografica.findUnique({
      where: { id },
      include: {
        avanceItem: { include: { item: true } },
        user: { select: { id: true, nombre: true } },
      },
    });
    if (!evidencia) throw new NotFoundException('Evidencia no encontrada');
    return evidencia;
  }

  async remove(id: number, user?: any) {
    const evidencia = await this.prisma.evidenciaFotografica.findUnique({ where: { id } });
    if (!evidencia) throw new NotFoundException('Evidencia no encontrada');
    if (user?.role === 'operador' && evidencia.userId !== user.userId) {
      throw new ForbiddenException('No puedes eliminar una evidencia que no te pertenece');
    }
    await deleteFromCloudinary(evidencia.publicId);
    await this.prisma.evidenciaFotografica.delete({ where: { id } });
    return { message: 'Evidencia eliminada' };
  }

  async rechazar(id: number, dto: RechazarEvidenciaDto) {
    const evidencia = await this.prisma.evidenciaFotografica.findUnique({ where: { id } });
    if (!evidencia) throw new NotFoundException('Evidencia no encontrada');
    if (evidencia.verificacionEstado === 'RECHAZADO') {
      throw new BadRequestException('La evidencia ya está rechazada');
    }
    return this.prisma.evidenciaFotografica.update({
      where: { id },
      data: {
        verificacionEstado: 'RECHAZADO',
        verificacionObservaciones: dto.observaciones,
      },
      include: {
        avanceItem: { include: { item: true } },
        user: { select: { id: true, nombre: true } },
      },
    });
  }

  async restaurar(id: number) {
    const evidencia = await this.prisma.evidenciaFotografica.findUnique({ where: { id } });
    if (!evidencia) throw new NotFoundException('Evidencia no encontrada');
    if (evidencia.verificacionEstado !== 'RECHAZADO') {
      throw new BadRequestException('Solo se puede restaurar una evidencia rechazada');
    }
    // Si tiene GPS, restaurar a VERIFICADO/SOSPECHOSO; si no, PENDIENTE
    const estadoAnterior = evidencia.exifTieneGPS
      ? (evidencia.verificacionDistancia != null && evidencia.verificacionDistancia <= evidencia.verificacionRadio
          ? 'VERIFICADO' : 'SOSPECHOSO')
      : 'PENDIENTE';
    return this.prisma.evidenciaFotografica.update({
      where: { id },
      data: { verificacionEstado: estadoAnterior as EstadoEvidencia, verificacionObservaciones: null },
      include: {
        avanceItem: { include: { item: true } },
        user: { select: { id: true, nombre: true } },
      },
    });
  }
}
