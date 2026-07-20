import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

const EXCEL = '/media/hitdev/DatosLinux/PLANILLA DE AVANCE DE OBRA Nº5 CD/2. CERTIFICADO DE AVANCE DE OBRA/02. CERTIFICADO DE AVANCE DE OBRA No.5 ABRIL - REV00.xlsx';
const AVANCE_SHEET = 'Planilla de Avance';
const CERT_SHEET = 'Certificado';

interface ItemRow { numero: number; descripcion: string; unidad: string; cantidad: number; precioUnitario: number; monto: number }
interface RubroData { codigo: string; nombre: string; items: ItemRow[] }

function parseAvance(): RubroData[] {
  const wb = XLSX.readFile(EXCEL);
  const data = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[AVANCE_SHEET], { header: 1 });
  const rubros: RubroData[] = [];
  let current: RubroData | null = null;

  for (const row of data) {
    const col1 = row[0], col2 = row[1], col3 = row[2], col4 = row[3];
    if (col1 == null && col3?.toString().match(/^M0\d\s*-/)) {
      const m = col3.toString().match(/^(M0\d)\s*-\s*(.+)/);
      if (m) { current = { codigo: m[1], nombre: m[2], items: [] }; rubros.push(current); }
    } else if (current && typeof col1 === 'number' && col2 != null && col3) {
      current.items.push({
        numero: col1, descripcion: String(col3).trim(), unidad: String(col4 || '').trim(),
        cantidad: row[4] ?? 0, precioUnitario: row[5] ?? 0, monto: row[6] ?? 0,
      });
    }
  }
  return rubros;
}

function parseCertificado(): Record<string, any> {
  const wb = XLSX.readFile(EXCEL);
  const data = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[CERT_SHEET], { header: 1 });
  const info: Record<string, any> = {};
  for (const row of data) {
    const label = String(row[0] || '').trim();
    if (label.startsWith('PROYECTO:')) info.nombre = String(row[2] || row[1] || '').trim();
    if (label.startsWith('CONTRATO:')) info.contratoNro = String(row[2] || row[1] || '').trim();
    if (label.startsWith('CONTRATISTA:')) info.contratista = String(row[7] || row[1] || '').trim();
    if (label.startsWith('FECHA DE ORDEN DE PROCEDER:')) info.ordenProceder = row[3];
    if (label.startsWith('FECHA DE CONCLUSIÓN')) info.fechaConclusion = row[3];
    if (label.startsWith('MONTO DE CONTRATO ORIGINAL')) info.montoContrato = row[9];
    if (label === 'DIRECCIÓN:') info.direccion = String(row[9] || '').trim();
  }
  return info;
}

async function main() {
  const cert = parseCertificado();
  const nombreProyecto = cert.nombre || 'CONST. HOSPITAL DE ESPECIALIDADES DE ALTA COMPLEJIDAD COMPLEJO HOSPITALARIO SAN JUAN DE DIOS ORURO';
  console.log(`Proyecto: ${nombreProyecto}`);

  let proyecto = await prisma.proyecto.findFirst({ where: { nombre: nombreProyecto } });
  if (!proyecto) {
    proyecto = await prisma.proyecto.create({
      data: {
        nombre: nombreProyecto,
        contratoNro: cert.contratoNro,
        montoContrato: cert.montoContrato || 0,
        ordenProceder: cert.ordenProceder ? new Date(cert.ordenProceder) : undefined,
        fechaConclusion: cert.fechaConclusion ? new Date(cert.fechaConclusion) : undefined,
        contratista: cert.contratista,
        jefatura: 'DI',
        situacion: 'EN_EJECUCION',
      },
    });
    console.log(`  Creado proyecto id=${proyecto.id}`);
  } else {
    console.log(`  Proyecto existente id=${proyecto.id}`);
  }

  const rubros = parseAvance();
  let totalItems = 0;

  for (const r of rubros) {
    const existing = await prisma.rubro.findFirst({ where: { proyectoId: proyecto.id, codigo: r.codigo } });
    if (existing) {
      console.log(`  Rubro ya existe: ${r.codigo} - ${r.nombre} (id=${existing.id})`);
      continue;
    }
    const rubro = await prisma.rubro.create({
      data: { codigo: r.codigo, nombre: r.nombre, proyectoId: proyecto.id },
    });

    const items = r.items.map(i => ({
      rubroId: rubro.id, numero: i.numero, descripcion: i.descripcion, unidad: i.unidad,
      precioUnitario: i.precioUnitario, cantidadContrato: i.cantidad, montoOriginal: i.monto,
    }));
    await prisma.item.createMany({ data: items });
    totalItems += items.length;
    console.log(`  Creado ${r.codigo} - ${r.nombre}: ${items.length} items (id rubro=${rubro.id})`);
  }

  // Sync BASE planilla items if exists
  const base = await prisma.planillaCAO.findFirst({ where: { proyectoId: proyecto.id, tipo: 'BASE', estado: 'borrador' } });
  if (base) {
    const allItems = await prisma.item.findMany({ where: { rubro: { proyectoId: proyecto.id } } });
    const existingAvances = await prisma.avanceItem.findMany({ where: { planillaId: base.id, itemId: { not: null } } });
    const existingByItemId = new Set(existingAvances.map(a => a.itemId!));
    const toCreate = allItems.filter(i => !existingByItemId.has(i.id)).map(i => ({
      planillaId: base.id, itemId: i.id, cantidad: 0, monto: 0, avancePct: 0,
    }));
    if (toCreate.length) {
      await prisma.avanceItem.createMany({ data: toCreate });
      console.log(`  Sincronizados ${toCreate.length} avances en planilla BASE`);
    }
  }

  console.log(`\nTotal: ${rubros.length} rubros, ${totalItems} items importados en proyecto id=${proyecto.id}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
