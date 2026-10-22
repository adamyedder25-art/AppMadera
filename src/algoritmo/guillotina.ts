// ─────────────────────────────────────────────────────────────
// Algoritmo de optimización de corte en GUILLOTINA
//
// Idea general:
//  1. Se expanden las piezas por cantidad (2 laterales → 2 unidades).
//  2. Se ordenan de mayor a menor (Decreasing).
//  3. Cada pieza se coloca en el rectángulo libre que mejor encaja
//     (Best Fit) de entre todos los tableros abiertos; si no cabe en
//     ninguno se abre un tablero nuevo.
//  4. Al colocar una pieza en la esquina superior izquierda de un
//     rectángulo libre, éste se divide con UN corte recto de lado a
//     lado (guillotina) en dos sub-rectángulos. Se evalúan las dos
//     orientaciones (horizontal / vertical) y se elige según la regla
//     de la estrategia (p. ej. la que deja el retal más grande).
//  5. El kerf (grosor de sierra) se descuenta en cada corte. Si una
//     pieza llega justo al borde del rectángulo, no hace falta corte.
//  6. Se prueban varias estrategias (orden × selección × regla de
//     división) y se devuelve la mejor: menos piezas sin colocar,
//     menos tableros y retales más grandes y concentrados.
// ─────────────────────────────────────────────────────────────

import type {
  ConfigTablero,
  Corte,
  Metricas,
  PiezaColocada,
  PiezaEntrada,
  PiezaUnidad,
  Rect,
  ResultadoOptimizacion,
  TableroResultado,
} from '../tipos';

/** Lado mínimo (mm) para considerar un retal "aprovechable". */
export const LADO_MIN_RETAL = 100;

type OrdenPiezas = 'area' | 'ladoMayor' | 'perimetro' | 'ancho' | 'alto';
type SeleccionHueco = 'mejorArea' | 'mejorLadoCorto' | 'mejorLadoLargo';
type ReglaDivision = 'retalMayor' | 'ejeCorto' | 'ejeLargo';

interface Estrategia {
  orden: OrdenPiezas;
  seleccion: SeleccionHueco;
  division: ReglaDivision;
}

/** Estado interno de un tablero mientras se empaqueta. */
interface TableroTrabajo {
  libres: Rect[];
  piezas: PiezaColocada[];
  cortes: Corte[];
}

interface ResultadoEmpaquetado {
  tableros: TableroTrabajo[];
  sinColocar: PiezaUnidad[];
}

// ─────────────────────────── Utilidades ───────────────────────────

/** Medidas útiles del tablero tras el refilado perimetral. */
export function areaUtil(config: ConfigTablero): Rect {
  const r = Math.max(0, config.refilado);
  return { x: r, y: r, w: config.ancho - 2 * r, h: config.alto - 2 * r };
}

/** ¿Se puede girar esta pieza? (rotación global activa y sin veta) */
function puedeRotar(veta: boolean, config: ConfigTablero): boolean {
  return config.permitirRotacion && !veta;
}

/** Orientaciones posibles de una pieza: [w, h, rotada]. */
function orientaciones(p: PiezaUnidad, config: ConfigTablero): Array<[number, number, boolean]> {
  const res: Array<[number, number, boolean]> = [[p.ancho, p.alto, false]];
  if (puedeRotar(p.veta, config) && p.ancho !== p.alto) res.push([p.alto, p.ancho, true]);
  return res;
}

const fmt = (n: number) => n.toLocaleString('es-ES');

// ─────────────────────────── Validación ───────────────────────────

/**
 * Comprueba datos del tablero y de las piezas. Devuelve una lista de
 * mensajes de error en español (vacía si todo es correcto).
 */
export function validarEntrada(piezas: PiezaEntrada[], config: ConfigTablero): string[] {
  const errores: string[] = [];
  const util = areaUtil(config);

  if (!(config.ancho > 0) || !(config.alto > 0)) {
    errores.push('Las medidas del tablero deben ser mayores que 0.');
    return errores;
  }
  if (!(config.kerf >= 0)) errores.push('El kerf no puede ser negativo.');
  if (!(config.refilado >= 0)) errores.push('El refilado no puede ser negativo.');
  if (util.w <= 0 || util.h <= 0) errores.push('El refilado es demasiado grande para este tablero.');
  if (config.cantidad !== null && !(config.cantidad >= 1)) {
    errores.push('La cantidad de tableros debe ser al menos 1 (o déjala vacía para ilimitada).');
  }
  if (piezas.length === 0) errores.push('Añade al menos una pieza.');
  if (errores.length) return errores;

  piezas.forEach((p, i) => {
    const nombre = p.etiqueta.trim() || `fila ${i + 1}`;
    if (!(p.ancho > 0) || !(p.alto > 0)) {
      errores.push(`La pieza "${nombre}" debe tener ancho y alto mayores que 0.`);
      return;
    }
    if (!Number.isInteger(p.cantidad) || p.cantidad < 1) {
      errores.push(`La pieza "${nombre}" debe tener una cantidad entera de al menos 1.`);
      return;
    }
    const cabeNormal = p.ancho <= util.w && p.alto <= util.h;
    const cabeGirada = p.alto <= util.w && p.ancho <= util.h;
    if (cabeNormal) return;
    const medidaPieza = `${fmt(p.ancho)} × ${fmt(p.alto)} mm`;
    const medidaTablero = `${fmt(util.w)} × ${fmt(util.h)} mm`;
    if (cabeGirada && !puedeRotar(p.veta, config)) {
      const motivo = p.veta ? 'tiene veta marcada' : 'la rotación está desactivada';
      errores.push(
        `La pieza "${nombre}" (${medidaPieza}) solo cabe girada 90°, pero ${motivo}. Tablero útil: ${medidaTablero}.`,
      );
    } else if (!cabeGirada) {
      errores.push(
        `La pieza "${nombre}" (${medidaPieza}) es más grande que el tablero útil (${medidaTablero}).`,
      );
    }
  });
  return errores;
}

// ─────────────────────────── Expansión ───────────────────────────

/** Convierte las filas (con cantidad) en unidades numeradas 1..N. */
export function expandirPiezas(piezas: PiezaEntrada[]): PiezaUnidad[] {
  const unidades: PiezaUnidad[] = [];
  let numero = 1;
  piezas.forEach((p, fila) => {
    for (let i = 0; i < p.cantidad; i++) {
      unidades.push({
        uid: `${p.id}-${i + 1}`,
        idEntrada: p.id,
        numero: numero++,
        etiqueta: p.etiqueta.trim() || `Pieza ${fila + 1}`,
        ancho: p.ancho,
        alto: p.alto,
        veta: p.veta,
        color: fila,
      });
    }
  });
  return unidades;
}

/** Ordena las unidades de mayor a menor según el criterio dado. */
function ordenar(unidades: PiezaUnidad[], orden: OrdenPiezas): PiezaUnidad[] {
  const clave = (p: PiezaUnidad): number => {
    switch (orden) {
      case 'area':
        return p.ancho * p.alto;
      case 'ladoMayor':
        return Math.max(p.ancho, p.alto);
      case 'perimetro':
        return p.ancho + p.alto;
      case 'ancho':
        return p.ancho;
      case 'alto':
        return p.alto;
    }
  };
  // Desempate por área y luego por número para que sea determinista
  return [...unidades].sort(
    (a, b) => clave(b) - clave(a) || b.ancho * b.alto - a.ancho * a.alto || a.numero - b.numero,
  );
}

// ─────────────────────────── Colocación ───────────────────────────

/** Puntuación de encaje de una pieza w×h en un hueco (menor = mejor). */
function puntuarHueco(r: Rect, w: number, h: number, sel: SeleccionHueco): [number, number] {
  const sobraW = r.w - w;
  const sobraH = r.h - h;
  const corto = Math.min(sobraW, sobraH);
  const largo = Math.max(sobraW, sobraH);
  switch (sel) {
    case 'mejorArea':
      return [r.w * r.h - w * h, corto];
    case 'mejorLadoCorto':
      return [corto, largo];
    case 'mejorLadoLargo':
      return [largo, corto];
  }
}

/**
 * Coloca la pieza en la esquina superior izquierda del hueco `r` y lo
 * divide con cortes de guillotina. Devuelve los nuevos huecos y cortes.
 *
 *  División HORIZONTAL (primer corte a lo ancho):   División VERTICAL (primer corte a lo alto):
 *  ┌──────┬────────┐                                ┌──────┬────────┐
 *  │ PZA  │ dcha.  │                                │ PZA  │        │
 *  ├──────┴────────┤ ← corte H completo             ├──────┤ dcha.  │
 *  │    inferior   │                                │ inf. │        │
 *  └───────────────┘                                └──────┴────────┘
 *                                                          ↑ corte V completo
 */
function dividirHueco(
  r: Rect,
  w: number,
  h: number,
  kerf: number,
  regla: ReglaDivision,
): { nuevos: Rect[]; cortes: Omit<Corte, 'orden'>[] } {
  const sobraW = r.w - w; // espacio a la derecha (incluye kerf)
  const sobraH = r.h - h; // espacio debajo (incluye kerf)

  // Las dos opciones de división
  const opcionH = {
    dcha: { x: r.x + w + kerf, y: r.y, w: sobraW - kerf, h },
    inf: { x: r.x, y: r.y + h + kerf, w: r.w, h: sobraH - kerf },
  };
  const opcionV = {
    dcha: { x: r.x + w + kerf, y: r.y, w: sobraW - kerf, h: r.h },
    inf: { x: r.x, y: r.y + h + kerf, w, h: sobraH - kerf },
  };
  const areaMax = (o: { dcha: Rect; inf: Rect }) =>
    Math.max(Math.max(0, o.dcha.w) * Math.max(0, o.dcha.h), Math.max(0, o.inf.w) * Math.max(0, o.inf.h));

  let horizontal: boolean;
  switch (regla) {
    case 'retalMayor':
      // Elegimos la división que deja el retal individual más grande (menos desperdicio útil)
      horizontal = areaMax(opcionH) >= areaMax(opcionV);
      break;
    case 'ejeCorto':
      horizontal = sobraW <= sobraH;
      break;
    case 'ejeLargo':
      horizontal = sobraW > sobraH;
      break;
  }

  const opcion = horizontal ? opcionH : opcionV;
  const nuevos = [opcion.dcha, opcion.inf].filter((q) => q.w > 0 && q.h > 0);

  // Registro de cortes (posición = eje central del kerf)
  const cortes: Omit<Corte, 'orden'>[] = [];
  const cH = (largoHasta: number) =>
    sobraH > 0 &&
    cortes.push({ orientacion: 'H', posicion: r.y + h + Math.min(kerf, sobraH) / 2, desde: r.x, hasta: largoHasta });
  const cV = (altoHasta: number) =>
    sobraW > 0 &&
    cortes.push({ orientacion: 'V', posicion: r.x + w + Math.min(kerf, sobraW) / 2, desde: r.y, hasta: altoHasta });

  if (horizontal) {
    cH(r.x + r.w); // corte horizontal de lado a lado del hueco
    cV(r.y + h); // después, corte vertical solo en la tira superior
  } else {
    cV(r.y + r.h); // corte vertical de arriba abajo del hueco
    cH(r.x + w); // después, corte horizontal solo en la tira izquierda
  }
  return { nuevos, cortes };
}

interface Candidato {
  /** índice del tablero */
  t: number;
  /** índice del hueco libre dentro del tablero */
  i: number;
  w: number;
  h: number;
  rot: boolean;
  s: [number, number];
}

/** Busca el hueco con mejor encaje (Best Fit) para la pieza, probando ambas orientaciones. */
function buscarHueco(
  p: PiezaUnidad,
  tableros: TableroTrabajo[],
  config: ConfigTablero,
  sel: SeleccionHueco,
): Candidato | null {
  let mejor: Candidato | null = null;
  const orients = orientaciones(p, config);
  for (let t = 0; t < tableros.length; t++) {
    const libres = tableros[t].libres;
    for (let i = 0; i < libres.length; i++) {
      const r = libres[i];
      for (const [w, h, rot] of orients) {
        if (w > r.w || h > r.h) continue;
        const s = puntuarHueco(r, w, h, sel);
        if (!mejor || s[0] < mejor.s[0] || (s[0] === mejor.s[0] && s[1] < mejor.s[1])) {
          mejor = { t, i, w, h, rot, s };
        }
      }
    }
  }
  return mejor;
}

/** Empaqueta todas las unidades con una estrategia concreta. */
function empaquetar(
  unidades: PiezaUnidad[],
  config: ConfigTablero,
  est: Estrategia,
): ResultadoEmpaquetado {
  const tableros: TableroTrabajo[] = [];
  const sinColocar: PiezaUnidad[] = [];
  const maxTableros = config.cantidad ?? Infinity;
  const kerf = Math.max(0, config.kerf);

  for (const p of ordenar(unidades, est.orden)) {
    // 1) Buscar el mejor hueco en todos los tableros abiertos (Best Fit)
    let m = buscarHueco(p, tableros, config, est.seleccion);

    // 2) Si no cabe en ninguno, abrir tablero nuevo (si quedan)
    if (!m) {
      if (tableros.length >= maxTableros) {
        sinColocar.push(p);
        continue;
      }
      const nuevo: TableroTrabajo = { libres: [areaUtil(config)], piezas: [], cortes: [] };
      const cand = buscarHueco(p, [nuevo], config, est.seleccion);
      if (!cand) {
        // No debería ocurrir si la entrada se ha validado antes
        sinColocar.push(p);
        continue;
      }
      tableros.push(nuevo);
      m = { ...cand, t: tableros.length - 1 };
    }

    // 3) Colocar y dividir el hueco
    const tab = tableros[m.t];
    const hueco = tab.libres.splice(m.i, 1)[0];
    tab.piezas.push({
      id: p.uid,
      numero: p.numero,
      etiqueta: p.etiqueta,
      x: hueco.x,
      y: hueco.y,
      w: m.w,
      h: m.h,
      anchoOriginal: p.ancho,
      altoOriginal: p.alto,
      rotada: m.rot,
      color: p.color,
    });
    const { nuevos, cortes } = dividirHueco(hueco, m.w, m.h, kerf, est.division);
    tab.libres.push(...nuevos);
    for (const c of cortes) tab.cortes.push({ ...c, orden: tab.cortes.length + 1 });
  }
  return { tableros, sinColocar };
}

/**
 * Puntuación global (menor = mejor):
 *  1º menos piezas sin colocar, 2º menos tableros,
 *  3º retales más grandes y concentrados (suma de áreas² mayor).
 */
function puntuarResultado(r: ResultadoEmpaquetado): [number, number, number] {
  const concentracion = r.tableros
    .flatMap((t) => t.libres)
    .reduce((s, q) => s + (q.w * q.h) ** 2, 0);
  return [r.sinColocar.length, r.tableros.length, -concentracion];
}

function esMejor(a: [number, number, number], b: [number, number, number]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return false;
}

// ─────────────────────────── API pública ───────────────────────────

const METRICAS_VACIAS: Metricas = {
  numTableros: 0,
  areaPiezas: 0,
  areaTableros: 0,
  desperdicio: 0,
  numPiezas: 0,
  numRetalesAprovechables: 0,
  areaRetalesAprovechables: 0,
};

/**
 * Punto de entrada: valida, prueba todas las estrategias y devuelve
 * el mejor plan de corte con sus métricas.
 */
export function optimizarCortes(piezas: PiezaEntrada[], config: ConfigTablero): ResultadoOptimizacion {
  const errores = validarEntrada(piezas, config);
  if (errores.length) {
    return { tableros: [], sinColocar: [], errores, metricas: METRICAS_VACIAS, estrategia: '' };
  }

  const unidades = expandirPiezas(piezas);
  const ordenes: OrdenPiezas[] = ['area', 'ladoMayor', 'perimetro', 'ancho', 'alto'];
  const selecciones: SeleccionHueco[] = ['mejorArea', 'mejorLadoCorto', 'mejorLadoLargo'];
  const divisiones: ReglaDivision[] = ['retalMayor', 'ejeCorto', 'ejeLargo'];

  let mejor: ResultadoEmpaquetado | null = null;
  let mejorPunt: [number, number, number] | null = null;
  let mejorEst: Estrategia | null = null;
  for (const orden of ordenes)
    for (const seleccion of selecciones)
      for (const division of divisiones) {
        const est = { orden, seleccion, division };
        const r = empaquetar(unidades, config, est);
        const punt = puntuarResultado(r);
        if (!mejorPunt || esMejor(punt, mejorPunt)) {
          mejor = r;
          mejorPunt = punt;
          mejorEst = est;
        }
      }

  return construirResultado(mejor!, config, mejorEst!);
}

/** Convierte el resultado interno en la estructura pública con métricas. */
function construirResultado(
  r: ResultadoEmpaquetado,
  config: ConfigTablero,
  est: Estrategia,
): ResultadoOptimizacion {
  const areaTablero = config.ancho * config.alto;
  const tableros: TableroResultado[] = r.tableros.map((t, i) => {
    const areaPiezas = t.piezas.reduce((s, p) => s + p.w * p.h, 0);
    const retales = [...t.libres].sort((a, b) => b.w * b.h - a.w * a.h);
    return {
      indice: i + 1,
      ancho: config.ancho,
      alto: config.alto,
      piezas: [...t.piezas].sort((a, b) => a.numero - b.numero),
      retales,
      cortes: t.cortes,
      areaPiezas,
      areaTablero,
      desperdicio: (1 - areaPiezas / areaTablero) * 100,
    };
  });

  const areaPiezas = tableros.reduce((s, t) => s + t.areaPiezas, 0);
  const areaTableros = tableros.length * areaTablero;
  const aprovechables = tableros
    .flatMap((t) => t.retales)
    .filter((q) => Math.min(q.w, q.h) >= LADO_MIN_RETAL);

  return {
    tableros,
    sinColocar: r.sinColocar,
    errores: [],
    estrategia: `orden=${est.orden}, hueco=${est.seleccion}, división=${est.division}`,
    metricas: {
      numTableros: tableros.length,
      areaPiezas,
      areaTableros,
      desperdicio: areaTableros ? (1 - areaPiezas / areaTableros) * 100 : 0,
      numPiezas: tableros.reduce((s, t) => s + t.piezas.length, 0),
      numRetalesAprovechables: aprovechables.length,
      areaRetalesAprovechables: aprovechables.reduce((s, q) => s + q.w * q.h, 0),
    },
  };
}
