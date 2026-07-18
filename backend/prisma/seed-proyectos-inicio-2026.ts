import { PrismaClient, EtapaProyecto, Jefatura } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

const DOCS_DIR = path.resolve(__dirname, '../../Docs');
const FILE = 'PROYECTOS PARA INICIO DE PROCESO 2026.xls';

function normalizeSituacion(raw: string): EtapaProyecto | null {
  const s = raw.toUpperCase().replace(/[,.]/g, '').trim();
  if (s === 'EDTP') return 'SIN_EJECUCION';
  if (s.includes('CAMBIO DE ETAPA') || (s.includes('PREINVERSION') && s.includes('INVERSION'))) return 'CAMBIO_PREINVERSION_A_INVERSION';
  if (s.includes('PREINVERSION') || s.includes('PRE INVERSION')) return 'PREINVERSION';
  if (s.includes('INVERSION PARA LICITACION')) return 'INVERSION_PARA_LICITACION';
  if (s.includes('INVERSION')) return 'INVERSION';
  if (s.includes('SIN EJECUCION')) return 'SIN_EJECUCION';
  if (s.includes('EDTP CONCLUIDO') && (s.includes('ESPERA') || s.includes('INVERSION'))) return 'EDTP_CONCLUIDO_ESPERA_INVERSION';
  if (s.includes('EDTP CONCLUIDO')) return 'EDTP_CONCLUIDO';
  if (s.includes('EN EJECUCION') || s === 'EN EJECCUCION') return 'EN_EJECUCION';
  if (s.includes('EN CIERRE')) return 'EN_CIERRE';
  if (s.includes('CONCLUIDO')) return 'CONCLUIDO';
  if (s.includes('ENTREGA DEFINITIVA')) return 'CON_ENTREGA_DEFINITIVA';
  if (s.includes('CONCILIACION')) return 'CONCILIACION_SALDOS';
  if (s.includes('AUDITORIA')) return 'AUDITORIA_EXTERNA';
  if (s.includes('SUSPENCION') || s.includes('SUSPENSION')) return 'SUSPENSION_CONTRATACION';
  return null;
}

function parseNum(val: any): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const str = String(val).trim().replace(/,/g, '').replace(/\s/g, '');
  if (str === '' || str === '-' || str.toLowerCase() === 'sin inscripcion' || str.toLowerCase() === 'n/a') return null;
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

function hasProjectName(row: any[]): boolean {
  const name = row[1];
  return name != null && String(name).trim().length >= 5;
}

async function main() {
  const filePath = path.join(DOCS_DIR, FILE);
  console.log(`\nLeyendo: ${FILE}`);
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets['Hoja1'];
  if (!ws) { console.log('Hoja1 no encontrada'); return; }

  const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1, defval: null });
  console.log(`Total filas en hoja: ${data.length}`);

  interface RawProyecto {
    nombre: string;
    etapa?: string;
    montoTotal?: number;
    presupuestoVigente?: number;
    montoEjecutado?: number;
    fiscal?: string;
  }

  const rawList: RawProyecto[] = [];

  function addRow(row: any[], hasFiscal: boolean) {
    const nombre = String(row[1]).trim();
    const etapa = row[2] ? String(row[2]).trim() : undefined;
    const montoTotal = parseNum(row[3]) ?? undefined;
    const presupuestoVigente = parseNum(row[4]) ?? undefined;
    const montoEjecutado = parseNum(row[5]) ?? undefined;
    const fiscal = hasFiscal && row[6] ? String(row[6]).trim() : undefined;
    rawList.push({ nombre, etapa, montoTotal, presupuestoVigente, montoEjecutado, fiscal });
  }

  // Section 1 — rows 4-15  (col 6 = PRESUPUESTO PARA INICIO DE PROCESO, no fiscal)
  for (let i = 4; i <= 15; i++) {
    const row = data[i];
    if (!row || !hasProjectName(row)) continue;
    addRow(row, false);
  }

  // Section 2 — rows 20-31  (col 6 = vacío, no fiscal)
  for (let i = 20; i <= 31; i++) {
    const row = data[i];
    if (!row || !hasProjectName(row)) continue;
    addRow(row, false);
  }

  // Section 3 — rows 34-49  (col 6 = FISCAL)
  for (let i = 34; i <= 49; i++) {
    const row = data[i];
    if (!row || !hasProjectName(row)) continue;
    addRow(row, true);
  }

  console.log(`\nProyectos parseados: ${rawList.length}`);

  let created = 0;
  let skipped = 0;

  for (const r of rawList) {
    // Check duplicate by name
    const existing = await prisma.proyecto.findFirst({
      where: { nombre: r.nombre },
    });
    if (existing) {
      console.log(`  SKIP (ya existe): ${r.nombre}`);
      skipped++;
      continue;
    }

    const situacion = r.etapa ? normalizeSituacion(r.etapa) : null;

    await prisma.proyecto.create({
      data: {
        nombre: r.nombre,
        montoContrato: r.montoTotal ?? 0,
        presupuestoVigente: r.presupuestoVigente ?? undefined,
        montoEjecutado: r.montoEjecutado ?? undefined,
        fiscal: r.fiscal ?? undefined,
        situacion: situacion ?? undefined,
        jefatura: Jefatura.DI,
      },
    });

    created++;
    console.log(`  CREADO: ${r.nombre.slice(0, 60)} — etapa: ${r.etapa ?? '(sin etapa)'}`);
  }

  console.log(`\nResumen: ${created} creados, ${skipped} omitidos (duplicados)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
