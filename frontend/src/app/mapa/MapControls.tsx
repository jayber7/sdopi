'use client';

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
  onBaseLayerChange: (k: string) => void;
  onPolygonsToggle: () => void;
  onToggleRoute: () => void;
  onCenterOruro: () => void;
  onFullscreen: () => void;
}

export default function MapControls({
  baseLayer, polygonsVisible, routeVisible,
  onBaseLayerChange, onPolygonsToggle, onToggleRoute,
  onCenterOruro, onFullscreen,
}: Props) {
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
        borderBottom: '1px solid rgba(100,180,255,0.08)',
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Button size="small" startIcon={<MyLocationIcon />} onClick={onCenterOruro} variant="text" sx={{ fontSize: '0.6875rem', color: 'rgba(150,200,255,0.6)', minWidth: 0 }}>
          Centro
        </Button>
        <Button size="small" startIcon={<RouteIcon />} onClick={onToggleRoute} variant="text" sx={{ fontSize: '0.6875rem', color: routeVisible ? 'rgba(100,200,255,0.8)' : 'rgba(150,200,255,0.6)', minWidth: 0 }}>
          Ruta
        </Button>
        <Button size="small" startIcon={<FullscreenIcon />} onClick={onFullscreen} variant="text" sx={{ fontSize: '0.6875rem', color: 'rgba(150,200,255,0.6)', minWidth: 0 }}>
          Full
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MapIcon sx={{ fontSize: 14, color: 'rgba(150,200,255,0.4)' }} />
        <ToggleButtonGroup
          value={baseLayer}
          exclusive
          onChange={(_, v) => v && onBaseLayerChange(v)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(150,200,255,0.5)',
              fontSize: '0.625rem',
              fontWeight: 600,
              py: 0.25,
              px: 1,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              '&.Mui-selected': {
                background: 'rgba(91,154,255,0.2)',
                color: 'rgba(150,220,255,0.9)',
                borderColor: 'rgba(91,154,255,0.3)',
              },
              '&:hover': {
                background: 'rgba(100,180,255,0.08)',
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
              color: 'rgba(150,200,255,0.3)',
              '&.Mui-checked': { color: 'rgba(91,154,255,0.7)' },
              '& .MuiSvgIcon-root': { fontSize: 16 },
            }}
          />
        }
        label={<Typography sx={{ fontSize: '0.6875rem', color: 'rgba(150,200,255,0.6)' }}>Polígonos</Typography>}
        sx={{ m: 0 }}
      />
    </Box>
  );
}
