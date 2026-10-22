import { useState } from 'react';
import type { TableroResultado } from '../tipos';
import { colorPieza } from '../utilidades/colores';
import { medida, mm } from '../utilidades/formato';
import { LADO_MIN_RETAL } from '../algoritmo/guillotina';

interface Props {
  tablero: TableroResultado;
  resaltada: number | null;
  onResaltar: (n: number | null) => void;
}

/** Listado de piezas, retales y secuencia de cortes de un tablero. */
export function ListadoCortes({ tablero, resaltada, onResaltar }: Props) {
  const [verCortes, setVerCortes] = useState(false);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="py-1.5 pr-2">Nº</th>
              <th className="py-1.5 pr-2">Etiqueta</th>
              <th className="py-1.5 pr-2 text-right">Medida (mm)</th>
              <th className="py-1.5 pr-2 text-right">X</th>
              <th className="py-1.5 pr-2 text-right">Y</th>
              <th className="py-1.5 text-center">Girada</th>
            </tr>
          </thead>
          <tbody>
            {tablero.piezas.map((p) => (
              <tr
                key={p.id}
                onMouseEnter={() => onResaltar(p.numero)}
                onMouseLeave={() => onResaltar(null)}
                className={'border-b border-slate-100 ' + (resaltada === p.numero ? 'bg-amber-50' : 'hover:bg-slate-50')}
              >
                <td className="py-1.5 pr-2">
                  <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
                    <span
                      className="inline-block h-3 w-3 rounded-sm border"
                      style={{ background: colorPieza(p.color).relleno, borderColor: colorPieza(p.color).borde }}
                    />
                    {p.numero}
                  </span>
                </td>
                <td className="py-1.5 pr-2">{p.etiqueta}</td>
                <td className="py-1.5 pr-2 text-right font-medium tabular-nums">{medida(p.anchoOriginal, p.altoOriginal)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums text-slate-600">{mm(p.x)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums text-slate-600">{mm(p.y)}</td>
                <td className="py-1.5 text-center text-slate-600">{p.rotada ? '↻ Sí' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Retales */}
      <div>
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Retales sobrantes</h4>
        {tablero.retales.length === 0 ? (
          <p className="text-sm text-slate-400">Sin retales: el tablero se aprovecha por completo.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tablero.retales.map((r, i) => {
              const util = Math.min(r.w, r.h) >= LADO_MIN_RETAL;
              return (
                <span
                  key={i}
                  title={`Posición X ${mm(r.x)}, Y ${mm(r.y)}`}
                  className={
                    'rounded border px-2 py-0.5 text-xs tabular-nums ' +
                    (util ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-dashed border-slate-200 text-slate-400')
                  }
                >
                  {medida(r.w, r.h)}
                  {!util && ' (tira)'}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Secuencia de cortes guillotina */}
      <div>
        <button
          type="button"
          onClick={() => setVerCortes((v) => !v)}
          className="text-xs font-semibold uppercase tracking-wide text-sky-700 hover:text-sky-900"
        >
          {verCortes ? '▾' : '▸'} Secuencia de cortes ({tablero.cortes.length})
        </button>
        {verCortes && (
          <ol className="mt-2 space-y-0.5 text-sm text-slate-700">
            {tablero.cortes.map((c) => (
              <li key={c.orden} className="tabular-nums">
                <span className="inline-block w-7 text-right text-slate-400">{c.orden}.</span>{' '}
                {c.orientacion === 'H' ? (
                  <>Corte <b>horizontal</b> en Y = {mm(c.posicion)} mm (de X {mm(c.desde)} a {mm(c.hasta)})</>
                ) : (
                  <>Corte <b>vertical</b> en X = {mm(c.posicion)} mm (de Y {mm(c.desde)} a {mm(c.hasta)})</>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
