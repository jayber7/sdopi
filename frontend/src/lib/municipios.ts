export interface Municipio {
  id: string;
  nombre: string;
  provincia: string;
  coords: [number, number];
  estado: 'normal' | 'observado' | 'alerta' | 'concluido';
  unidad: string;
  descripcion: string;
  destacados: { titulo: string; detalle: string }[];
  fotos: { titulo: string; subtitulo: string; fondo: string }[];
}

export const estadoLabel: Record<string, string> = {
  normal: 'Ejecución normal',
  observado: 'Con observación',
  alerta: 'Alerta / retraso',
  concluido: 'Concluido',
};

export const estadoColor: Record<string, string> = {
  normal: '#16a34a',
  observado: '#d8a21d',
  alerta: '#ef4444',
  concluido: '#2563eb',
};

export const oruroCentro: [number, number] = [-18.55, -67.75];
export const ciudadOruro: [number, number] = [-17.9647, -67.1060];

export const provincias = [
  'Abaroa', 'Carangas', 'Cercado', 'Ladislao Cabrera', 'Litoral', 'Mejillones',
  'Nor Carangas', 'Pantaleón Dalence', 'Poopó', 'Sabaya', 'Sajama',
  'San Pedro de Totora', 'Saucarí', 'Sebastián Pagador', 'Sud Carangas', 'Tomás Barrón',
];

const fotoPaletas = [
  ['#031b3b', '#d8a21d'], ['#0f766e', '#38bdf8'], ['#7f1d1d', '#f97316'],
  ['#1e3a8a', '#f472b6'], ['#14532d', '#84cc16'], ['#581c87', '#f59e0b'],
];

function crearId(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const baseMunicipios = [
  { nombre: 'Oruro', provincia: 'Cercado', coords: [-17.9647, -67.1060] as [number, number], estado: 'normal' as const, unidad: 'Dirección' },
  { nombre: 'Caracollo', provincia: 'Cercado', coords: [-17.6339, -67.2167] as [number, number], estado: 'normal' as const, unidad: 'UDETRA' },
  { nombre: 'El Choro', provincia: 'Cercado', coords: [-18.3540, -67.2100] as [number, number], estado: 'observado' as const, unidad: 'GF' },
  { nombre: 'Soracachi', provincia: 'Cercado', coords: [-17.7639, -67.0272] as [number, number], estado: 'normal' as const, unidad: 'UPRAC' },
  { nombre: 'Challapata', provincia: 'Abaroa', coords: [-18.8990, -66.7690] as [number, number], estado: 'normal' as const, unidad: 'Dirección' },
  { nombre: 'Santuario de Quillacas', provincia: 'Abaroa', coords: [-19.2300, -66.9500] as [number, number], estado: 'observado' as const, unidad: 'GF' },
  { nombre: 'Corque', provincia: 'Carangas', coords: [-18.3430, -67.6880] as [number, number], estado: 'normal' as const, unidad: 'UPRAC' },
  { nombre: 'Choquecota', provincia: 'Carangas', coords: [-18.1600, -68.0000] as [number, number], estado: 'normal' as const, unidad: 'UPRAC' },
  { nombre: 'Salinas de Garci Mendoza', provincia: 'Ladislao Cabrera', coords: [-19.6380, -67.6810] as [number, number], estado: 'alerta' as const, unidad: 'GF' },
  { nombre: 'Pampa Aullagas', provincia: 'Ladislao Cabrera', coords: [-19.1950, -67.1510] as [number, number], estado: 'alerta' as const, unidad: 'UPRAC' },
  { nombre: 'Huachacalla', provincia: 'Litoral', coords: [-18.7920, -68.2620] as [number, number], estado: 'observado' as const, unidad: 'UNASBI' },
  { nombre: 'Escara', provincia: 'Litoral', coords: [-18.9780, -68.1820] as [number, number], estado: 'normal' as const, unidad: 'Dirección' },
  { nombre: 'Cruz de Machacamarca', provincia: 'Litoral', coords: [-18.8720, -68.3250] as [number, number], estado: 'normal' as const, unidad: 'UDETRA' },
  { nombre: 'Yunguyo de Litoral', provincia: 'Litoral', coords: [-18.8930, -68.6000] as [number, number], estado: 'observado' as const, unidad: 'GF' },
  { nombre: 'Esmeralda', provincia: 'Litoral', coords: [-19.2810, -68.2140] as [number, number], estado: 'normal' as const, unidad: 'Dirección' },
  { nombre: 'La Rivera', provincia: 'Mejillones', coords: [-19.0450, -68.6280] as [number, number], estado: 'normal' as const, unidad: 'Dirección' },
  { nombre: 'Todos Santos', provincia: 'Mejillones', coords: [-18.8610, -68.7490] as [number, number], estado: 'normal' as const, unidad: 'UDETRA' },
  { nombre: 'Carangas', provincia: 'Mejillones', coords: [-18.8800, -68.6900] as [number, number], estado: 'observado' as const, unidad: 'GF' },
  { nombre: 'Huayllamarca', provincia: 'Nor Carangas', coords: [-17.8420, -67.7860] as [number, number], estado: 'normal' as const, unidad: 'Dirección' },
  { nombre: 'Huanuni', provincia: 'Pantaleón Dalence', coords: [-18.2890, -66.8350] as [number, number], estado: 'concluido' as const, unidad: 'CCIM' },
  { nombre: 'Machacamarca', provincia: 'Pantaleón Dalence', coords: [-18.1720, -67.0210] as [number, number], estado: 'normal' as const, unidad: 'Dirección' },
  { nombre: 'Poopó', provincia: 'Poopó', coords: [-18.3810, -66.9660] as [number, number], estado: 'observado' as const, unidad: 'GF' },
  { nombre: 'Pazña', provincia: 'Poopó', coords: [-18.6030, -66.9250] as [number, number], estado: 'normal' as const, unidad: 'UDETRA' },
  { nombre: 'Antequera', provincia: 'Poopó', coords: [-18.4860, -66.8390] as [number, number], estado: 'observado' as const, unidad: 'UPRAC' },
  { nombre: 'Sabaya', provincia: 'Sabaya', coords: [-19.0160, -68.5300] as [number, number], estado: 'concluido' as const, unidad: 'UNASBI' },
  { nombre: 'Coipasa', provincia: 'Sabaya', coords: [-19.2620, -68.1510] as [number, number], estado: 'normal' as const, unidad: 'Dirección' },
  { nombre: 'Chipaya', provincia: 'Sabaya', coords: [-19.0420, -68.0640] as [number, number], estado: 'concluido' as const, unidad: 'UNASBI' },
  { nombre: 'Curahuara de Carangas', provincia: 'Sajama', coords: [-17.9320, -68.4350] as [number, number], estado: 'normal' as const, unidad: 'UDETRA' },
  { nombre: 'Turco', provincia: 'Sajama', coords: [-18.2070, -68.2480] as [number, number], estado: 'normal' as const, unidad: 'UDETRA' },
  { nombre: 'Totora', provincia: 'San Pedro de Totora', coords: [-17.7990, -68.0200] as [number, number], estado: 'normal' as const, unidad: 'UPRAC' },
  { nombre: 'Toledo', provincia: 'Saucarí', coords: [-18.1930, -67.4050] as [number, number], estado: 'normal' as const, unidad: 'UDETRA' },
  { nombre: 'Santiago de Huari', provincia: 'Sebastián Pagador', coords: [-19.2500, -66.7700] as [number, number], estado: 'alerta' as const, unidad: 'UPRAC' },
  { nombre: 'Santiago de Andamarca', provincia: 'Sud Carangas', coords: [-18.8000, -67.7200] as [number, number], estado: 'concluido' as const, unidad: 'UDETRA' },
  { nombre: 'Belén de Andamarca', provincia: 'Sud Carangas', coords: [-19.0600, -67.6200] as [number, number], estado: 'normal' as const, unidad: 'Dirección' },
  { nombre: 'Eucaliptus', provincia: 'Tomás Barrón', coords: [-17.5940, -67.5110] as [number, number], estado: 'observado' as const, unidad: 'GF' },
];

export const municipios: Municipio[] = baseMunicipios.map((m, i) => {
  const paleta = fotoPaletas[i % fotoPaletas.length];
  return {
    ...m,
    id: crearId(m.nombre),
    descripcion: `${m.nombre} concentra seguimiento territorial en la provincia ${m.provincia}, con registro de ubicación, unidad responsable y evidencia visual para toma de decisiones.`,
    destacados: [
      { titulo: `Seguimiento territorial ${m.nombre}`, detalle: `Monitoreo por ${m.unidad}.` },
      { titulo: 'Control de proyectos activos', detalle: `Provincia: ${m.provincia}.` },
      { titulo: 'Reporte técnico municipal', detalle: `Estado actual: ${estadoLabel[m.estado]}.` },
    ],
    fotos: [
      { titulo: 'Vista territorial', subtitulo: `${m.nombre} • ${m.provincia}`, fondo: `linear-gradient(135deg, ${paleta[0]}, ${paleta[1]})` },
      { titulo: 'Evidencia de obra', subtitulo: `${m.unidad} • ${estadoLabel[m.estado]}`, fondo: `linear-gradient(135deg, ${paleta[1]}, #0f172a)` },
      { titulo: 'Control institucional', subtitulo: `${m.unidad} • ${estadoLabel[m.estado]}`, fondo: `linear-gradient(135deg, #0f172a, ${paleta[0]})` },
    ],
  };
});
