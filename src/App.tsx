import { useDeferredValue, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { estadoInicial, guardarEnStorage, reductor } from './estado';
import { optimizarCortes } from './algoritmo/guillotina';
import { FormTablero } from './componentes/FormTablero';
import { TablaPiezas } from './componentes/TablaPiezas';
import { PanelResumen } from './componentes/PanelResumen';
import { PlanoCorte } from './componentes/PlanoCorte';
import { ListadoCortes } from './componentes/ListadoCortes';
import { BotonConfirmar } from './componentes/BotonConfirmar';
import { exportarCsv } from './utilidades/exportarCsv';
import { medida, mm, pct } from './utilidades/formato';

function Tarjeta({ titulo, extra, children }: { titulo: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-slate-800">{titulo}</h2>
        {extra}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function App() {
  const [estado, despachar] = useReducer(reductor, undefined, estadoInicial);
  const [tableroSel, setTableroSel] = useState(0);
  const [resaltada, setResaltada] = useState<number | null>(null);
  const [mostrarCortes, setMostrarCortes] = useState(false);
  const [guardado, setGuardado] = useState(true);
  const [exportando, setExportando] = useState(false);

  // Guardado automático en localStorage
  useEffect(() => {
    setGuardado(guardarEnStorage(estado));
  }, [estado]);

  // Cálculo en vivo (diferido para que escribir sea fluido)
  const diferido = useDeferredValue(estado);
  const resultado = useMemo(() => optimizarCortes(diferido.piezas, diferido.config), [diferido]);

  const nTableros = resultado.tableros.length;
  const indice = Math.min(tableroSel, Math.max(0, nTableros - 1));
  const tablero = resultado.tableros[indice];
  const hayErrores = resultado.errores.length > 0;

  const exportarPdfClick = async () => {
    setExportando(true);
    try {
      const { exportarPdf } = await import('./utilidades/exportarPdf');
      await exportarPdf(resultado, estado.config);
    } catch (e) {
      console.error(e);
      alert('No se pudo generar el PDF. Revisa la consola para más detalles.');
    } finally {
      setExportando(false);
    }
  };

  const botonSecundario =
    'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Cabecera */}
      <header className="bg-slate-800 text-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 grid-cols-2 gap-0.5 rounded bg-slate-700 p-1" aria-hidden>
              <span className="rounded-sm bg-sky-300" />
              <span className="rounded-sm bg-amber-200" />
              <span className="col-span-2 rounded-sm bg-emerald-200" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Optimizador de Cortes</h1>
              <p className="text-xs text-slate-300">Planos de corte en guillotina para tableros</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden text-xs text-slate-300 sm:inline">
              {guardado ? '✓ Guardado en este navegador' : 'No se pudo guardar'}
            </span>
            <BotonConfirmar
              texto="Ejemplo"
              pregunta="¿Cargar el ejemplo y perder la lista actual?"
              onConfirmar={() => despachar({ tipo: 'restaurarEjemplo' })}
              className="rounded-md bg-slate-700 px-3 py-1.5 hover:bg-slate-600"
            />
            <BotonConfirmar
              texto="Vaciar"
              pregunta="¿Vaciar la lista de piezas?"
              onConfirmar={() => despachar({ tipo: 'vaciarPiezas' })}
              className="rounded-md bg-slate-700 px-3 py-1.5 hover:bg-slate-600"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-[460px_minmax(0,1fr)]">
        {/* Columna izquierda: entrada de datos */}
        <aside className="min-w-0 space-y-4">
          <Tarjeta titulo="1. Piezas a cortar">
            <TablaPiezas piezas={estado.piezas} despachar={despachar} />
          </Tarjeta>
          <Tarjeta titulo="2. Tablero comercial">
            <FormTablero config={estado.config} onCambio={(cambios) => despachar({ tipo: 'editarConfig', cambios })} />
          </Tarjeta>
          <p className="px-1 text-xs leading-relaxed text-slate-500">
            Medidas en milímetros. <b>Ancho</b> = dirección larga del tablero (a favor de la veta). Marca <b>Veta</b> en
            las piezas que deben conservar la dirección de la veta: no se girarán.
          </p>
        </aside>

        {/* Columna derecha: resultados */}
        <main className="min-w-0 space-y-4">
          {hayErrores ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="mb-1 font-semibold">No se puede calcular el plan de corte:</p>
              <ul className="list-disc space-y-0.5 pl-5">
                {resultado.errores.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ) : (
            <PanelResumen metricas={resultado.metricas} config={estado.config} />
          )}

          {resultado.sinColocar.length > 0 && (
            <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <b>Faltan tableros:</b> {resultado.sinColocar.length} pieza(s) no caben en los {estado.config.cantidad}{' '}
              tablero(s) disponibles:{' '}
              {resultado.sinColocar.map((p) => `${p.numero} ${p.etiqueta} (${medida(p.ancho, p.alto)})`).join(', ')}.
              Aumenta la cantidad máxima para colocarlas.
            </div>
          )}

          {tablero && (
            <>
              <Tarjeta
                titulo="3. Plano de corte"
                extra={
                  <div className="flex gap-2">
                    <button type="button" className={botonSecundario} onClick={exportarPdfClick} disabled={exportando}>
                      {exportando ? 'Generando…' : '⇩ PDF'}
                    </button>
                    <button type="button" className={botonSecundario} onClick={() => exportarCsv(resultado, estado.config)}>
                      ⇩ CSV
                    </button>
                  </div>
                }
              >
                {/* Selector de tablero */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1" role="tablist">
                    {resultado.tableros.map((t, i) => (
                      <button
                        key={t.indice}
                        type="button"
                        role="tab"
                        aria-selected={i === indice}
                        onClick={() => setTableroSel(i)}
                        className={
                          'rounded-md border px-3 py-1.5 text-sm transition ' +
                          (i === indice
                            ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50')
                        }
                      >
                        Tablero {t.indice}
                        <span className={'ml-1.5 text-xs ' + (i === indice ? 'text-sky-100' : 'text-slate-400')}>
                          {t.piezas.length} pz
                        </span>
                      </button>
                    ))}
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-red-600"
                      checked={mostrarCortes}
                      onChange={(e) => setMostrarCortes(e.target.checked)}
                    />
                    Mostrar líneas de corte
                  </label>
                </div>

                <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>
                    <b className="text-slate-700">Tablero {tablero.indice}</b> de {nTableros}
                  </span>
                  <span>
                    {medida(tablero.ancho, tablero.alto)}
                    {estado.config.grosor ? ` × ${mm(estado.config.grosor)}` : ''} mm
                  </span>
                  <span>{tablero.piezas.length} {tablero.piezas.length === 1 ? 'pieza' : 'piezas'}</span>
                  <span>Desperdicio {pct(tablero.desperdicio)}</span>
                  <span>Kerf {mm(estado.config.kerf)} mm</span>
                </div>

                <div className="rounded-lg bg-white">
                  <PlanoCorte
                    tablero={tablero}
                    resaltada={resaltada}
                    onResaltar={setResaltada}
                    mostrarCortes={mostrarCortes}
                    className="h-auto w-full select-none"
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-3 w-4 rounded-sm border border-slate-400 bg-[#ececec]" /> Retal sobrante
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-3 w-4 rounded-sm border border-slate-600 bg-[#d9d9d9]" /> Desperdicio / kerf
                  </span>
                  {mostrarCortes && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block w-4 border-t-2 border-dashed border-red-600" /> Línea de corte
                    </span>
                  )}
                </div>
              </Tarjeta>

              <Tarjeta titulo={`4. Listado de cortes — Tablero ${tablero.indice}`}>
                <ListadoCortes tablero={tablero} resaltada={resaltada} onResaltar={setResaltada} />
              </Tarjeta>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
