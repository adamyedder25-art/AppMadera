// ─────────────────────────────────────────────────────────────
// Plano de corte en SVG, a escala (1 unidad SVG = 1 mm).
// Se usa tanto en pantalla como para exportar a PDF, por eso todos
// los estilos van como atributos SVG (no clases CSS).
// ─────────────────────────────────────────────────────────────

import type { PiezaColocada, Rect, TableroResultado } from '../tipos';
import { colorPieza } from '../utilidades/colores';
import { medida, mm } from '../utilidades/formato';
import { LADO_MIN_RETAL } from '../algoritmo/guillotina';

interface Props {
  tablero: TableroResultado;
  /** Nº de pieza resaltada (al pasar el ratón por el listado) */
  resaltada?: number | null;
  onResaltar?: (numero: number | null) => void;
  mostrarCortes?: boolean;
  /** Ancho CSS del SVG (por defecto 100 %) */
  className?: string;
}

const FUENTE = 'Helvetica, Arial, sans-serif';


/** Texto centrado de una pieza, adaptando el tamaño al hueco disponible. */
function TextoPieza({ p, W }: { p: PiezaColocada; W: number }) {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  const linea1 = `${p.numero} · ${p.etiqueta}`;
  const linea2 = medida(p.anchoOriginal, p.altoOriginal);
  const fsMax = W * 0.03;
  const pad = 0.86;

  // Tamaño que permite que las dos líneas quepan a lo ancho y alto
  let fs = Math.min(
    fsMax,
    (p.h * pad) / 2.7,
    (p.w * pad) / (Math.max(linea1.length, linea2.length) * 0.56),
  );
  const minimo = W * 0.0075;

  if (fs >= minimo) {
    const fsMedida = fs;
    const fsNombre = fs * 0.85;
    const mostrarGirada = p.rotada && p.h * pad > fs * 3.6;
    return (
      <g fontFamily={FUENTE} textAnchor="middle" pointerEvents="none">
        <text x={cx} y={cy - fs * 0.25} fontSize={fsNombre} fill="#333" dominantBaseline="auto">
          {linea1}
        </text>
        <text x={cx} y={cy + fs * 0.95} fontSize={fsMedida} fontWeight="bold" fill="#111">
          {linea2}
        </text>
        {mostrarGirada && (
          <text x={cx} y={cy + fs * 2.0} fontSize={fs * 0.6} fill="#555" fontStyle="italic">
            girada 90°
          </text>
        )}
      </g>
    );
  }

  // Pieza muy pequeña: solo el número
  const num = String(p.numero);
  fs = Math.min(p.h * 0.7, (p.w * 0.8) / (num.length * 0.6), fsMax);
  return (
    <text
      x={cx}
      y={cy + fs * 0.35}
      fontSize={fs}
      fontFamily={FUENTE}
      fontWeight="bold"
      textAnchor="middle"
      fill="#111"
      pointerEvents="none"
    >
      {num}
    </text>
  );
}

/** Medida de un retal (solo si es aprovechable y hay sitio). */
function TextoRetal({ r, W }: { r: Rect; W: number }) {
  if (Math.min(r.w, r.h) < LADO_MIN_RETAL) return null;
  const txt = medida(r.w, r.h);
  const vertical = r.h > r.w * 1.6;
  const largo = vertical ? r.h : r.w;
  const corto = vertical ? r.w : r.h;
  const fs = Math.min(W * 0.018, corto * 0.35, (largo * 0.85) / (txt.length * 0.56));
  if (fs < W * 0.006) return null;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  return (
    <text
      x={cx}
      y={cy + fs * 0.35}
      fontSize={fs}
      fontFamily={FUENTE}
      fill="#8a8a8a"
      textAnchor="middle"
      fontStyle="italic"
      transform={vertical ? `rotate(-90 ${cx} ${cy})` : undefined}
      pointerEvents="none"
    >
      {txt}
    </text>
  );
}

export function PlanoCorte({ tablero, resaltada, onResaltar, mostrarCortes = false, className }: Props) {
  const W = tablero.ancho;
  const H = tablero.alto;
  const M = Math.max(W, H) * 0.045; // margen para las cotas exteriores
  const fsCota = M * 0.5;
  const trazo = Math.max(W, H) * 0.0012;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${-M} ${-M} ${W + M * 1.4} ${H + M * 1.4}`}
      className={className}
      role="img"
      aria-label={`Plano del tablero ${tablero.indice}`}
    >
      {/* Cotas del tablero */}
      <g fontFamily={FUENTE} fontSize={fsCota} fill="#444" textAnchor="middle">
        <line x1={0} y1={-M * 0.3} x2={W} y2={-M * 0.3} stroke="#888" strokeWidth={trazo} />
        <line x1={0} y1={-M * 0.5} x2={0} y2={-M * 0.1} stroke="#888" strokeWidth={trazo} />
        <line x1={W} y1={-M * 0.5} x2={W} y2={-M * 0.1} stroke="#888" strokeWidth={trazo} />
        <text x={W / 2} y={-M * 0.42}>{mm(W)}</text>
        <line x1={-M * 0.3} y1={0} x2={-M * 0.3} y2={H} stroke="#888" strokeWidth={trazo} />
        <line x1={-M * 0.5} y1={0} x2={-M * 0.1} y2={0} stroke="#888" strokeWidth={trazo} />
        <line x1={-M * 0.5} y1={H} x2={-M * 0.1} y2={H} stroke="#888" strokeWidth={trazo} />
        <text x={-M * 0.42} y={H / 2} transform={`rotate(-90 ${-M * 0.42} ${H / 2})`}>
          {mm(H)}
        </text>
      </g>

      {/* Tablero: el fondo gris es desperdicio (kerf, tiras finas…) */}
      <rect x={0} y={0} width={W} height={H} fill="#d9d9d9" stroke="#222" strokeWidth={trazo * 2.5} />

      {/* Retales sobrantes */}
      {tablero.retales.map((r, i) => (
        <g key={`r${i}`}>
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill="#ececec"
            stroke="#a8a8a8"
            strokeWidth={trazo}
            strokeDasharray={`${trazo * 6} ${trazo * 4}`}
          />
          <TextoRetal r={r} W={W} />
        </g>
      ))}

      {/* Piezas */}
      {tablero.piezas.map((p) => {
        const c = colorPieza(p.color);
        const activa = resaltada === p.numero;
        return (
          <g
            key={p.id}
            onMouseEnter={onResaltar ? () => onResaltar(p.numero) : undefined}
            onMouseLeave={onResaltar ? () => onResaltar(null) : undefined}
            style={onResaltar ? { cursor: 'default' } : undefined}
          >
            <rect
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              fill={activa ? '#fff3a3' : c.relleno}
              stroke={activa ? '#c49a00' : c.borde}
              strokeWidth={activa ? trazo * 3 : trazo * 1.4}
            />
            <TextoPieza p={p} W={W} />
          </g>
        );
      })}

      {/* Líneas de corte (eje del kerf) */}
      {mostrarCortes &&
        tablero.cortes.map((c) =>
          c.orientacion === 'H' ? (
            <line
              key={`c${c.orden}`}
              x1={c.desde}
              y1={c.posicion}
              x2={c.hasta}
              y2={c.posicion}
              stroke="#d32f2f"
              strokeWidth={trazo * 1.2}
              strokeDasharray={`${trazo * 8} ${trazo * 4}`}
            />
          ) : (
            <line
              key={`c${c.orden}`}
              x1={c.posicion}
              y1={c.desde}
              x2={c.posicion}
              y2={c.hasta}
              stroke="#d32f2f"
              strokeWidth={trazo * 1.2}
              strokeDasharray={`${trazo * 8} ${trazo * 4}`}
            />
          ),
        )}
    </svg>
  );
}
