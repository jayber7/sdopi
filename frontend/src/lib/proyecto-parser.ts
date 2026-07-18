export interface ParsedProyecto {
  nombre?: string;
  contratoNro?: string;
  montoContrato?: number;
  anticipoPct?: number;
  ordenProceder?: string;
  fechaConclusion?: string;
  suspendidoDias?: number;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  contratista?: string;
  supervisor?: string;
  fiscal?: string;
  jefatura?: string;
}

const JEFATURAS = ['DI', 'UDETRA', 'UEH', 'UPRADE', 'UNASVI'];
const MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

function parseNumber(s: string): number | undefined {
  s = s.trim().replace(/\s+/g, '');
  // detect format: if has both dot and comma, last separator is decimal
  const hasDot = s.includes('.');
  const hasComma = s.includes(',');
  if (hasDot && hasComma) {
    // 450,000.00 → last . is decimal, or 450.000,00 → last , is decimal
    if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
      s = s.replace(/,/g, '');
    } else {
      s = s.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasDot) {
    // could be 450.000 (thousands) or 450.00 (decimal). If exactly 3 after last dot → thousands
    const after = s.split('.').pop()!;
    if (after.length !== 3) { s = s.replace('.', ''); } // it's decimal
    // if 3 digits → keep as is (already thousands-separated, JS ignores dots in non-strict)
  } else if (hasComma) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

function parseDate(s: string): string | undefined {
  s = s.trim();
  // DD/MM/YYYY or DD-MM-YYYY
  let m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (m) {
    const d = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    if (!isNaN(Date.parse(d))) return d;
  }
  // YYYY-MM-DD
  m = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (m) {
    const d = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    if (!isNaN(Date.parse(d))) return d;
  }
  // 15 de marzo de 2024
  m = s.match(/^(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})$/i);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    if (month) {
      const d = `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
      if (!isNaN(Date.parse(d))) return d;
    }
  }
  return undefined;
}

export function parseProyecto(text: string): ParsedProyecto {
  const result: ParsedProyecto = {};
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const trimmed = line.trim();
    let m: RegExpMatchArray | null;

    // nombre
    if (!result.nombre) {
      m = trimmed.match(/^(?:Proyecto|Nombre(?:\s+del)?\s+[Pp]royecto|Obra)\s*[:\-\t]\s*(.+)/);
      if (m) { result.nombre = m[1].trim(); continue; }
    }

    // contratoNro
    if (!result.contratoNro) {
      m = trimmed.match(/(?:N[°º]\s*)?Contrato\s*[:\-\t]\s*(.+)/i);
      if (m) { result.contratoNro = m[1].trim(); continue; }
    }

    // montoContrato
    if (!result.montoContrato) {
      m = trimmed.match(/Monto(?:\s+Contrato)?\s*[:\-\t]\s*(?:Bs\.?\s*)?\$?\s*([\d\.,\s]+)/i);
      if (m) { const n = parseNumber(m[1]); if (n !== undefined) { result.montoContrato = n; continue; } }
      m = trimmed.match(/(?:Bs\.?\s*)?\$?\s*([\d\.,\s]+)\s*Bs/i);
      if (m) { const n = parseNumber(m[1]); if (n !== undefined) { result.montoContrato = n; continue; } }
    }

    // anticipoPct
    if (!result.anticipoPct) {
      m = trimmed.match(/(?:% )?Anticipo\s*[:\-\t]\s*([\d\.,]+)\s*%/i);
      if (m) { const n = parseNumber(m[1]); if (n !== undefined) { result.anticipoPct = n; continue; } }
      m = trimmed.match(/(?:% )?Anticipo\s*[:\-\t]\s*([\d\.,]+)/i);
      if (m) { const n = parseNumber(m[1]); if (n !== undefined) { result.anticipoPct = n; continue; } }
    }

    // ordenProceder
    if (!result.ordenProceder) {
      m = trimmed.match(/(?:Orden\s+de\s+[Pp]roceder|O[Pp]\.?|Fecha\s+de\s+[Ii]nicio)\s*[:\-\t]\s*(.+)/i);
      if (m) { const d = parseDate(m[1].trim()); if (d) { result.ordenProceder = d; continue; } }
    }

    // fechaConclusion
    if (!result.fechaConclusion) {
      m = trimmed.match(/(?:[Cc]onclusi[oó]n|Fecha\s+[Cc]onclusi[oó]n|Plazo\s+[Ff]inal)\s*[:\-\t]\s*(.+)/i);
      if (m) { const d = parseDate(m[1].trim()); if (d) { result.fechaConclusion = d; continue; } }
    }

    // suspendidoDias
    if (!result.suspendidoDias) {
      m = trimmed.match(/(?:D[ií]as\s+)?[Ss]uspendido\s*[:\-\t]\s*(\d+)/i);
      if (m) { const n = parseInt(m[1]); if (!isNaN(n)) { result.suspendidoDias = n; continue; } }
    }

    // direccion
    if (!result.direccion) {
      m = trimmed.match(/[Dd]irecci[oó]n\s*[:\-\t]\s*(.+)/);
      if (m) { result.direccion = m[1].trim(); continue; }
    }

    // contratista
    if (!result.contratista) {
      m = trimmed.match(/[Cc]ontratista\s*[:\-\t]\s*(.+)/);
      if (m) { result.contratista = m[1].trim(); continue; }
      m = trimmed.match(/[Ee]mpresa\s*[:\-\t]\s*(.+)/);
      if (m) { result.contratista = m[1].trim(); continue; }
    }

    // supervisor
    if (!result.supervisor) {
      m = trimmed.match(/[Ss]upervisor\s*[:\-\t]\s*(.+)/);
      if (m) { result.supervisor = m[1].trim(); continue; }
    }

    // fiscal
    if (!result.fiscal) {
      m = trimmed.match(/[Ff]iscal\s*[:\-\t]\s*(.+)/);
      if (m) { result.fiscal = m[1].trim(); continue; }
    }

    // jefatura
    if (!result.jefatura) {
      m = trimmed.match(/[Jj]efatura\s*[:\-\t]\s*(DI|UPRADE|UDETRA|UNASVI|UEH)/);
      if (m && JEFATURAS.includes(m[1].toUpperCase())) { result.jefatura = m[1].toUpperCase(); continue; }
    }

    // latitud
    if (!result.latitud) {
      m = trimmed.match(/[Ll]atitud\s*[:\-\t]\s*(-?\d+\.?\d*)/);
      if (m) { const n = parseFloat(m[1]); if (!isNaN(n)) { result.latitud = n; continue; } }
    }

    // longitud
    if (!result.longitud) {
      m = trimmed.match(/[Ll]ongitud\s*[:\-\t]\s*(-?\d+\.?\d*)/);
      if (m) { const n = parseFloat(m[1]); if (!isNaN(n)) { result.longitud = n; continue; } }
      m = trimmed.match(/[Ll]ng\s*[:\-\t]\s*(-?\d+\.?\d*)/i);
      if (m) { const n = parseFloat(m[1]); if (!isNaN(n)) { result.longitud = n; continue; } }
    }
  }

  return result;
}

const LABELS: Record<string, string> = {
  nombre: 'Nombre del proyecto',
  contratoNro: 'N° Contrato',
  montoContrato: 'Monto Contrato',
  anticipoPct: '% Anticipo',
  ordenProceder: 'Orden de Proceder',
  fechaConclusion: 'Fecha Conclusión',
  suspendidoDias: 'Días Suspendido',
  direccion: 'Calles / Ubicación',
  latitud: 'Latitud',
  longitud: 'Longitud',
  contratista: 'Contratista',
  supervisor: 'Supervisor',
  fiscal: 'Fiscal',
  jefatura: 'Jefatura',
};

export interface ParseRow {
  key: string;
  label: string;
  value: string;
  status: 'nuevo' | 'coincide' | 'difiere' | 'no detectado';
  currentValue: string;
}

export function buildParseRows(
  parsed: ParsedProyecto,
  currentForm: Record<string, any>,
): ParseRow[] {
  const fields: (keyof ParsedProyecto)[] = [
    'nombre', 'contratoNro', 'montoContrato', 'anticipoPct',
    'ordenProceder', 'fechaConclusion', 'suspendidoDias',
    'direccion', 'latitud', 'longitud',
    'contratista', 'supervisor', 'fiscal', 'jefatura',
  ];
  return fields.map(key => {
    const label = LABELS[key] || key;
    const parsedVal = parsed[key];
    const currentVal = currentForm[key];
    const parsedStr = parsedVal !== undefined ? String(parsedVal) : '';
    const currentStr = currentVal !== undefined && currentVal !== '' ? String(currentVal) : '';

    if (parsedVal === undefined) {
      return { key, label, value: '', status: 'no detectado' as const, currentValue: currentStr };
    }
    if (!currentStr) {
      return { key, label, value: parsedStr, status: 'nuevo' as const, currentValue: '' };
    }
    if (parsedStr === currentStr) {
      return { key, label, value: parsedStr, status: 'coincide' as const, currentValue: currentStr };
    }
    return { key, label, value: parsedStr, status: 'difiere' as const, currentValue: currentStr };
  });
}

export function mergeParsed(parsed: ParsedProyecto, form: Record<string, any>): Record<string, any> {
  const merged = { ...form };
  for (const [key, val] of Object.entries(parsed)) {
    if (val !== undefined && val !== null) {
      (merged as any)[key] = val;
    }
  }
  return merged;
}
