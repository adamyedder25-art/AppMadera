import type { PiezaEntrada } from '../tipos';
import type { Accion } from '../estado';
import { CampoNumero } from './CampoNumero';
import { colorPieza } from '../utilidades/colores';

interface Props {
  piezas: PiezaEntrada[];
  despachar: (a: Accion) => void;
}

/** Tabla editable de piezas: añadir, editar, duplicar y eliminar filas. */
export function TablaPiezas({ piezas, despachar }: Props) {
  const editar = (id: string, cambios: Partial<PiezaEntrada>) => despachar({ tipo: 'editarPieza', id, cambios });
  const totalUnidades = piezas.reduce((s, p) => s + (Number.isFinite(p.cantidad) ? p.cantidad : 0), 0);

  return (
    <div>
      <div className="-mx-1 overflow-x-auto">
        <table className="w-full min-w-[400px] border-separate border-spacing-x-1 border-spacing-y-1 text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="w-3"></th>
              <th>Etiqueta</th>
              <th className="w-[72px] text-right">Ancho</th>
              <th className="w-[72px] text-right">Alto</th>
              <th className="w-[48px] text-right">Cant.</th>
              <th className="w-9 text-center" title="Veta: la pieza no se gira; su ancho va a lo largo del tablero">
                Veta
              </th>
              <th className="w-14"></th>
            </tr>
          </thead>
          <tbody>
            {piezas.map((p, i) => (
              <tr key={p.id} className="group">
                <td>
                  <span
                    className="block h-6 w-1.5 rounded-full"
                    style={{ background: colorPieza(i).borde }}
                    aria-hidden
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={p.etiqueta}
                    placeholder={`Pieza ${i + 1}`}
                    aria-label="Etiqueta"
                    onChange={(e) => editar(p.id, { etiqueta: e.target.value })}
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </td>
                <td>
                  <CampoNumero ariaLabel="Ancho" valor={p.ancho} onCambio={(v) => editar(p.id, { ancho: v ?? NaN })} />
                </td>
                <td>
                  <CampoNumero ariaLabel="Alto" valor={p.alto} onCambio={(v) => editar(p.id, { alto: v ?? NaN })} />
                </td>
                <td>
                  <CampoNumero ariaLabel="Cantidad" valor={p.cantidad} onCambio={(v) => editar(p.id, { cantidad: v ?? NaN })} />
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    aria-label="Veta"
                    className="h-4 w-4 accent-sky-600"
                    checked={p.veta}
                    onChange={(e) => editar(p.id, { veta: e.target.checked })}
                  />
                </td>
                <td className="whitespace-nowrap text-right">
                  <button
                    type="button"
                    title="Duplicar fila"
                    onClick={() => despachar({ tipo: 'duplicarPieza', id: p.id })}
                    className="rounded px-1.5 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    ⧉
                  </button>
                  <button
                    type="button"
                    title="Eliminar fila"
                    onClick={() => despachar({ tipo: 'eliminarPieza', id: p.id })}
                    className="rounded px-1.5 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {piezas.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm text-slate-400">
                  No hay piezas. Añade la primera.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => despachar({ tipo: 'añadirPieza' })}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
        >
          + Añadir pieza
        </button>
        <span className="text-xs text-slate-500">
          {piezas.length} filas · {totalUnidades} piezas
        </span>
      </div>
    </div>
  );
}
