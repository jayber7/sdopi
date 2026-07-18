'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';

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
  ejecutadoAcumuladoAnterior: number; ejecutadoPresentePeriodo: number;
  ejecutadoAcumuladoALaFecha: number; descuentoAnticipoAcumuladoAnterior: number;
  interesSegunContrato: number; descuentoAnticipoPresentePeriodo: number;
  descuentoAnticipoAcumuladoALaFecha: number; multaAnterior: number;
  multaPresentePeriodo: number; multaAcumuladoALaFecha: number;
  totalDeducciones: number; liquidoPagadoAcumuladoAnterior: number;
  liquidoPagadoAcumuladoALaFecha: number; liquidoPagablePlanillaActual: number;
  totalLiquidoPagadoAcumuladoALaFecha: number; montoAcumuladoCaosALaFecha: number;
  saldoPorRestituirAnticipo: number; saldoEfectivoPorPagar: number;
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

const th = { background: 'rgba(255,255,255,0.03)', color: 'rgba(150,200,255,0.7)', fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px', whiteSpace: 'nowrap' as const };
const td = { padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.75)', verticalAlign: 'middle' as const };

export default function ReportesPage() {
  const params = useParams();
  const [tab, setTab] = useState<'analisis' | 'planillas' | 'certificado'>('analisis');
  const [analisis, setAnalisis] = useState<AnalisisData | null>(null);
  const [planillas, setPlanillas] = useState<PlanillaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [proyectoNombre, setProyectoNombre] = useState('');
  const [hastaCao, setHastaCao] = useState<number | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    const hc = new URLSearchParams(window.location.search).get('hastaCao');
    return hc ? Number(hc) : undefined;
  });
  const [totalCaos, setTotalCaos] = useState(0);

  useEffect(() => {
    const id = params?.proyectoId;
    if (!id) return;
    const ac = new AbortController();
    setLoading(true);
    const qs = hastaCao !== undefined ? `?hastaCao=${hastaCao}` : '';
    Promise.all([
      fetch(`${API}/reportes/analisis-cao/${id}${qs}`, { credentials: 'include', signal: ac.signal }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/reportes/planillas/${id}${qs}`, { credentials: 'include', signal: ac.signal }).then(r => r.ok ? r.json() : null),
    ]).then(([a, p]) => {
      setAnalisis(a); setPlanillas(p);
      setProyectoNombre(a?.proyecto?.nombre || p?.proyecto?.nombre || '');
      setTotalCaos(a?.totalCaos || p?.totalCaos || 0);
    }).finally(() => setLoading(false));
    return () => ac.abort();
  }, [params?.proyectoId, hastaCao]);

  function cambiarHastaCao(n: number) {
    const url = new URL(window.location.href);
    url.searchParams.set('hastaCao', String(n));
    window.history.pushState({}, '', url.toString());
    setHastaCao(n);
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress size={32} sx={{ color: 'rgba(100,180,255,0.5)' }} /></Box>;

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease both' }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400, fontSize: '1.25rem' }}>
                Reportes {hastaCao ? `— hasta CAO N°${hastaCao}` : ''}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(150,200,255,0.5)' }}>{proyectoNombre}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <TextField select label="Mostrar hasta" value={hastaCao ?? totalCaos} onChange={e => cambiarHastaCao(Number(e.target.value))} size="small" sx={{ minWidth: 130 }}>
                <MenuItem value={totalCaos}>Todas ({totalCaos})</MenuItem>
                {Array.from({ length: totalCaos }, (_, i) => i + 1).map(n => <MenuItem key={n} value={n}>CAO N°{n}</MenuItem>)}
              </TextField>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { minWidth: 80, fontSize: '0.75rem', p: 1 } }}>
                <Tab label="Análisis" value="analisis" />
                <Tab label="Certificado" value="certificado" />
                <Tab label="Planillas" value="planillas" />
              </Tabs>
              <Button variant="outlined" size="small" onClick={() => window.print()}>🖨 Imprimir</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {tab === 'analisis' && analisis && <AnalisisReport data={analisis} />}
      {tab === 'certificado' && analisis?.certificado && <CertificadoReport data={analisis} />}
      {tab === 'planillas' && planillas && <PlanillaReport data={planillas} />}
    </Box>
  );
}

function AnalisisReport({ data }: { data: AnalisisData }) {
  const p = data.proyecto;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card><CardContent sx={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="body2"><strong>PROYECTO:</strong> {p.nombre}</Typography>
        <Typography variant="body2"><strong>CONTRATO N°:</strong> {p.contratoNro}</Typography>
        <Typography variant="body2"><strong>CONTRATISTA:</strong> {p.contratista}</Typography>
        <Typography variant="body2"><strong>SUPERVISIÓN:</strong> {p.supervisor} &nbsp;|&nbsp; <strong>FISCALIZACIÓN:</strong> {p.fiscal}</Typography>
        <Typography variant="body2"><strong>MONTO CONTRATO:</strong> Bs {fmt(p.montoContrato)}</Typography>
        <Typography variant="body2"><strong>ANTICIPO:</strong> {data.anticipo.porcentaje}% — Bs {fmt(data.anticipo.monto)}</Typography>
        <Typography variant="body2"><strong>ORDEN DE PROCEDER:</strong> {fdate(p.ordenProceder)} &nbsp;|&nbsp; <strong>FECHA CONCLUSIÓN:</strong> {fdate(p.fechaConclusion)}</Typography>
      </CardContent></Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', mb: 1, fontSize: '0.9375rem' }}>Desglose Contractual</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.875rem' }}>
            <Typography variant="body2"><strong>MONTO CONTRATO:</strong> Bs {fmt(data.desgloseContractual.montoContrato)}</Typography>
            <Typography variant="body2"><strong>ANTICIPO:</strong> Bs {fmt(data.desgloseContractual.anticipo)}</Typography>
            <Typography variant="body2"><strong>ORDEN DE TRABAJO N° 1:</strong> {data.desgloseContractual.ordenTrabajoMonto ? 'Bs ' + fmt(data.desgloseContractual.ordenTrabajoMonto) : '—'}</Typography>
            <Typography variant="body2"><strong>ORDEN DE CAMBIO N° 1:</strong> {data.desgloseContractual.ordenCambioMonto ? 'Bs ' + fmt(data.desgloseContractual.ordenCambioMonto) : '—'}</Typography>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', mb: 1, fontSize: '0.9375rem' }}>Reporte Financiero</Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  <th style={th}>CAO</th>
                  <th style={th}>Período</th>
                  <th style={{ ...th, textAlign: 'right' }}>Desembolso Efectuado (Bs)</th>
                  <th style={{ ...th, textAlign: 'right' }}>Desc. Anticipo (Bs)</th>
                  <th style={{ ...th, textAlign: 'right' }}>Líquido Pagado (Bs)</th>
                  <th style={{ ...th, textAlign: 'right' }}>Saldo por Ejecutar (Bs)</th>
                  <th style={{ ...th, textAlign: 'right' }}>Avance Físico [%]</th>
                  <th style={{ ...th, textAlign: 'right' }}>Avance Financiero [%]</th>
                </tr>
              </thead>
              <tbody>
                {data.tablaFinanciera.map((r) => (
                  <tr key={r.numero}>
                    <td style={td}>{r.numero === 0 ? 'ANTICIPO' : `CAO N° ${r.numero}`}</td>
                    <td style={td}>{r.periodo || `${fdate(r.fechaInicio)} — ${fdate(r.fechaFin)}`}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmt(r.desembolsoEfectuado)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmt(r.descuentoAnticipo)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmt(r.liquidoPagado)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{fmt(r.saldoPorEjecutar)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{pct(r.avanceFisico)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{pct(r.avanceFinanciero)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 600 }}>
                  <td colSpan={2} style={td}>TOTALES</td>
                  <td style={{ ...td, textAlign: 'right' }}>{fmt(data.totales.desembolsoEfectuado)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{fmt(data.totales.descuentoAnticipo)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{fmt(data.totales.liquidoPagado)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{fmt(data.totales.saldoPorEjecutar)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{pct(data.totales.avanceFisico)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{pct(data.totales.avanceFinanciero)}</td>
                </tr>
              </tfoot>
            </table>
          </Box>
        </CardContent>
      </Card>

      <CurvaAvance data={data.tablaFinanciera} />

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
        <Card><CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '0.9375rem' }}>Avance Físico Total</Typography>
          <Typography variant="h4" sx={{ color: 'rgba(150,200,255,0.9)', mt: 1 }}>{pct(data.totales.avanceFisico)}</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)' }}>Retraso: {pct(data.retraso.fisico)}</Typography>
        </CardContent></Card>
        <Card><CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '0.9375rem' }}>Avance Financiero Total</Typography>
          <Typography variant="h4" sx={{ color: 'rgba(150,200,255,0.9)', mt: 1 }}>{pct(data.totales.avanceFinanciero)}</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(150,200,255,0.5)' }}>Retraso: {pct(data.retraso.financiero)}</Typography>
        </CardContent></Card>
        <Card><CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '0.9375rem' }}>Saldo por Pagar</Typography>
          <Typography variant="h4" sx={{ color: 'rgba(150,200,255,0.9)', mt: 1 }}>Bs {fmt(data.totales.saldoPorEjecutar)}</Typography>
        </CardContent></Card>
      </Box>
    </Box>
  );
}

function CurvaAvance({ data }: { data: AnalisisRow[] }) {
  const chartData = useMemo(() => {
    let acFisico = 0, acFinanciero = 0;
    return data.map(r => {
      acFisico += r.avanceFisico; acFinanciero += r.avanceFinanciero;
      return { cao: r.numero === 0 ? 'ANTICIPO' : `CAO ${r.numero}`, programado: data.length > 1 ? (r.numero / (data.length - 1)) * 100 : 0, ejecutadoFisico: acFisico * 100, ejecutadoFinanciero: acFinanciero * 100 };
    });
  }, [data]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', mb: 1, fontSize: '0.9375rem' }}>Curva de Avance — Programado vs Ejecutado</Typography>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 8, right: 32, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="cao" tick={{ fontSize: 12, fill: 'rgba(150,200,255,0.5)' }} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: 'rgba(150,200,255,0.5)' }} />
            <Tooltip contentStyle={{ background: 'rgba(10,14,39,0.95)', border: '1px solid rgba(100,180,255,0.1)', borderRadius: 8, backdropFilter: 'blur(8px)' }} formatter={(v: any) => (typeof v === 'number' ? v.toFixed(2) + '%' : v)} />
            <Legend />
            <Line dataKey="programado" stroke="#94a3b8" strokeDasharray="6 3" name="Programado" dot={false} />
            <Line dataKey="ejecutadoFisico" stroke="#5b9aff" strokeWidth={2} name="Ejecutado Físico" dot={{ r: 4 }} />
            <Line dataKey="ejecutadoFinanciero" stroke="#00dbb4" strokeWidth={2} name="Ejecutado Financiero" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function CertificadoReport({ data }: { data: AnalisisData }) {
  const c = data.certificado!; const p = data.proyecto;
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
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', mb: 1, fontSize: '0.9375rem' }}>PLANILLA DE ANÁLISIS — {certTitle}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2, fontSize: '0.875rem' }}>
          <Typography variant="body2"><strong>PROYECTO:</strong> {p.nombre}</Typography>
          <Typography variant="body2"><strong>CONTRATO N°:</strong> {p.contratoNro} &nbsp;|&nbsp; <strong>CONTRATISTA:</strong> {p.contratista}</Typography>
          <Typography variant="body2"><strong>SUPERVISIÓN:</strong> {p.supervisor} &nbsp;|&nbsp; <strong>FISCALIZACIÓN:</strong> {p.fiscal}</Typography>
          <Typography variant="body2"><strong>MONTO CONTRATO:</strong> Bs {fmt(p.montoContrato)} &nbsp;|&nbsp; <strong>ANTICIPO:</strong> {c.interesSegunContrato}% — Bs {fmt(p.anticipoMonto ?? 0)}</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 40 }}>N°</th>
                <th style={th}>Línea</th>
                <th style={{ ...th, textAlign: 'right' }}>Anterior (Bs)</th>
                <th style={{ ...th, textAlign: 'right' }}>Presente (Bs)</th>
                <th style={{ ...th, textAlign: 'right' }}>Acumulado a la fecha (Bs)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.n}>
                  <td style={{ ...td, textAlign: 'center' }}>{nr(row.n)}</td>
                  <td style={td}>{row.label}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{row.anterior !== undefined ? fmt(row.anterior) : row.pct ? c.interesSegunContrato + '%' : '—'}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{row.presente !== undefined ? fmt(row.presente) : '—'}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{row.acumulado !== undefined ? fmt(row.acumulado) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </CardContent>
    </Card>
  );
}

function PlanillaReport({ data }: { data: PlanillaData }) {
  const caos = data.rubros.length > 0 ? data.rubros[0].items[0]?.caos.map(c => c.numero) : [];
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: 'var(--font-serif), Georgia, serif', mb: 1, fontSize: '0.9375rem' }}>Planillas de Avance de Obra — Detalle por Item</Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr>
                <th style={th} rowSpan={2}>Item</th>
                <th style={th} rowSpan={2}>Descripción</th>
                <th style={th} rowSpan={2}>Und</th>
                <th style={{ ...th, textAlign: 'right' }} rowSpan={2}>Precio Unit.</th>
                <th style={{ ...th, textAlign: 'right' }} rowSpan={2}>Cant. Contrato</th>
                <th style={{ ...th, textAlign: 'right' }} rowSpan={2}>Monto Original</th>
                {caos.map((n) => <th key={n} colSpan={2} style={{ ...th, textAlign: 'center' }}>CAO N°{n}</th>)}
                <th colSpan={2} style={{ ...th, textAlign: 'right' }}>Acumulado</th>
                <th style={{ ...th, textAlign: 'right' }} rowSpan={2}>Monto Faltante</th>
                <th style={{ ...th, textAlign: 'right' }} rowSpan={2}>% Cant.</th>
              </tr>
              <tr>
                {caos.map((n) => <React.Fragment key={n}><th style={{ ...th, textAlign: 'right' }}>Cant.</th><th style={{ ...th, textAlign: 'right' }}>Monto</th></React.Fragment>)}
                <th style={{ ...th, textAlign: 'right' }}>Cant.</th>
                <th style={{ ...th, textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {data.rubros.map((rubro) => (
                <React.Fragment key={rubro.rubroCodigo}>
                  <tr><td colSpan={99} style={{ ...td, background: 'rgba(91,154,255,0.08)', fontWeight: 600, color: 'rgba(150,200,255,0.7)', fontSize: '0.6875rem', padding: '4px 12px' }}>{rubro.rubroCodigo} — {rubro.rubroNombre}</td></tr>
                  {rubro.items.map((item) => (
                    <tr key={item.numero}>
                      <td style={td}>{item.numero}</td>
                      <td style={td}>{item.descripcion}</td>
                      <td style={td}>{item.unidad}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{fmt(item.precioUnitario)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{fmt(item.cantidadContrato)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{fmt(item.montoOriginal)}</td>
                      {caos.map((n) => { const c = item.caos.find(c => c.numero === n); return <React.Fragment key={n}><td style={{ ...td, textAlign: 'right' }}>{c ? fmt(c.cantidad) : '—'}</td><td style={{ ...td, textAlign: 'right' }}>{c ? fmt(c.monto) : '—'}</td></React.Fragment>; })}
                      <td style={{ ...td, textAlign: 'right' }}>{fmt(item.acumulado.cantidad)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{fmt(item.acumulado.monto)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{fmt(item.montoFaltante)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{pct(item.pctCantidad)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 600 }}><td colSpan={5} style={{ ...td, textAlign: 'right', background: 'rgba(91,154,255,0.08)', color: 'rgba(150,200,255,0.7)' }}>Subtotal {rubro.rubroCodigo}</td>
                    <td style={{ ...td, textAlign: 'right', background: 'rgba(91,154,255,0.08)', color: 'rgba(150,200,255,0.7)' }}>{fmt(rubro.subtotal)}</td>
                    <td colSpan={caos.length * 2 + 4}></td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </Box>
      </CardContent>
    </Card>
  );
}
