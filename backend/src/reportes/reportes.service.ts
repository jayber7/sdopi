import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AnalisisCaoRow, AnalisisCaoResponse, PlanillaDetalleResponse, PlanillaRubroGroup, PlanillaItemRow, CertificadoResponse } from './dto/reportes.dto';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  async analisisCao(proyectoId: number, hastaCao?: number): Promise<AnalisisCaoResponse> {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      include: {
        planillas: {
          where: { tipo: 'CAO' },
          include: { avances: { select: { monto: true, cantidad: true, avancePct: true, item: true } }, multas: { select: { monto: true } } },
          orderBy: { numero: 'asc' },
        },
      },
    });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const planillas = hastaCao ? proyecto.planillas.filter(p => p.numero <= hastaCao) : proyecto.planillas;

    const montoContrato = proyecto.montoContrato;
    const anticipoPct = proyecto.anticipoPct;
    const anticipoMonto = proyecto.anticipoMonto ?? Math.round(montoContrato * (anticipoPct / 100) * 100) / 100;

    const tablaFinanciera: AnalisisCaoRow[] = [];
    let totalDesembolso = anticipoMonto;
    let totalDescuento = 0;
    let totalLiquido = anticipoMonto;

    if (anticipoMonto > 0) {
      tablaFinanciera.push({
        numero: 0,
        periodo: 'ANTICIPO',
        fechaInicio: proyecto.ordenProceder.toISOString(),
        fechaFin: proyecto.ordenProceder.toISOString(),
        desembolsoEfectuado: Math.round(anticipoMonto * 100) / 100,
        descuentoAnticipo: 0,
        descuentoAnticipoAcumulado: 0,
        liquidoPagado: Math.round(anticipoMonto * 100) / 100,
        liquidoPagadoAcumulado: Math.round(anticipoMonto * 100) / 100,
        saldoPorEjecutar: Math.round((montoContrato - anticipoMonto) * 100) / 100,
        avanceFisico: 0,
        avanceFinanciero: montoContrato > 0 ? Math.round((anticipoMonto / montoContrato) * 10000) / 10000 : 0,
      });
    }

    planillas.forEach((p) => {
      const periodoDesembolso = p.avances.reduce((s, a) => s + a.monto, 0);
      const periodoDescuento = periodoDesembolso * (anticipoPct / 100);
      const periodoLiquido = periodoDesembolso - periodoDescuento;
      totalDesembolso += periodoDesembolso;
      totalDescuento += periodoDescuento;
      totalLiquido += periodoLiquido;

      const avanceFisicoPeriodo = p.avances.reduce((s, a) => s + a.avancePct / 100, 0) / (p.avances.length || 1);

      tablaFinanciera.push({
        numero: p.numero,
        periodo: p.periodo,
        fechaInicio: p.fechaInicio.toISOString(),
        fechaFin: p.fechaFin.toISOString(),
        desembolsoEfectuado: Math.round(periodoDesembolso * 100) / 100,
        descuentoAnticipo: Math.round(periodoDescuento * 100) / 100,
        descuentoAnticipoAcumulado: Math.round(totalDescuento * 100) / 100,
        liquidoPagado: Math.round(periodoLiquido * 100) / 100,
        liquidoPagadoAcumulado: Math.round(totalLiquido * 100) / 100,
        saldoPorEjecutar: Math.round((montoContrato - totalDesembolso) * 100) / 100,
        avanceFisico: Math.round(avanceFisicoPeriodo * 10000) / 10000,
        avanceFinanciero: montoContrato > 0 ? Math.round((periodoLiquido / montoContrato) * 10000) / 10000 : 0,
      });
    });

    const itemsCount = planillas.reduce((s, p) => s + p.avances.length, 0);
    const avanceFisicoTotal = itemsCount > 0
      ? Math.round(planillas.reduce((s, p) => s + p.avances.reduce((s2, a) => s2 + a.avancePct / 100, 0), 0) / itemsCount * 10000) / 10000
      : 0;
    const avanceFinancieroTotal = montoContrato > 0
      ? Math.round((totalLiquido / montoContrato) * 10000) / 10000
      : 0;

    let certificado: CertificadoResponse | undefined;
    if (hastaCao && planillas.length > 0) {
      const anteriores = planillas.slice(0, -1);
      const presente = planillas[planillas.length - 1];
      const ejecP = (ps: typeof planillas) =>
        ps.reduce((s, p) => s + p.avances.reduce((s2, a) => s2 + a.monto, 0), 0);
      const multaP = (ps: typeof planillas) =>
        ps.reduce((s, p) => s + p.multas.reduce((s2, m) => s2 + m.monto, 0), 0);
      const descP = (ejec: number) => Math.round(ejec * (anticipoPct / 100) * 100) / 100;
      const liqP = (ejec: number, desc: number) => Math.round((ejec - desc) * 100) / 100;

      const ejecAnterior = ejecP(anteriores);
      const ejecPresente = ejecP([presente]);
      const ejecAcumulado = ejecAnterior + ejecPresente;
      const descAnterior = anteriores.reduce((s, p) => s + descP(ejecP([p])), 0);
      const descPresente = descP(ejecPresente);
      const descAcumulado = descAnterior + descPresente;
      const multaAnterior = Math.round(multaP(anteriores) * 100) / 100;
      const multaPresente = Math.round(multaP([presente]) * 100) / 100;
      const multaAcumulado = multaAnterior + multaPresente;
      const liqAnterior = anteriores.reduce((s, p) => {
        const ej = ejecP([p]);
        return s + liqP(ej, descP(ej));
      }, 0);
      const liqPresente = liqP(ejecPresente, descPresente);
      const liqAcumulado = liqAnterior + liqPresente;

      certificado = {
        ejecutadoAcumuladoAnterior: Math.round(ejecAnterior * 100) / 100,
        ejecutadoPresentePeriodo: Math.round(ejecPresente * 100) / 100,
        ejecutadoAcumuladoALaFecha: Math.round(ejecAcumulado * 100) / 100,
        descuentoAnticipoAcumuladoAnterior: Math.round(descAnterior * 100) / 100,
        interesSegunContrato: anticipoPct,
        descuentoAnticipoPresentePeriodo: descPresente,
        descuentoAnticipoAcumuladoALaFecha: Math.round(descAcumulado * 100) / 100,
        multaAnterior,
        multaPresentePeriodo: multaPresente,
        multaAcumuladoALaFecha: multaAcumulado,
        totalDeducciones: Math.round((descAcumulado + multaAcumulado) * 100) / 100,
        liquidoPagadoAcumuladoAnterior: Math.round(liqAnterior * 100) / 100,
        liquidoPagadoAcumuladoALaFecha: Math.round(liqAcumulado * 100) / 100,
        liquidoPagablePlanillaActual: liqPresente,
        totalLiquidoPagadoAcumuladoALaFecha: Math.round(liqAcumulado * 100) / 100,
        montoAcumuladoCaosALaFecha: Math.round(ejecAcumulado * 100) / 100,
        saldoPorRestituirAnticipo: Math.round((Math.round(anticipoMonto * 100) / 100 - descAcumulado) * 100) / 100,
        saldoEfectivoPorPagar: Math.round((montoContrato - ejecAcumulado) * 100) / 100,
      };
    }

    return {
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre,
        contratoNro: proyecto.contratoNro,
        montoContrato,
        anticipoPct,
        anticipoMonto: proyecto.anticipoMonto,
        ordenProceder: proyecto.ordenProceder.toISOString(),
        fechaConclusion: proyecto.fechaConclusion.toISOString(),
        contratista: proyecto.contratista,
        supervisor: proyecto.supervisor,
        fiscal: proyecto.fiscal,
        direccion: proyecto.direccion,
      },
      tablaFinanciera,
      totales: {
        desembolsoEfectuado: Math.round(totalDesembolso * 100) / 100,
        descuentoAnticipo: Math.round(totalDescuento * 100) / 100,
        liquidoPagado: Math.round(totalLiquido * 100) / 100,
        saldoPorEjecutar: Math.round((montoContrato - totalDesembolso) * 100) / 100,
        avanceFisico: avanceFisicoTotal,
        avanceFinanciero: avanceFinancieroTotal,
      },
      anticipo: { monto: Math.round(anticipoMonto * 100) / 100, porcentaje: anticipoPct },
      desgloseContractual: {
        montoContrato,
        anticipo: Math.round(anticipoMonto * 100) / 100,
        ordenTrabajoMonto: null,
        ordenCambioMonto: null,
      },
      retraso: {
        fisico: Math.round((1 - avanceFisicoTotal) * 10000) / 10000,
        financiero: Math.round((1 - avanceFinancieroTotal) * 10000) / 10000,
      },
      totalCaos: proyecto.planillas.length,
      ...(certificado && { certificado }),
    };
  }

  async planillaDetalle(proyectoId: number, hastaCao?: number): Promise<PlanillaDetalleResponse> {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id: proyectoId },
      include: {
        rubros: {
          include: {
            items: {
              include: {
                avances: {
                  include: { planilla: { select: { numero: true, periodo: true } } },
                  orderBy: { planilla: { numero: 'asc' } },
                },
              },
              orderBy: { numero: 'asc' },
            },
          },
          orderBy: { codigo: 'asc' },
        },
        planillas: {
          where: { tipo: 'CAO' },
          orderBy: { numero: 'asc' },
          select: { id: true, numero: true },
        },
      },
    });
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const caos = hastaCao
      ? proyecto.planillas.filter(c => c.numero <= hastaCao)
      : proyecto.planillas;
    const rubros: PlanillaRubroGroup[] = proyecto.rubros.map((r) => {
      let subtotal = 0;
      const items: PlanillaItemRow[] = r.items.map((item) => {
        const caosData = caos.map((c) => {
          const avance = item.avances.find((a) => a.planilla.numero === c.numero);
          return {
            numero: c.numero,
            cantidad: avance?.cantidad ?? 0,
            monto: avance?.monto ?? 0,
            avancePct: avance?.avancePct ?? 0,
          };
        });

        const cantidadAcumulada = caosData.reduce((s, c) => s + c.cantidad, 0);
        const montoAcumulado = caosData.reduce((s, c) => s + c.monto, 0);
        const montoFaltante = item.montoOriginal - montoAcumulado;
        const pctCantidad = item.cantidadContrato > 0 ? Math.round((cantidadAcumulada / item.cantidadContrato) * 10000) / 10000 : 0;

        subtotal += montoAcumulado;

        return {
          numero: item.numero,
          descripcion: item.descripcion,
          unidad: item.unidad,
          precioUnitario: item.precioUnitario,
          cantidadContrato: item.cantidadContrato,
          montoOriginal: item.montoOriginal,
          ordenTrabajo: null,
          caos: caosData,
          acumulado: {
            cantidad: Math.round(cantidadAcumulada * 100) / 100,
            monto: Math.round(montoAcumulado * 100) / 100,
          },
          montoFaltante: Math.round(montoFaltante * 100) / 100,
          pctCantidad,
          pctMontoFaltante: item.montoOriginal > 0 ? Math.round((montoFaltante / item.montoOriginal) * 10000) / 10000 : 0,
        };
      });

      return { rubroCodigo: r.codigo, rubroNombre: r.nombre, items, subtotal: Math.round(subtotal * 100) / 100 };
    });

    return {
      proyecto: { id: proyecto.id, nombre: proyecto.nombre, contratoNro: proyecto.contratoNro },
      totalCaos: proyecto.planillas.length,
      rubros,
    };
  }

  async generateCaoPdf(planillaId: number): Promise<Buffer> {
    const planilla = await this.prisma.planillaCAO.findUnique({
      where: { id: planillaId },
      include: {
        proyecto: true,
        avances: { include: { item: true } },
      },
    });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');

    const baseId = planilla.planillaBaseId || planilla.id;
    const caos = await this.prisma.planillaCAO.findMany({
      where: { planillaBaseId: baseId, tipo: 'CAO', numero: { lte: planilla.numero } },
      include: { avances: { select: { monto: true, cantidad: true, avancePct: true } }, multas: { select: { monto: true } } },
      orderBy: { numero: 'asc' },
    });

    const p = planilla.proyecto;
    const montoContrato = p.montoContrato;
    const anticipoPct = p.anticipoPct;
    const anticipoMonto = p.anticipoMonto ?? Math.round(montoContrato * (anticipoPct / 100) * 100) / 100;

    const rows: { no: number; desembolso: number; descuento: number; liquido: number; saldo: number; af: number; multa: number }[] = [];
    let acumDesembolso = anticipoMonto;
    let acumDescuento = 0;
    let acumLiquido = anticipoMonto;
    let acumMulta = 0;

    if (anticipoMonto > 0) {
      rows.push({ no: 0, desembolso: anticipoMonto, descuento: 0, liquido: anticipoMonto, saldo: montoContrato - anticipoMonto, af: 0, multa: 0 });
    }

    caos.forEach((c) => {
      const desembolso = c.avances.reduce((s, a) => s + a.monto, 0);
      const descuento = desembolso * (anticipoPct / 100);
      const liquido = desembolso - descuento;
      const multa = c.multas.reduce((s, m) => s + m.monto, 0);
      acumDesembolso += desembolso;
      acumDescuento += descuento;
      acumLiquido += liquido;
      acumMulta += multa;
      const af = c.avances.length > 0
        ? Math.round(c.avances.reduce((s, a) => s + a.avancePct, 0) / c.avances.length * 100) / 100
        : 0;
      rows.push({ no: c.numero, desembolso, descuento, liquido, saldo: montoContrato - acumDesembolso, af, multa });
    });

    const fmt = (n: number) => n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fdate = (d: Date) => d.toLocaleDateString('es-BO');

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      doc.fontSize(14).font('Helvetica-Bold').text('INFORME DE AVANCE - ACUMULADO', { align: 'center' });
      doc.fontSize(10).font('Helvetica-Bold').text(`CAO N° ${planilla.numero}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica');
      doc.text(`Generado: ${new Date().toLocaleString('es-BO')}`, { align: 'right' });
      doc.moveDown();

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text(`PROYECTO: `, { continued: true }).font('Helvetica').text(p.nombre);
      doc.font('Helvetica-Bold').text(`CONTRATO N°: `, { continued: true }).font('Helvetica').text(p.contratoNro);
      doc.font('Helvetica-Bold').text(`CONTRATISTA: `, { continued: true }).font('Helvetica').text(p.contratista);
      doc.font('Helvetica-Bold').text(`SUPERVISIÓN: `, { continued: true }).font('Helvetica').text(`${p.supervisor}  |  FISCALIZACIÓN: ${p.fiscal}`);
      const opDate = p.ordenProceder instanceof Date ? p.ordenProceder : new Date(p.ordenProceder);
      const fcDate = p.fechaConclusion instanceof Date ? p.fechaConclusion : new Date(p.fechaConclusion);
      doc.font('Helvetica-Bold').text('ORDEN DE PROCEDER: ', { continued: true }).font('Helvetica').text(`${fdate(opDate)}  |  FECHA CONCLUSIÓN: ${fdate(fcDate)}`);
      doc.font('Helvetica-Bold').text(`MONTO CONTRATO: `, { continued: true }).font('Helvetica').text(`Bs ${fmt(montoContrato)}`);
      doc.font('Helvetica-Bold').text(`ANTICIPO: `, { continued: true }).font('Helvetica').text(`${anticipoPct}% — Bs ${fmt(anticipoMonto)}`);
      doc.moveDown();

      const tableTop = doc.y;
      const colW = pageW / 7;
      const headers = ['CAO', 'Desembolso (Bs)', 'Desc. Anticipo', 'Líquido Pagado', 'Saldo x Ejecutar', 'Multas', 'Av. Físico %'];
      const colAligns: ('left' | 'center' | 'right')[] = ['center', 'right', 'right', 'right', 'right', 'right', 'right'];

      const drawCell = (text: string, x: number, y: number, w: number, align: 'left' | 'center' | 'right', bold = false) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7);
        const px = align === 'left' ? x + 2 : align === 'right' ? x + w - 2 : x + w / 2;
        doc.text(text, px, y + 2, { width: w - 4, align });
      };

      let y = tableTop;
      doc.rect(doc.page.margins.left, y, pageW, 14).fill('#2563eb');
      doc.fill('#ffffff');
      headers.forEach((h, i) => {
        const x = doc.page.margins.left + i * colW;
        drawCell(h, x, y, colW, colAligns[i], true);
      });
      y += 14;

      rows.forEach((r, idx) => {
        if (idx % 2 === 0) {
          doc.rect(doc.page.margins.left, y, pageW, 12).fill('#f1f5f9');
        }
        doc.fill('#000000');
        const vals = [String(r.no), fmt(r.desembolso), fmt(r.descuento), fmt(r.liquido), fmt(r.saldo), fmt(r.multa), `${r.af}%`];
        vals.forEach((v, i) => {
          const x = doc.page.margins.left + i * colW;
          drawCell(v, x, y, colW, colAligns[i]);
        });
        y += 12;
      });

      doc.rect(doc.page.margins.left, y, pageW, 14).fill('#1e293b');
      doc.fill('#ffffff');
      const totals = ['TOTALES', fmt(acumDesembolso), fmt(acumDescuento), fmt(acumLiquido), fmt(montoContrato - acumDesembolso), fmt(acumMulta), ''];
      totals.forEach((v, i) => {
        const x = doc.page.margins.left + i * colW;
        drawCell(v, x, y, colW, colAligns[i], true);
      });
      y += 20;

      doc.fill('#000000').font('Helvetica-Bold').fontSize(9).text('RESUMEN', doc.page.margins.left, y);
      y += 14;
      doc.font('Helvetica').fontSize(8);
      const labelW = 120;
      const valW = 100;
      const summary = [
        { l: 'Total Desembolsado:', v: `Bs ${fmt(acumDesembolso)}` },
        { l: 'Total Descuento Anticipo:', v: `Bs ${fmt(acumDescuento)}` },
        { l: 'Total Líquido Pagado:', v: `Bs ${fmt(acumLiquido)}` },
        { l: 'Total Multas:', v: `Bs ${fmt(acumMulta)}` },
        { l: 'Saldo por Ejecutar:', v: `Bs ${fmt(montoContrato - acumDesembolso)}` },
        { l: '', v: '' },
        { l: 'Avance Financiero:', v: `${montoContrato > 0 ? ((acumLiquido / montoContrato) * 100).toFixed(2) : '0.00'}%` },
      ];
      summary.forEach((s, i) => {
        if (i % 2 === 0) {
          doc.rect(doc.page.margins.left, y, pageW, 12).fill('#f8fafc');
          doc.fill('#000000');
        }
        doc.rect(doc.page.margins.left, y, labelW, 12).fill('#f1f5f9');
        doc.fill('#000000');
        doc.font('Helvetica-Bold').fontSize(8).text(s.l, doc.page.margins.left + 4, y + 2, { width: labelW - 4 });
        doc.font('Helvetica').fontSize(8).text(s.v, doc.page.margins.left + labelW + 8, y + 2, { width: valW });
        y += 12;
      });

      doc.end();
    });
  }
}
