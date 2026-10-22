// Utilidades de formato numérico (locale español).

/** 1234.5 → "1.234,5" */
export const mm = (n: number): string =>
  n.toLocaleString('es-ES', { maximumFractionDigits: 1 });

/** mm² → "2,98 m²" */
export const m2 = (mm2: number): string =>
  `${(mm2 / 1e6).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;

/** 29.0563 → "29,1 %" */
export const pct = (n: number): string =>
  `${n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

/** "ancho × alto" */
export const medida = (w: number, h: number): string => `${mm(w)} × ${mm(h)}`;
