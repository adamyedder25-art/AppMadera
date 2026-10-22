// ─────────────────────────────────────────────────────────────
// Tipos compartidos de la aplicación. Todas las medidas en mm.
// Convención: "ancho" = eje X (largo del tablero, p. ej. 2440),
//             "alto"  = eje Y (p. ej. 1220).
// La veta del tablero se considera paralela al eje X (lo habitual
// en tableros melamínicos/chapados: la veta corre a lo largo).
// ─────────────────────────────────────────────────────────────

/** Pieza tal como la introduce el usuario en la tabla. */
export interface PiezaEntrada {
  id: string;
  etiqueta: string;
  ancho: number;
  alto: number;
  cantidad: number;
  /** Si true, la pieza NO puede girarse: su "ancho" debe ir a favor de la veta (eje X). */
  veta: boolean;
}

/** Configuración del tablero comercial y del corte. */
export interface ConfigTablero {
  ancho: number;
  alto: number;
  grosor: number | null;
  /** Nº máximo de tableros disponibles/a usar. null = sin límite. */
  cantidad: number | null;
  /** Grosor de la hoja de sierra (mm). */
  kerf: number;
  /** Refilado perimetral del tablero (mm) para eliminar cantos dañados. */
  refilado: number;
  /** Permitir girar piezas 90° (las piezas con veta nunca se giran). */
  permitirRotacion: boolean;
}

/** Una unidad física de pieza (la entrada expandida por cantidad). */
export interface PiezaUnidad {
  /** Identificador único de la unidad, p. ej. "p2-1" */
  uid: string;
  /** id de la fila de entrada de la que procede */
  idEntrada: string;
  /** Número visible (1, 2, 3…) que coincide en plano y listado */
  numero: number;
  etiqueta: string;
  ancho: number;
  alto: number;
  veta: boolean;
  /** Índice de color (uno por fila de entrada) */
  color: number;
}

/** Pieza ya colocada en un tablero. x,y desde la esquina superior izquierda. */
export interface PiezaColocada {
  id: string;
  numero: number;
  etiqueta: string;
  x: number;
  y: number;
  /** Dimensiones tal como quedan en el tablero (tras rotar si procede) */
  w: number;
  h: number;
  /** Dimensiones originales introducidas por el usuario */
  anchoOriginal: number;
  altoOriginal: number;
  rotada: boolean;
  color: number;
}

/** Rectángulo libre / retal. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Corte guillotina: segmento recto de lado a lado de un sub-rectángulo. */
export interface Corte {
  orden: number;
  /** 'H' = corte horizontal (paralelo al eje X), 'V' = vertical */
  orientacion: 'H' | 'V';
  /** Coordenada del eje del corte (y para H, x para V) */
  posicion: number;
  /** Inicio y fin del segmento sobre el otro eje */
  desde: number;
  hasta: number;
}

export interface TableroResultado {
  indice: number;
  ancho: number;
  alto: number;
  piezas: PiezaColocada[];
  retales: Rect[];
  cortes: Corte[];
  areaPiezas: number;
  areaTablero: number;
  /** % de desperdicio (0-100) */
  desperdicio: number;
}

export interface Metricas {
  numTableros: number;
  areaPiezas: number;
  areaTableros: number;
  desperdicio: number;
  numPiezas: number;
  numRetalesAprovechables: number;
  areaRetalesAprovechables: number;
}

export interface ResultadoOptimizacion {
  tableros: TableroResultado[];
  /** Piezas que no caben por falta de tableros (límite de cantidad) */
  sinColocar: PiezaUnidad[];
  /** Errores de validación (si hay, no se optimiza) */
  errores: string[];
  metricas: Metricas;
  /** Descripción de la estrategia ganadora (diagnóstico) */
  estrategia: string;
}
