// Exportación a CSV (separador ";" y BOM UTF-8 para que Excel en español lo abra bien).

import type { ConfigTablero, ResultadoOptimizacion } from '../tipos';

const celda = (v: string | number): string => {
  const s = typeof v === 'number' ? String(v).replace('.', ',') : v;
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function generarCsv(res: ResultadoOptimizacion, config: ConfigTablero): string {
  const filas: Array<Array<string | number>> = [
    ['Tipo', 'Tablero', 'Nº', 'Etiqueta', 'Ancho (mm)', 'Alto (mm)', 'X (mm)', 'Y (mm)', 'Ancho en tablero', 'Alto en tablero', 'Girada'],
  ];
  for (const t of res.tableros) {
    for (const p of t.piezas) {
      filas.push(['Pieza', t.indice, p.numero, p.etiqueta, p.anchoOriginal, p.altoOriginal, p.x, p.y, p.w, p.h, p.rotada ? 'Sí' : 'No']);
    }
    for (const r of t.retales) {
      filas.push(['Retal', t.indice, '', '', r.w, r.h, r.x, r.y, r.w, r.h, '']);
    }
  }
  for (const p of res.sinColocar) {
    filas.push(['Sin colocar', '', p.numero, p.etiqueta, p.ancho, p.alto, '', '', '', '', '']);
  }
  filas.push([]);
  filas.push(['Tablero', `${config.ancho} × ${config.alto}${config.grosor ? ` × ${config.grosor}` : ''} mm`]);
  filas.push(['Kerf (mm)', config.kerf]);
  filas.push(['Tableros necesarios', res.metricas.numTableros]);
  filas.push(['Desperdicio (%)', Number(res.metricas.desperdicio.toFixed(2))]);
  return '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n');
}

/** Descarga un texto como archivo en el navegador. */
export function descargarArchivo(contenido: BlobPart, nombre: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportarCsv(res: ResultadoOptimizacion, config: ConfigTablero) {
  descargarArchivo(generarCsv(res, config), 'plan-de-corte.csv', 'text/csv;charset=utf-8');
}
