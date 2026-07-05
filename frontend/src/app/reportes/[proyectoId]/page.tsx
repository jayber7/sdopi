'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API = '/api';
const fmt = (n: number) => n.toLocaleString('es-BO', { minimumFractionDigits: 2 });
const pct = (n: number) => (n * 100).toFixed(2) + '%';
const fdate = (d: string) => new Date(d).toLocaleDateString('es-BO');

interface AnalisisRow {
  numero: number; periodo: string; fechaInicio: string; fechaFin: string;
  desembolsoEfectuado: number; descuentoAnticipo: number;
  descuentoAnticipoAcumulado: number; liquidoPagado: number;
  liquidoPagadoAcumulado: number; saldoPorEjecutar: number;
  avanceFisico: number; avanceFinanciero: number;
}
interface CertificadoData {
  ejecutadoAcumuladoAnterior: number;
  ejecutadoPresentePeriodo: number;
  ejecutadoAcumuladoALaFecha: number;
  descuentoAnticipoAcumuladoAnterior: number;
  interesSegunContrato: number;
  descuentoAnticipoPresentePeriodo: number;
  descuentoAnticipoAcumuladoALaFecha: number;
  multaAnterior: number;
  multaPresentePeriodo: number;
  multaAcumuladoALaFecha: number;
  totalDeducciones: number;
  liquidoPagadoAcumuladoAnterior: number;
  liquidoPagadoAcumuladoALaFecha: number;
  liquidoPagablePlanillaActual: number;
  totalLiquidoPagadoAcumuladoALaFecha: number;
  montoAcumuladoCaosALaFecha: number;
  saldoPorRestituirAnticipo: number;
  saldoEfectivoPorPagar: number;
}
interface AnalisisData {
  proyecto: any; tablaFinanciera: AnalisisRow[]; totales: any;
  anticipo: any; desgloseContractual: any; retraso: any;
  certificado?: CertificadoData;
}
interface PlanillaItemRow {
  numero: number; descripcion: string; unidad: string;
  precioUnitario: number; cantidadContrato: number; montoOriginal: number;
  caos: { numero: number; cantidad: number; monto: number; avancePct: number }[];
  acumulado: { cantidad: number; monto: number };
  montoFaltante: number; pctCantidad: number; pctMontoFaltante: number;
}
interface PlanillaRubroGroup {
  rubroCodigo: string; rubroNombre: string; items: PlanillaItemRow[]; subtotal: number;
}
interface PlanillaData { proyecto: any; rubros: PlanillaRubroGroup[]; }

export default function ReportesPage() {
  const params = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState<'analisis' | 'planillas' | 'certificado'>('analisis');
  const [analisis, setAnalisis] = useState<AnalisisData | null>(null);
  const [planillas, setPlanillas] = useState<PlanillaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [proyectoNombre, setProyectoNombre] = useState('');
  const [hastaCao, setHastaCao] = useState<number | undefined>(undefined);
  const [totalCaos, setTotalCaos] = useState(0);
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);

  useEffect(() => {
    const id = params?.proyectoId;
    if (!id) return;
    const hc = searchParams?.get('hastaCao');
    setHastaCao(hc ? Number(hc) : undefined);
  }, [params?.proyectoId, searchParams]);

  useEffect(() => {
    const id = params?.proyectoId;
    if (!id) return;
    setLoading(true);
    const qs = hastaCao ? `?hastaCao=${hastaCao}` : '';
    Promise.all([
      fetch(`${API}/reportes/analisis-cao/${id}${qs}`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/reportes/planillas/${id}${qs}`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
    ]).then(([a, p]) => {
      setAnalisis(a);
      setPlanillas(p);
      setProyectoNombre(a?.proyecto?.nombre || p?.proyecto?.nombre || '');
      setTotalCaos(a?.totalCaos || p?.totalCaos || 0);
    }).finally(() => setLoading(false));
  }, [params?.proyectoId, hastaCao]);

  function cambiarHastaCao(n: number) {
    const url = new URL(window.location.href);
    url.searchParams.set('hastaCao', String(n));
    window.history.pushState({}, '', url.toString());
    setHastaCao(n);
  }

  if (loading) return <div className="page-full animate-fade-in" style={{ color: 'var(--color-ink-muted)' }}>Cargando reportes...</div>;

  return (
    <div className="page-full animate-fade-in">
      <div className="card mb-4">
        <div className="card-body flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              Reportes {hastaCao ? `— hasta CAO N°${hastaCao}` : ''}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>{proyectoNombre}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>Mostrar hasta CAO:</label>
              <select
                className="select select-sm"
                value={hastaCao ?? totalCaos}
                onChange={e => cambiarHastaCao(Number(e.target.value))}
              >
                <option value={totalCaos}>Todas ({totalCaos})</option>
                {Array.from({ length: totalCaos }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>CAO N°{n}</option>
                ))}
              </select>
            </div>
            <button onClick={() => setTab('analisis')} className={`btn btn-sm ${tab === 'analisis' ? 'btn-primary' : 'btn-outline'}`}>Análisis CAO</button>
            <button onClick={() => setTab('certificado')} className={`btn btn-sm ${tab === 'certificado' ? 'btn-primary' : 'btn-outline'}`}>Certificado</button>
            <button onClick={() => setTab('planillas')} className={`btn btn-sm ${tab === 'planillas' ? 'btn-primary' : 'btn-outline'}`}>Detalle de Planillas</button>
            <button onClick={() => window.print()} className="btn btn-outline btn-sm">🖨 Imprimir</button>
          </div>
        </div>
      </div>

      {tab === 'analisis' && analisis && <AnalisisReport data={analisis} />}
      {tab === 'certificado' && analisis?.certificado && <CertificadoReport data={analisis} />}
      {tab === 'planillas' && planillas && <PlanillaReport data={planillas} />}
    </div>
  );
}

function AnalisisReport({ data }: { data: AnalisisData }) {
  const p = data.proyecto;
  return (
    <div className="space-y-4 report-print">
      {/* Project header */}
      <div className="card">
        <div className="card-body text-sm space-y-1">
          <p><strong>PROYECTO:</strong> {p.nombre}</p>
          <p><strong>CONTRATO N°:</strong> {p.contratoNro}</p>
          <p><strong>CONTRATISTA:</strong> {p.contratista}</p>
          <p><strong>SUPERVISIÓN:</strong> {p.supervisor} &nbsp;|&nbsp; <strong>FISCALIZACIÓN:</strong> {p.fiscal}</p>
          <p><strong>MONTO CONTRATO:</strong> Bs {fmt(p.montoContrato)}</p>
          <p><strong>ANTICIPO:</strong> {data.anticipo.porcentaje}% — Bs {fmt(data.anticipo.monto)}</p>
          <p><strong>ORDEN DE PROCEDER:</strong> {fdate(p.ordenProceder)} &nbsp;|&nbsp; <strong>FECHA CONCLUSIÓN:</strong> {fdate(p.fechaConclusion)}</p>
        </div>
      </div>

      {/* Desglose contractual */}
      <div className="card">
        <div className="card-header"><h3>Desglose Contractual</h3></div>
        <div className="card-body text-sm grid grid-cols-2 gap-2">
          <p><strong>MONTO CONTRATO:</strong> Bs {fmt(data.desgloseContractual.montoContrato)}</p>
          <p><strong>ANTICIPO:</strong> Bs {fmt(data.desgloseContractual.anticipo)}</p>
          <p><strong>ORDEN DE TRABAJO N° 1:</strong> {data.desgloseContractual.ordenTrabajoMonto ? 'Bs ' + fmt(data.desgloseContractual.ordenTrabajoMonto) : '—'}</p>
          <p><strong>ORDEN DE CAMBIO N° 1:</strong> {data.desgloseContractual.ordenCambioMonto ? 'Bs ' + fmt(data.desgloseContractual.ordenCambioMonto) : '—'}</p>
        </div>
      </div>

      {/* Financial table */}
      <div className="card">
        <div className="card-header"><h3>Reporte Financiero</h3></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>CAO</th>
                <th>Período</th>
                <th className="text-right">Desembolso Efectuado (Bs)</th>
                <th className="text-right">Desc. Anticipo (Bs)</th>
                <th className="text-right">Líquido Pagado (Bs)</th>
                <th className="text-right">Saldo por Ejecutar (Bs)</th>
                <th className="text-right">Avance Físico [%]</th>
                <th className="text-right">Avance Financiero [%]</th>
              </tr>
            </thead>
            <tbody>
              {data.tablaFinanciera.map((r) => (
                <tr key={r.numero}>
                  <td>{r.numero === 0 ? 'ANTICIPO' : `CAO N° ${r.numero}`}</td>
                  <td>{r.periodo || `${fdate(r.fechaInicio)} — ${fdate(r.fechaFin)}`}</td>
                  <td className="text-right">{fmt(r.desembolsoEfectuado)}</td>
                  <td className="text-right">{fmt(r.descuentoAnticipo)}</td>
                  <td className="text-right">{fmt(r.liquidoPagado)}</td>
                  <td className="text-right">{fmt(r.saldoPorEjecutar)}</td>
                  <td className="text-right">{pct(r.avanceFisico)}</td>
                  <td className="text-right">{pct(r.avanceFinanciero)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 600 }}>
                <td colSpan={2}>TOTALES</td>
                <td className="text-right">{fmt(data.totales.desembolsoEfectuado)}</td>
                <td className="text-right">{fmt(data.totales.descuentoAnticipo)}</td>
                <td className="text-right">{fmt(data.totales.liquidoPagado)}</td>
                <td className="text-right">{fmt(data.totales.saldoPorEjecutar)}</td>
                <td className="text-right">{pct(data.totales.avanceFisico)}</td>
                <td className="text-right">{pct(data.totales.avanceFinanciero)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <CurvaAvance data={data.tablaFinanciera} />

      {/* Progress summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="card-header"><h3>Avance Físico Total</h3></div>
          <div className="card-body text-center">
            <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>{pct(data.totales.avanceFisico)}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-ink-muted)' }}>Retraso: {pct(data.retraso.fisico)}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Avance Financiero Total</h3></div>
          <div className="card-body text-center">
            <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>{pct(data.totales.avanceFinanciero)}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-ink-muted)' }}>Retraso: {pct(data.retraso.financiero)}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Saldo por Pagar</h3></div>
          <div className="card-body text-center">
            <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>Bs {fmt(data.totales.saldoPorEjecutar)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CurvaAvance({ data }: { data: AnalisisRow[] }) {
  let acFisico = 0, acFinanciero = 0;
  const chartData = data.map(r => {
    acFisico += r.avanceFisico;
    acFinanciero += r.avanceFinanciero;
    return {
      cao: r.numero === 0 ? 'ANTICIPO' : `CAO ${r.numero}`,
      programado: data.length > 1 ? (r.numero / (data.length - 1)) * 100 : 0,
      ejecutadoFisico: acFisico * 100,
      ejecutadoFinanciero: acFinanciero * 100,
    };
  });
  const pctLabel = (v: number) => v.toFixed(2) + '%';

  return (
    <div className="card">
      <div className="card-header"><h3>Curva de Avance — Programado vs Ejecutado</h3></div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 8, right: 32, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
            <XAxis dataKey="cao" tick={{ fontSize: 12 }} stroke="var(--color-ink-muted)" />
            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} stroke="var(--color-ink-muted)" />
            <Tooltip formatter={(v: any) => (typeof v === 'number' ? v.toFixed(2) + '%' : v)} />
            <Legend />
            <Line dataKey="programado" stroke="#94a3b8" strokeDasharray="6 3" name="Programado" dot={false} />
            <Line dataKey="ejecutadoFisico" stroke="#3b82f6" strokeWidth={2} name="Ejecutado Físico" dot={{ r: 4 }} />
            <Line dataKey="ejecutadoFinanciero" stroke="#ef4444" strokeWidth={2} name="Ejecutado Financiero" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CertificadoReport({ data }: { data: AnalisisData }) {
  const c = data.certificado!;
  const p = data.proyecto;
  const certTitle = `CERTIFICADO N° ${data.tablaFinanciera[data.tablaFinanciera.length - 1]?.numero ?? ''}`;
  const nr = (n: number) => `F-${String(n).padStart(2, '0')}`;
  type RowDef = { n: number; label: string; anterior?: number; presente?: number; acumulado?: number; pct?: boolean; bold?: boolean };
  const rows: RowDef[] = [
    { n: 1, label: 'EJECUTADO ACUMULADO ANTERIOR', anterior: c.ejecutadoAcumuladoAnterior },
    { n: 2, label: 'EJECUTADO PRESENTE PERÍODO', presente: c.ejecutadoPresentePeriodo },
    { n: 3, label: 'EJECUTADO ACUMULADO A LA FECHA (1+2)', acumulado: c.ejecutadoAcumuladoALaFecha, bold: true },
    { n: 4, label: 'DESCUENTO ANTICIPO ACUMULADO ANTERIOR', anterior: c.descuentoAnticipoAcumuladoAnterior },
    { n: 5, label: 'INTERÉS SEGÚN CONTRATO', pct: true },
    { n: 6, label: 'DESCUENTO ANTICIPO PRESENTE PERÍODO', presente: c.descuentoAnticipoPresentePeriodo },
    { n: 7, label: 'DESCUENTO ANTICIPO ACUMULADO A LA FECHA (4+6)', acumulado: c.descuentoAnticipoAcumuladoALaFecha, bold: true },
    { n: 8, label: 'MULTA ACUMULADO ANTERIOR', anterior: c.multaAnterior },
    { n: 9, label: 'MULTA PRESENTE PERÍODO', presente: c.multaPresentePeriodo },
    { n: 10, label: 'MULTA ACUMULADO A LA FECHA (8+9)', acumulado: c.multaAcumuladoALaFecha, bold: true },
    { n: 11, label: 'TOTAL DEDUCCIONES (7+10)', acumulado: c.totalDeducciones, bold: true },
    { n: 12, label: 'LÍQUIDO PAGADO ACUMULADO ANTERIOR', anterior: c.liquidoPagadoAcumuladoAnterior },
    { n: 13, label: 'LÍQUIDO PAGADO ACUMULADO A LA FECHA', acumulado: c.liquidoPagadoAcumuladoALaFecha },
    { n: 14, label: 'LÍQUIDO PAGABLE PLANILLA ACTUAL', presente: c.liquidoPagablePlanillaActual },
    { n: 15, label: 'TOTAL LÍQUIDO PAGADO ACUMULADO A LA FECHA (12+14)', acumulado: c.totalLiquidoPagadoAcumuladoALaFecha, bold: true },
    { n: 16, label: 'MONTO ACUMULADO CAOs A LA FECHA (3)', acumulado: c.montoAcumuladoCaosALaFecha, bold: true },
    { n: 17, label: 'SALDO POR RESTITUIR ANTICIPO', acumulado: c.saldoPorRestituirAnticipo },
    { n: 18, label: 'SALDO EFECTIVO POR PAGAR', acumulado: c.saldoEfectivoPorPagar, bold: true },
  ];
  return (
    <div className="card report-print">
      <div className="card-header"><h3>PLANILLA DE ANÁLISIS — {certTitle}</h3></div>
      <div className="card-body text-sm space-y-1">
        <p><strong>PROYECTO:</strong> {p.nombre}</p>
        <p><strong>CONTRATO N°:</strong> {p.contratoNro} &nbsp;|&nbsp; <strong>CONTRATISTA:</strong> {p.contratista}</p>
        <p><strong>SUPERVISIÓN:</strong> {p.supervisor} &nbsp;|&nbsp; <strong>FISCALIZACIÓN:</strong> {p.fiscal}</p>
        <p><strong>MONTO CONTRATO:</strong> Bs {fmt(p.montoContrato)} &nbsp;|&nbsp; <strong>ANTICIPO:</strong> {c.interesSegunContrato}% — Bs {fmt(p.anticipoMonto ?? 0)}</p>
      </div>
      <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>N°</th>
              <th>Línea</th>
              <th className="text-right">Anterior (Bs)</th>
              <th className="text-right">Presente (Bs)</th>
              <th className="text-right">Acumulado a la fecha (Bs)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.n} className={row.bold ? 'font-semibold' : ''}>
                <td className="text-center">{nr(row.n)}</td>
                <td>{row.label}</td>
                <td className="text-right">{row.anterior !== undefined ? fmt(row.anterior) : row.pct ? c.interesSegunContrato + '%' : '—'}</td>
                <td className="text-right">{row.presente !== undefined ? fmt(row.presente) : '—'}</td>
                <td className="text-right">{row.acumulado !== undefined ? fmt(row.acumulado) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanillaReport({ data }: { data: PlanillaData }) {
  const caos = data.rubros.length > 0 ? data.rubros[0].items[0]?.caos.map(c => c.numero) : [];

  return (
    <div className="card report-print">
      <div className="card-header">
        <h3>Planillas de Avance de Obra — Detalle por Item</h3>
      </div>
      <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
        <table>
          <thead>
            <tr>
              <th rowSpan={2}>Item</th>
              <th rowSpan={2}>Descripción</th>
              <th rowSpan={2}>Und</th>
              <th rowSpan={2} className="text-right">Precio Unit.</th>
              <th rowSpan={2} className="text-right">Cant. Contrato</th>
              <th rowSpan={2} className="text-right">Monto Original</th>
              {caos.map((n) => (
                <th key={n} colSpan={2} className="text-center">CAO N°{n}</th>
              ))}
              <th colSpan={2} className="text-right">Acumulado</th>
              <th rowSpan={2} className="text-right">Monto Faltante</th>
              <th rowSpan={2} className="text-right">% Cant.</th>
            </tr>
            <tr>
              {caos.map((n) => (
                <React.Fragment key={n}>
                  <th className="text-right">Cant.</th>
                  <th className="text-right">Monto</th>
                </React.Fragment>
              ))}
              <th className="text-right">Cant.</th>
              <th className="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {data.rubros.map((rubro) => (
              <React.Fragment key={rubro.rubroCodigo}>
                <tr style={{ background: 'var(--color-primary-faint)' }}>
                  <td colSpan={99} className="px-3 py-1.5 text-xs font-semibold" style={{ color: 'var(--color-primary-light)' }}>
                    {rubro.rubroCodigo} — {rubro.rubroNombre}
                  </td>
                </tr>
                {rubro.items.map((item) => (
                  <tr key={item.numero}>
                    <td>{item.numero}</td>
                    <td>{item.descripcion}</td>
                    <td>{item.unidad}</td>
                    <td className="text-right">{fmt(item.precioUnitario)}</td>
                    <td className="text-right">{fmt(item.cantidadContrato)}</td>
                    <td className="text-right">{fmt(item.montoOriginal)}</td>
                    {caos.map((n) => {
                      const c = item.caos.find(c => c.numero === n);
                      return (
                        <React.Fragment key={n}>
                          <td className="text-right">{c ? fmt(c.cantidad) : '—'}</td>
                          <td className="text-right">{c ? fmt(c.monto) : '—'}</td>
                        </React.Fragment>
                      );
                    })}
                    <td className="text-right">{fmt(item.acumulado.cantidad)}</td>
                    <td className="text-right">{fmt(item.acumulado.monto)}</td>
                    <td className="text-right">{fmt(item.montoFaltante)}</td>
                    <td className="text-right">{pct(item.pctCantidad)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 600, background: 'var(--color-primary-faint)' }}>
                  <td colSpan={5} className="text-right">Subtotal {rubro.rubroCodigo}</td>
                  <td className="text-right">{fmt(rubro.subtotal)}</td>
                  <td colSpan={caos.length * 2 + 4}></td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
