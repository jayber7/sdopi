'use client';

import { useState } from 'react';
import { parseProyecto, buildParseRows, type ParsedProyecto, type ParseRow } from '@/lib/proyecto-parser';

interface Props {
  currentForm: Record<string, any>;
  onApply: (parsed: ParsedProyecto) => void;
}

export default function LlenadoAsistido({ currentForm, onApply }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedProyecto | null>(null);
  const [rows, setRows] = useState<ParseRow[]>([]);

  function capture() {
    const p = parseProyecto(text);
    setParsed(p);
    setRows(buildParseRows(p, currentForm));
  }

  function apply() {
    if (parsed) onApply(parsed);
    setParsed(null);
    setRows([]);
    setText('');
    setExpanded(false);
  }

  return (
    <div className="border-t pt-3">
      <button
        type="button"
        onClick={() => { setExpanded(!expanded); if (!expanded) { setText(''); setParsed(null); setRows([]); } }}
        className="text-sm font-medium text-blue-700 hover:text-blue-900"
      >
        {expanded ? '▼ Ocultar Llenado Asistido' : '▶ Llenado Asistido'}
      </button>

      {expanded && (
        <div className="mt-2 space-y-3 rounded border bg-gray-50 p-3">
          <p className="text-xs text-gray-500">
            Pega texto desde Excel, Word, PDF o cualquier fuente. Los campos detectados se rellenarán en el formulario.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full rounded border px-3 py-2 text-sm font-mono"
            placeholder="Ej: Proyecto: Puente San Miguel&#10;Contrato: CAO-2024-089&#10;Monto: 450,000.00&#10;..."
          />
          <button
            type="button"
            onClick={capture}
            disabled={!text.trim()}
            className="rounded bg-blue-700 px-4 py-1.5 text-sm text-white disabled:opacity-40"
          >
            Capturar Campos
          </button>

          {rows.length > 0 && (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="px-2 py-1 font-medium">Campo</th>
                    <th className="px-2 py-1 font-medium">Valor Detectado</th>
                    <th className="px-2 py-1 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} className="border-b">
                      <td className="px-2 py-1 text-gray-700">{r.label}</td>
                      <td className="px-2 py-1">
                        {r.status === 'no detectado' ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <span className={`font-medium ${r.status === 'difiere' ? 'text-amber-700' : 'text-gray-800'}`}>{r.value}</span>
                        )}
                      </td>
                      <td className="px-2 py-1">
                        {r.status === 'nuevo' && <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">nuevo</span>}
                        {r.status === 'coincide' && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">coincide</span>}
                        {r.status === 'difiere' && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">difiere ({r.currentValue})</span>}
                        {r.status === 'no detectado' && <span className="text-xs text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                onClick={apply}
                className="rounded bg-green-700 px-4 py-1.5 text-sm text-white hover:bg-green-800"
              >
                Rellenar formulario
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
