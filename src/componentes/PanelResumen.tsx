import type { ConfigTablero, Metricas } from '../tipos';
import { m2, pct } from '../utilidades/formato';

interface Props {
  metricas: Metricas;
  config: ConfigTablero;
}

/** Tarjetas de métricas en la parte superior. */
export function PanelResumen({ metricas: m, config }: Props) {
  const tarjetas: Array<{ titulo: string; valor: string; detalle?: string; destacado?: boolean }> = [
    {
      titulo: 'Tableros necesarios',
      valor: String(m.numTableros),
      detalle: config.cantidad ? `de ${config.cantidad} disponibles` : 'sin límite',
      destacado: true,
    },
    { titulo: 'Desperdicio', valor: pct(m.desperdicio), detalle: `aprovechamiento ${pct(100 - m.desperdicio)}` },
    { titulo: 'Área de piezas', valor: m2(m.areaPiezas), detalle: `${m.numPiezas} piezas` },
    { titulo: 'Área de tableros', valor: m2(m.areaTableros) },
    {
      titulo: 'Retales aprovechables',
      valor: String(m.numRetalesAprovechables),
      detalle: m.numRetalesAprovechables ? m2(m.areaRetalesAprovechables) : 'lado ≥ 100 mm',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
      {tarjetas.map((t) => (
        <div
          key={t.titulo}
          className={
            'rounded-lg border px-3 py-2.5 ' +
            (t.destacado ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-white')
          }
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t.titulo}</div>
          <div className={'mt-0.5 text-2xl font-bold tabular-nums ' + (t.destacado ? 'text-sky-700' : 'text-slate-800')}>
            {t.valor}
          </div>
          {t.detalle && <div className="text-xs text-slate-500">{t.detalle}</div>}
        </div>
      ))}
    </div>
  );
}
