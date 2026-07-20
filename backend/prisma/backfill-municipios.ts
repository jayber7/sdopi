import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MUNICIPIOS = [
  { nombre: 'Oruro', provincia: 'Cercado', coords: [-17.9647, -67.1060] },
  { nombre: 'Caracollo', provincia: 'Cercado', coords: [-17.6339, -67.2167] },
  { nombre: 'El Choro', provincia: 'Cercado', coords: [-18.3540, -67.2100] },
  { nombre: 'Soracachi', provincia: 'Cercado', coords: [-17.9700, -66.8100] },
  { nombre: 'Challapata', provincia: 'Abaroa', coords: [-18.8990, -66.7690] },
  { nombre: 'Santuario de Quillacas', provincia: 'Abaroa', coords: [-19.2300, -66.9500] },
  { nombre: 'Corque', provincia: 'Carangas', coords: [-18.3430, -67.6880] },
  { nombre: 'Choquecota', provincia: 'Carangas', coords: [-18.1600, -68.0000] },
  { nombre: 'Salinas de Garci Mendoza', provincia: 'Ladislao Cabrera', coords: [-19.6380, -67.6810] },
  { nombre: 'Pampa Aullagas', provincia: 'Ladislao Cabrera', coords: [-19.1950, -67.1510] },
  { nombre: 'Huachacalla', provincia: 'Litoral', coords: [-18.7920, -68.2620] },
  { nombre: 'Escara', provincia: 'Litoral', coords: [-18.9780, -68.1820] },
  { nombre: 'Cruz de Machacamarca', provincia: 'Litoral', coords: [-18.8720, -68.3250] },
  { nombre: 'Yunguyo de Litoral', provincia: 'Litoral', coords: [-18.8930, -68.6000] },
  { nombre: 'Esmeralda', provincia: 'Litoral', coords: [-19.2810, -68.2140] },
  { nombre: 'La Rivera', provincia: 'Mejillones', coords: [-19.0450, -68.6280] },
  { nombre: 'Todos Santos', provincia: 'Mejillones', coords: [-18.8610, -68.7490] },
  { nombre: 'Carangas', provincia: 'Mejillones', coords: [-18.8800, -68.6900] },
  { nombre: 'Huayllamarca', provincia: 'Nor Carangas', coords: [-17.8420, -67.7860] },
  { nombre: 'Huanuni', provincia: 'Pantaleón Dalence', coords: [-18.2890, -66.8350] },
  { nombre: 'Machacamarca', provincia: 'Pantaleón Dalence', coords: [-18.1720, -67.0210] },
  { nombre: 'Poopó', provincia: 'Poopó', coords: [-18.3810, -66.9660] },
  { nombre: 'Pazña', provincia: 'Poopó', coords: [-18.6030, -66.9250] },
  { nombre: 'Antequera', provincia: 'Poopó', coords: [-18.4860, -66.8390] },
  { nombre: 'Sabaya', provincia: 'Sabaya', coords: [-19.0160, -68.5300] },
  { nombre: 'Coipasa', provincia: 'Sabaya', coords: [-19.2620, -68.1510] },
  { nombre: 'Chipaya', provincia: 'Sabaya', coords: [-19.0420, -68.0640] },
  { nombre: 'Curahuara de Carangas', provincia: 'Sajama', coords: [-17.9320, -68.4350] },
  { nombre: 'Turco', provincia: 'Sajama', coords: [-18.2070, -68.2480] },
  { nombre: 'Totora', provincia: 'San Pedro de Totora', coords: [-17.7990, -68.0200] },
  { nombre: 'Toledo', provincia: 'Saucarí', coords: [-18.1930, -67.4050] },
  { nombre: 'Santiago de Huari', provincia: 'Sebastián Pagador', coords: [-19.2500, -66.7700] },
  { nombre: 'Santiago de Andamarca', provincia: 'Sud Carangas', coords: [-18.8000, -67.7200] },
  { nombre: 'Belén de Andamarca', provincia: 'Sud Carangas', coords: [-19.0600, -67.6200] },
  { nombre: 'Eucaliptus', provincia: 'Tomás Barrón', coords: [-17.5940, -67.5110] },
];

const PROVINCIAS = [
  'Abaroa', 'Carangas', 'Cercado', 'Ladislao Cabrera', 'Litoral', 'Mejillones',
  'Nor Carangas', 'Pantaleón Dalence', 'Poopó', 'Sabaya', 'Sajama',
  'San Pedro de Totora', 'Saucarí', 'Sebastián Pagador', 'Sud Carangas', 'Tomás Barrón',
];

function limpiar(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matchProyecto(nombre: string): { municipio?: string; provincia?: string; latitud?: number; longitud?: number } {
  const ln = limpiar(nombre);

  // Sort by longest name first to match "Santiago de Huari" before "Huari"
  const sorted = [...MUNICIPIOS].sort((a, b) => b.nombre.length - a.nombre.length);

  for (const m of sorted) {
    if (ln.includes(limpiar(m.nombre))) {
      const [lat, lng] = m.coords;
      return { municipio: m.nombre, provincia: m.provincia, latitud: lat, longitud: lng };
    }
  }

  // Fallback: match by provincia only
  for (const p of PROVINCIAS) {
    if (ln.includes(limpiar(p))) {
      return { provincia: p };
    }
  }

  return {};
}

async function main() {
  const proyectos = await prisma.proyecto.findMany({
    where: { municipio: null },
    select: { id: true, nombre: true },
  });

  console.log(`\nProyectos sin municipio: ${proyectos.length}\n`);

  let updated = 0;
  let skipped = 0;

  for (const p of proyectos) {
    const match = matchProyecto(p.nombre);
    if (match.municipio || match.provincia) {
      await prisma.proyecto.update({
        where: { id: p.id },
        data: {
          municipio: match.municipio ?? undefined,
          provincia: match.provincia ?? undefined,
          latitud: match.latitud ?? undefined,
          longitud: match.longitud ?? undefined,
        },
      });
      console.log(`  OK  ${match.municipio ?? '-'} / ${match.provincia ?? '-'}  ${p.nombre.slice(0, 60)}`);
      updated++;
    } else {
      console.log(`  --- SIN MATCH  ${p.nombre.slice(0, 60)}`);
      skipped++;
    }
  }

  console.log(`\nResumen: ${updated} actualizados, ${skipped} sin match\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
