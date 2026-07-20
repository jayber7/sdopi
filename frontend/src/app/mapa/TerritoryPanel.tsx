'use client';

import { type Municipio, municipios, estadoLabel } from '@/lib/municipios';
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

interface Props {
  selected: Municipio;
  filtroEstado: string;
  busqueda: string;
  counts: Record<string, number>;
  onSelect: (m: Municipio) => void;
  onFilterChange: (v: string) => void;
  onSearchChange: (v: string) => void;
}

function limpiar(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function visibles(filtroEstado: string, busqueda: string) {
  return municipios.filter((m) => {
    const estadoOk = filtroEstado === 'todos' || m.estado === filtroEstado;
    const texto = limpiar([m.nombre, m.provincia, m.unidad, m.descripcion].join(' '));
    const busquedaOk = !busqueda || texto.includes(limpiar(busqueda));
    return estadoOk && busquedaOk;
  });
}

const dotColor: Record<string, string> = {
  normal: '#00dbb4',
  observado: '#ffb300',
  alerta: '#ff6b6b',
  concluido: '#5b9aff',
};

export default function TerritoryPanel({ selected, filtroEstado, busqueda, counts, onSelect, onFilterChange, onSearchChange }: Props) {
  const theme = useTheme();
  const lista = visibles(filtroEstado, busqueda);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, background: theme.palette.background.paper, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, borderRadius: 2, boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}>
      <Box className="glass-header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: alpha(theme.palette.text.secondary, 0.7) }}>Municipios</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem' }}>{municipios.length} municipios</Typography>
        </Box>
        <TextField
          select
          value={filtroEstado}
          onChange={(e) => onFilterChange(e.target.value)}
          size="small"
          sx={{ maxWidth: 110, '& .MuiInputBase-root': { minHeight: '2em', fontSize: '0.75rem' } }}
        >
          <MenuItem value="todos">Todos</MenuItem>
          {['normal', 'observado', 'alerta', 'concluido'].map((e) => (
            <MenuItem key={e} value={e}>{estadoLabel[e]}</MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ px: 2, py: 1 }}>
        <TextField
          placeholder="Buscar municipio…"
          value={busqueda}
          onChange={(e) => onSearchChange(e.target.value)}
          size="small"
          fullWidth
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: alpha(theme.palette.text.secondary, 0.4) }} /></InputAdornment>,
            },
          }}
          sx={{ '& .MuiInputBase-root': { minHeight: '2em', fontSize: '0.8125rem' } }}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 1, pb: 1 }}>
        {lista.map((m) => (
          <Box
            key={m.id}
            onClick={() => onSelect(m)}
            sx={{
              display: 'grid',
              gridTemplateColumns: '16px 1fr auto',
              gap: 1.5,
              alignItems: 'center',
              width: '100%',
              textAlign: 'left',
              p: 1.5,
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.12s ease',
              background: m.id === selected.id ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
              border: m.id === selected.id ? `1px solid ${alpha(theme.palette.primary.main, 0.15)}` : '1px solid transparent',
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.05),
                borderColor: alpha(theme.palette.primary.main, 0.1),
              },
              mb: 0.5,
            }}
          >
            <FiberManualRecordIcon sx={{ fontSize: 10, color: dotColor[m.estado] || dotColor.normal }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.85)' }}>
                {m.nombre}
              </Typography>
              <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}>{m.provincia}</Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: alpha(theme.palette.text.secondary, 0.7) }}>{counts[m.nombre] ?? 0}</Typography>
          </Box>
        ))}
        {lista.length === 0 && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', display: 'block', py: 4 }}>
            Sin resultados
          </Typography>
        )}
      </Box>
    </Box>
  );
}
