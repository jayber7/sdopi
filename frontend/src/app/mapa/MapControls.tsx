'use client';

import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import RouteIcon from '@mui/icons-material/Route';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import MapIcon from '@mui/icons-material/Map';
import Typography from '@mui/material/Typography';

const capasBase = [
  { key: 'osm', label: 'OSM' },
  { key: 'oscuro', label: 'Oscuro' },
  { key: 'satelite', label: 'Satélite' },
  { key: 'topo', label: 'Topo' },
];

interface Props {
  baseLayer: string;
  polygonsVisible: boolean;
  routeVisible: boolean;
  viasVisible: boolean;
  onBaseLayerChange: (k: string) => void;
  onPolygonsToggle: () => void;
  onToggleRoute: () => void;
  onViasToggle: () => void;
  onCenterOruro: () => void;
  onFullscreen: () => void;
}

export default function MapControls({
  baseLayer, polygonsVisible, routeVisible, viasVisible,
  onBaseLayerChange, onPolygonsToggle, onToggleRoute, onViasToggle,
  onCenterOruro, onFullscreen,
}: Props) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2,
        py: 0.75,
        background: 'rgba(10,14,39,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Button size="small" startIcon={<MyLocationIcon />} onClick={onCenterOruro} variant="text" sx={{ fontSize: '0.6875rem', color: alpha(theme.palette.text.secondary, 0.6), minWidth: 0 }}>
          Centro
        </Button>
        <Button size="small" startIcon={<RouteIcon />} onClick={onToggleRoute} variant="text" sx={{ fontSize: '0.6875rem', color: routeVisible ? alpha(theme.palette.primary.light, 0.8) : alpha(theme.palette.text.secondary, 0.6), minWidth: 0 }}>
          Ruta
        </Button>
        <Button size="small" startIcon={<FullscreenIcon />} onClick={onFullscreen} variant="text" sx={{ fontSize: '0.6875rem', color: alpha(theme.palette.text.secondary, 0.6), minWidth: 0 }}>
          Full
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MapIcon sx={{ fontSize: 14, color: alpha(theme.palette.text.secondary, 0.4) }} />
        <ToggleButtonGroup
          value={baseLayer}
          exclusive
          onChange={(_, v) => v && onBaseLayerChange(v)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              border: '1px solid rgba(255,255,255,0.08)',
              color: alpha(theme.palette.text.secondary, 0.5),
              fontSize: '0.625rem',
              fontWeight: 600,
              py: 0.25,
              px: 1,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              '&.Mui-selected': {
                background: alpha(theme.palette.primary.main, 0.2),
                color: alpha(theme.palette.primary.light, 0.9),
                borderColor: alpha(theme.palette.primary.main, 0.3),
              },
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.08),
              },
            },
          }}
        >
          {capasBase.map((c) => (
            <ToggleButton key={c.key} value={c.key}>{c.label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={polygonsVisible}
            onChange={onPolygonsToggle}
            size="small"
            sx={{
              color: alpha(theme.palette.text.secondary, 0.3),
              '&.Mui-checked': { color: alpha(theme.palette.primary.main, 0.7) },
              '& .MuiSvgIcon-root': { fontSize: 16 },
            }}
          />
        }
        label={<Typography sx={{ fontSize: '0.6875rem', color: alpha(theme.palette.text.secondary, 0.6) }}>Polígonos</Typography>}
        sx={{ m: 0 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={viasVisible}
            onChange={onViasToggle}
            size="small"
            sx={{
              color: alpha(theme.palette.text.secondary, 0.3),
              '&.Mui-checked': { color: alpha(theme.palette.primary.main, 0.7) },
              '& .MuiSvgIcon-root': { fontSize: 16 },
            }}
          />
        }
        label={<Typography sx={{ fontSize: '0.6875rem', color: alpha(theme.palette.text.secondary, 0.6) }}>Vías</Typography>}
        sx={{ m: 0 }}
      />
    </Box>
  );
}
