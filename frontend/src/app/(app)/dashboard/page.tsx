'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useJefatura } from '@/context/JefaturaContext';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API = '/api';

const JEFATURA_COLOR: Record<string, string> = { DI: '#4fc3f7', UDETRA: '#81c784', UEH: '#ffb74d', UPRADE: '#ce93d8', UNASVI: '#ef5350' };
const JEFATURA_LABEL: Record<string, string> = { DI: 'Infraestructura', UDETRA: 'Transporte', UEH: 'Energía', UPRADE: 'Prevención', UNASVI: 'Saneamiento' };
const SITUACION_LABEL: Record<string, string> = {
  SIN_EJECUCION: 'Sin Ejecución', PREINVERSION: 'Preinversión', INVERSION: 'Inversión',
  CAMBIO_PREINVERSION_A_INVERSION: 'Cambio a Inversión', INVERSION_PARA_LICITACION: 'Inversión Licitación',
  EDTP_CONCLUIDO: 'EDTP Concluido', EDTP_CONCLUIDO_ESPERA_INVERSION: 'EDTP Concluido (espera)',
  EN_EJECUCION: 'En Ejecución', EN_CIERRE: 'En Cierre', CONCLUIDO: 'Concluido',
  CON_ENTREGA_DEFINITIVA: 'Con Entrega Definitiva', CONCILIACION_SALDOS: 'Conciliación Saldos',
  AUDITORIA_EXTERNA: 'Auditoría Externa', SUSPENSION_CONTRATACION: 'Suspensión Contratación',
};

function KpiCard({ title, value, subtitle, color }: { title: string; value: string; subtitle?: string; color?: string }) {
  const theme = useTheme();
  return (
    <Card sx={{ height: '100%', background: alpha(color || theme.palette.primary.main, 0.04), border: `1px solid ${alpha(color || theme.palette.primary.main, 0.15)}` }}>
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: color || theme.palette.primary.light }}>{value}</Typography>
        {subtitle && <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.45), mt: 0.25 }}>{subtitle}</Typography>}
      </CardContent>
    </Card>
  );
}

function formatCurrency(n: number) { return n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function DashboardPage() {
  const { user } = useAuth();
  const { jefatura } = useJefatura();
  const theme = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/proyectos/dashboard`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress size={32} sx={{ color: 'rgba(100,180,255,0.5)' }} /></Box>;
  if (!data) return <Typography sx={{ p: 4, color: alpha(theme.palette.text.secondary, 0.5) }}>Sin datos</Typography>;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 }, py: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>Dashboard General</Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Proyectos Activos" value={String(data.totalProyectos)} subtitle={`${data.proyectosAtrasados} atrasados`} color="#4fc3f7" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Monto Contratado" value={`Bs ${formatCurrency(data.montoContratadoTotal)}`} color="#81c784" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Monto Ejecutado" value={`Bs ${formatCurrency(data.montoEjecutadoTotal)}`} subtitle={`${(data.avanceFisicoPromedio * 100).toFixed(2)}% del contratado`} color="#ffb74d" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard title="Multas Aplicadas" value={`Bs ${formatCurrency(data.totalMultas)}`} color="#ef5350" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Proyectos por Jefatura</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(data.jefaturaCount || {}).map(([j, c]) => (
                  <Box key={j} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: JEFATURA_COLOR[j] || '#888' }} />
                      <Typography variant="body2">{JEFATURA_LABEL[j] || j}</Typography>
                    </Box>
                    <Chip label={c as number} size="small" sx={{ fontWeight: 600, minWidth: 36 }} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Proyectos por Situación</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(data.situacionCount || {}).sort(([,a]: any, [,b]: any) => b - a).map(([s, c]) => (
                  <Chip key={s} label={`${SITUACION_LABEL[s] || s}: ${c}`} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Planillas CAO por Estado</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {Object.entries(data.planillasPorEstado || {}).map(([est, c]) => (
                  <Box key={est} sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: est === 'aprobado' ? '#81c784' : est === 'enviado' ? '#ffb74d' : alpha(theme.palette.text.secondary, 0.5) }}>{c as number}</Typography>
                    <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.5) }}>{est}</Typography>
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.35), mt: 1, display: 'block' }}>Total: {data.totalPlanillas}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Proyectos Atrasados / En Tiempo</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={[
                    { name: 'Atrasados', value: data.proyectosAtrasados },
                    { name: 'En Tiempo', value: data.proyectosSinAtraso },
                  ]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" startAngle={90} endAngle={-270}>
                    <Cell fill="#ef5350" />
                    <Cell fill="#66bb6a" />
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: '0.8rem' }} />
                  <Legend formatter={(v: string) => <span style={{ color: 'rgba(150,200,255,0.7)', fontSize: '0.8rem' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
