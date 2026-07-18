import { PrismaClient, EtapaProyecto, Jefatura } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

const DOCS_DIR = path.resolve(__dirname, '../../Docs');
const FILES = [
  'PROYECTOS EN EJECUCION 2026.xlsx',
  'PROYECTOS EN EJECUCION POA 2026 - ENERGIA.xlsx',
];

function normalizeSituacion(raw: string): EtapaProyecto | null {
  const s = raw.toUpperCase().replace(/[,.]/g, '').trim();
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
  if (typeof val === 'number') return val;
  const str = String(val).trim().replace(/,/g, '').replace(/\s/g, '');
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

function parseDate(val: any): Date | null {
  if (val == null) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'number') return XLSX.SSF.parse_date_code(val) ? new Date((val - 25569) * 86400 * 1000) : null;
  const s = String(val).trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s);
  return null;
}

interface ExcelRow {
  nro?: number;
  nombre: string;
  contratista?: string;
  supervision?: string;
  estructuraFinanciamiento?: string;
  situacionActual?: string;
  montoContrato?: number;
  montoEjecutado?: number;
  presupuestoVigente?: number;
  numeroPlanillas?: number;
  tiempoEjecucion?: string;
  inicio?: Date;
  fin?: Date;
  modificaciones?: string;
  detalleObs?: string;
  fiscal?: string;
}

function parseSheet(ws: XLSX.WorkSheet): ExcelRow[] {
  const rows: ExcelRow[] = [];
  const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1, defval: null });
  let headerRow = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0] === 'N°' || row[0] === 'N°') { headerRow = i; break; }
  }
  if (headerRow === -1) return rows;

  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    const nro = row[0];
    if (nro == null || String(nro).trim() === '' || !/^\d+$/.test(String(nro).trim())) continue;
    const nombre = row[1];
    if (!nombre || String(nombre).trim().length < 5) continue;
    rows.push({
      nro: parseInt(String(nro).trim(), 10),
      nombre: String(nombre).trim(),
      contratista: row[2] ? String(row[2]).trim() : undefined,
      supervision: row[3] ? String(row[3]).trim() : undefined,
      estructuraFinanciamiento: row[4] ? String(row[4]).trim() : undefined,
      situacionActual: row[5] ? String(row[5]).trim() : undefined,
      montoContrato: parseNum(row[6]) ?? undefined,
      montoEjecutado: parseNum(row[7]) ?? undefined,
      presupuestoVigente: parseNum(row[8]) ?? undefined,
      numeroPlanillas: parseNum(row[11]) ?? undefined,
      tiempoEjecucion: row[12] ? String(row[12]).trim() : undefined,
      inicio: parseDate(row[13]) ?? undefined,
      fin: parseDate(row[14]) ?? undefined,
      modificaciones: row[15] ? String(row[15]).trim() : undefined,
      detalleObs: row[17] ? String(row[17]).trim() : undefined,
      fiscal: row[18] ? String(row[18]).trim() : undefined,
    });
  }
  return rows;
}

async function main() {
  const seen = new Set<string>();
  let total = 0;

  for (const file of FILES) {
    const filePath = path.join(DOCS_DIR, file);
    console.log(`\nProcesando: ${file}`);
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets['LISTADO PROYECTOS'];
    if (!ws) { console.log(`  Hoja LISTADO PROYECTOS no encontrada`); continue; }
    const rows = parseSheet(ws);
    console.log(`  Filas con datos: ${rows.length}`);

    for (const r of rows) {
      const key = r.nombre.toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const situacion = r.situacionActual ? normalizeSituacion(r.situacionActual) : null;

      const existing = await prisma.proyecto.findFirst({ where: { nombre: r.nombre } });
      if (existing) continue;
      const jefatura = Jefatura.DI;
      const proyecto = await prisma.proyecto.create({ data: {
          nombre: r.nombre,
          montoContrato: r.montoContrato ?? 0,
          contratista: r.contratista,
          supervisor: r.supervision,
          fiscal: r.fiscal,
          ordenProceder: r.inicio ?? undefined,
          fechaConclusion: r.fin ?? undefined,
          situacion,
          jefatura,
          estructuraFinanciamiento: r.estructuraFinanciamiento,
          montoEjecutado: r.montoEjecutado,
          presupuestoVigente: r.presupuestoVigente,
          tiempoEjecucion: r.tiempoEjecucion,
          modificaciones: r.modificaciones,
          detalleObs: r.detalleObs,
        },
      });
      total++;
      // ponytail: only log every 5th to avoid spam
      if (total % 5 === 0) console.log(`  Creado: ${proyecto.nombre.slice(0, 50)}...`);
    }
  }

  console.log(`\nTotal proyectos creados: ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
