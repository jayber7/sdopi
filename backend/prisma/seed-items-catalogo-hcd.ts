import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

const EXCEL = '/media/hitdev/DatosLinux/PLANILLA DE AVANCE DE OBRA Nº5 CD/2. CERTIFICADO DE AVANCE DE OBRA/02. CERTIFICADO DE AVANCE DE OBRA No.5 ABRIL - REV00.xlsx';
const SHEET = 'Planilla de Avance';

function parseRows(): { codigo: string; nombre: string; items: { numero: number; descripcion: string; unidad: string }[] }[] {
  const wb = XLSX.readFile(EXCEL);
  const ws = wb.Sheets[SHEET];
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

  const rubros: { codigo: string; nombre: string; items: { numero: number; descripcion: string; unidad: string }[] }[] = [];
  let current: (typeof rubros)[number] | null = null;

  for (const row of data) {
    const col1 = row[0], col2 = row[1], col3 = row[2], col4 = row[3];
    if (col1 == null && col3?.toString().match(/^M0\d\s*-/)) {
      const m = col3.toString().match(/^(M0\d)\s*-\s*(.+)/);
      if (m) {
        current = { codigo: m[1], nombre: m[2], items: [] };
        rubros.push(current);
      }
    } else if (current && typeof col1 === 'number' && col2 != null && col3) {
      current.items.push({ numero: col1, descripcion: String(col3).trim(), unidad: String(col4 || '').trim() });
    }
  }
  return rubros;
}

async function main() {
  const rubros = parseRows();
  console.log(`Encontrados ${rubros.length} rubros con ${rubros.reduce((s, r) => s + r.items.length, 0)} items total`);

  for (const r of rubros) {
    const existing = await prisma.rubroCatalogo.findFirst({ where: { jefatura: 'DI', nombre: `${r.codigo} - ${r.nombre}` } });
    if (existing) {
      console.log(`  Ya existe: ${r.codigo} - ${r.nombre} (id=${existing.id})`);
      continue;
    }
    const cat = await prisma.rubroCatalogo.create({
      data: {
        jefatura: 'DI',
        nombre: `${r.codigo} - ${r.nombre}`,
        items: { create: r.items.map(i => ({ numero: i.numero, descripcion: i.descripcion, unidad: i.unidad })) },
      },
    });
    console.log(`  Creado: ${r.codigo} - ${r.nombre} (id=${cat.id}, ${r.items.length} items)`);
  }

  console.log('\nCatálogo actualizado.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
