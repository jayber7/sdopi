export interface Municipio {
  id: string;
  nombre: string;
  provincia: string;
  coords: [number, number];
  estado: 'normal' | 'observado' | 'alerta' | 'concluido';
  avance: number;
  financiero: number;
  proyectos: number;
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
  { nombre: 'Oruro', provincia: 'Cercado', coords: [-17.9647, -67.1060] as [number, number], estado: 'normal' as const, avance: 78, financiero: 72, proyectos: 21, unidad: 'Dirección' },
  { nombre: 'Caracollo', provincia: 'Cercado', coords: [-17.6339, -67.2167] as [number, number], estado: 'normal' as const, avance: 64, financiero: 58, proyectos: 7, unidad: 'UDETRA' },
  { nombre: 'El Choro', provincia: 'Cercado', coords: [-18.3540, -67.2100] as [number, number], estado: 'observado' as const, avance: 46, financiero: 51, proyectos: 4, unidad: 'GF' },
  { nombre: 'Soracachi', provincia: 'Cercado', coords: [-17.9700, -66.8100] as [number, number], estado: 'normal' as const, avance: 59, financiero: 54, proyectos: 5, unidad: 'UPRAC' },
  { nombre: 'Challapata', provincia: 'Abaroa', coords: [-18.8990, -66.7690] as [number, number], estado: 'normal' as const, avance: 69, financiero: 64, proyectos: 10, unidad: 'Dirección' },
  { nombre: 'Santuario de Quillacas', provincia: 'Abaroa', coords: [-19.2300, -66.9500] as [number, number], estado: 'observado' as const, avance: 48, financiero: 53, proyectos: 3, unidad: 'GF' },
  { nombre: 'Corque', provincia: 'Carangas', coords: [-18.3430, -67.6880] as [number, number], estado: 'normal' as const, avance: 62, financiero: 58, proyectos: 8, unidad: 'UPRAC' },
  { nombre: 'Choquecota', provincia: 'Carangas', coords: [-18.1600, -68.0000] as [number, number], estado: 'normal' as const, avance: 57, financiero: 52, proyectos: 4, unidad: 'UPRAC' },
  { nombre: 'Salinas de Garci Mendoza', provincia: 'Ladislao Cabrera', coords: [-19.6380, -67.6810] as [number, number], estado: 'alerta' as const, avance: 34, financiero: 47, proyectos: 6, unidad: 'GF' },
  { nombre: 'Pampa Aullagas', provincia: 'Ladislao Cabrera', coords: [-19.1950, -67.1510] as [number, number], estado: 'alerta' as const, avance: 31, financiero: 42, proyectos: 3, unidad: 'UPRAC' },
  { nombre: 'Huachacalla', provincia: 'Litoral', coords: [-18.7920, -68.2620] as [number, number], estado: 'observado' as const, avance: 53, financiero: 57, proyectos: 4, unidad: 'UNASBI' },
  { nombre: 'Escara', provincia: 'Litoral', coords: [-18.9780, -68.1820] as [number, number], estado: 'normal' as const, avance: 61, financiero: 55, proyectos: 3, unidad: 'Dirección' },
  { nombre: 'Cruz de Machacamarca', provincia: 'Litoral', coords: [-18.8720, -68.3250] as [number, number], estado: 'normal' as const, avance: 56, financiero: 52, proyectos: 3, unidad: 'UDETRA' },
  { nombre: 'Yunguyo de Litoral', provincia: 'Litoral', coords: [-18.8930, -68.6000] as [number, number], estado: 'observado' as const, avance: 44, financiero: 50, proyectos: 2, unidad: 'GF' },
  { nombre: 'Esmeralda', provincia: 'Litoral', coords: [-19.2810, -68.2140] as [number, number], estado: 'normal' as const, avance: 63, financiero: 59, proyectos: 3, unidad: 'Dirección' },
  { nombre: 'La Rivera', provincia: 'Mejillones', coords: [-19.0450, -68.6280] as [number, number], estado: 'normal' as const, avance: 62, financiero: 59, proyectos: 3, unidad: 'Dirección' },
  { nombre: 'Todos Santos', provincia: 'Mejillones', coords: [-18.8610, -68.7490] as [number, number], estado: 'normal' as const, avance: 58, financiero: 54, proyectos: 2, unidad: 'UDETRA' },
  { nombre: 'Carangas', provincia: 'Mejillones', coords: [-18.8800, -68.6900] as [number, number], estado: 'observado' as const, avance: 43, financiero: 46, proyectos: 2, unidad: 'GF' },
  { nombre: 'Huayllamarca', provincia: 'Nor Carangas', coords: [-17.8420, -67.7860] as [number, number], estado: 'normal' as const, avance: 59, financiero: 57, proyectos: 5, unidad: 'Dirección' },
  { nombre: 'Huanuni', provincia: 'Pantaleón Dalence', coords: [-18.2890, -66.8350] as [number, number], estado: 'concluido' as const, avance: 100, financiero: 97, proyectos: 6, unidad: 'CCIM' },
  { nombre: 'Machacamarca', provincia: 'Pantaleón Dalence', coords: [-18.1720, -67.0210] as [number, number], estado: 'normal' as const, avance: 67, financiero: 62, proyectos: 3, unidad: 'Dirección' },
  { nombre: 'Poopó', provincia: 'Poopó', coords: [-18.3810, -66.9660] as [number, number], estado: 'observado' as const, avance: 44, financiero: 48, proyectos: 5, unidad: 'GF' },
  { nombre: 'Pazña', provincia: 'Poopó', coords: [-18.6030, -66.9250] as [number, number], estado: 'normal' as const, avance: 57, financiero: 52, proyectos: 3, unidad: 'UDETRA' },
  { nombre: 'Antequera', provincia: 'Poopó', coords: [-18.4860, -66.8390] as [number, number], estado: 'observado' as const, avance: 49, financiero: 53, proyectos: 2, unidad: 'UPRAC' },
  { nombre: 'Sabaya', provincia: 'Sabaya', coords: [-19.0160, -68.5300] as [number, number], estado: 'concluido' as const, avance: 100, financiero: 98, proyectos: 4, unidad: 'UNASBI' },
  { nombre: 'Coipasa', provincia: 'Sabaya', coords: [-19.2620, -68.1510] as [number, number], estado: 'normal' as const, avance: 64, financiero: 59, proyectos: 2, unidad: 'Dirección' },
  { nombre: 'Chipaya', provincia: 'Sabaya', coords: [-19.0420, -68.0640] as [number, number], estado: 'concluido' as const, avance: 100, financiero: 97, proyectos: 2, unidad: 'UNASBI' },
  { nombre: 'Curahuara de Carangas', provincia: 'Sajama', coords: [-17.9320, -68.4350] as [number, number], estado: 'normal' as const, avance: 64, financiero: 61, proyectos: 5, unidad: 'UDETRA' },
  { nombre: 'Turco', provincia: 'Sajama', coords: [-18.2070, -68.2480] as [number, number], estado: 'normal' as const, avance: 55, financiero: 51, proyectos: 4, unidad: 'UDETRA' },
  { nombre: 'Totora', provincia: 'San Pedro de Totora', coords: [-17.7990, -68.0200] as [number, number], estado: 'normal' as const, avance: 57, financiero: 52, proyectos: 4, unidad: 'UPRAC' },
  { nombre: 'Toledo', provincia: 'Saucarí', coords: [-18.1930, -67.4050] as [number, number], estado: 'normal' as const, avance: 55, financiero: 50, proyectos: 7, unidad: 'UDETRA' },
  { nombre: 'Santiago de Huari', provincia: 'Sebastián Pagador', coords: [-19.2500, -66.7700] as [number, number], estado: 'alerta' as const, avance: 28, financiero: 39, proyectos: 5, unidad: 'UPRAC' },
  { nombre: 'Santiago de Andamarca', provincia: 'Sud Carangas', coords: [-18.8000, -67.7200] as [number, number], estado: 'concluido' as const, avance: 100, financiero: 97, proyectos: 5, unidad: 'UDETRA' },
  { nombre: 'Belén de Andamarca', provincia: 'Sud Carangas', coords: [-19.0600, -67.6200] as [number, number], estado: 'normal' as const, avance: 69, financiero: 63, proyectos: 3, unidad: 'Dirección' },
  { nombre: 'Eucaliptus', provincia: 'Tomás Barrón', coords: [-17.5940, -67.5110] as [number, number], estado: 'observado' as const, avance: 45, financiero: 48, proyectos: 4, unidad: 'GF' },
];

export const municipios: Municipio[] = baseMunicipios.map((m, i) => {
  const paleta = fotoPaletas[i % fotoPaletas.length];
  return {
    ...m,
    id: crearId(m.nombre),
    descripcion: `${m.nombre} concentra seguimiento territorial en la provincia ${m.provincia}, con registro de ubicación, avance técnico, avance financiero, unidad responsable y evidencia visual para toma de decisiones.`,
    destacados: [
      { titulo: `Seguimiento territorial ${m.nombre}`, detalle: `${m.avance}% de avance físico registrado por ${m.unidad}.` },
      { titulo: 'Control de proyectos activos', detalle: `${m.proyectos} proyectos vinculados al municipio.` },
      { titulo: 'Reporte técnico municipal', detalle: `Estado actual: ${estadoLabel[m.estado]}.` },
    ],
    fotos: [
      { titulo: 'Vista territorial', subtitulo: `${m.nombre} • ${m.provincia}`, fondo: `linear-gradient(135deg, ${paleta[0]}, ${paleta[1]})` },
      { titulo: 'Evidencia de obra', subtitulo: `Proyectos activos: ${m.proyectos}`, fondo: `linear-gradient(135deg, ${paleta[1]}, #0f172a)` },
      { titulo: 'Control institucional', subtitulo: `${m.unidad} • ${estadoLabel[m.estado]}`, fondo: `linear-gradient(135deg, #0f172a, ${paleta[0]})` },
    ],
  };
});
