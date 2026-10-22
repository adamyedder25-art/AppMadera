// ─────────────────────────────────────────────────────────────
// Exportación a PDF: jsPDF + svg2pdf.js (vectorial, nítido al imprimir).
// Página 1: resumen. Después, una página por tablero con su plano
// y el listado de piezas/retales.
// Las librerías se cargan bajo demanda para no engordar el arranque.
// ─────────────────────────────────────────────────────────────

import { renderToStaticMarkup } from 'react-dom/server';
import type { ConfigTablero, ResultadoOptimizacion } from '../tipos';
import { PlanoCorte } from '../componentes/PlanoCorte';
import { colorPieza } from './colores';
import { m2 as m2Pantalla, medida, mm, pct } from './formato';

// La fuente estándar de jsPDF no siempre dibuja «²»: en el PDF usamos «m2»
const m2 = (v: number) => m2Pantalla(v).replace('²', '2');

const A4 = { w: 297, h: 210 }; // horizontal, en mm
const MARGEN = 12;

/** Convierte "#rrggbb" en [r, g, b]. */
const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

export async function exportarPdf(res: ResultadoOptimizacion, config: ConfigTablero) {
  const [{ jsPDF }, { svg2pdf }] = await Promise.all([import('jspdf'), import('svg2pdf.js')]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const fecha = new Date().toLocaleDateString('es-ES');
  const descTablero = `${mm(config.ancho)} × ${mm(config.alto)}${config.grosor ? ` × ${mm(config.grosor)}` : ''} mm`;
  const n = res.tableros.length;

  /** svg2pdf modifica grosor de línea y colores: los restablecemos tras cada plano. */
  const restablecerEstilo = () => {
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(200);
    doc.setFillColor(255, 255, 255);
    doc.setTextColor(20);
    doc.setFont('helvetica', 'normal');
  };

  /** Cabecera común de cada página. */
  const cabecera = (titulo: string, subtitulo: string) => {
    restablecerEstilo();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(20);
    doc.text(titulo, MARGEN, MARGEN + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(subtitulo, MARGEN, MARGEN + 8);
    doc.text(`Optimizador de cortes · ${fecha}`, A4.w - MARGEN, MARGEN + 2, { align: 'right' });
    doc.setDrawColor(200);
    doc.line(MARGEN, MARGEN + 11, A4.w - MARGEN, MARGEN + 11);
    doc.setTextColor(20);
  };

  /**
   * Tabla sencilla con salto de página automático.
   * Devuelve la Y final.
   */
  const tabla = (
    y: number,
    columnas: Array<{ titulo: string; x: number; alinear?: 'right' }>,
    filas: Array<{ celdas: string[]; color?: string }>,
    alSaltar: () => number,
  ): number => {
    const alto = 5.6;
    const pintarCabecera = (yy: number) => {
      doc.setFillColor(238, 240, 243);
      doc.rect(MARGEN, yy - 4, A4.w - 2 * MARGEN, alto, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      columnas.forEach((c) => doc.text(c.titulo, c.x, yy, { align: c.alinear ?? 'left' }));
      doc.setFont('helvetica', 'normal');
      return yy + alto;
    };
    y = pintarCabecera(y);
    for (const f of filas) {
      if (y > A4.h - MARGEN) y = pintarCabecera(alSaltar());
      if (f.color) {
        doc.setFillColor(...rgb(f.color));
        doc.rect(columnas[0].x, y - 3.4, 3.2, 3.6, 'F');
      }
      f.celdas.forEach((t, i) => {
        const c = columnas[i];
        const x = i === 0 && f.color ? c.x + 5 : c.x;
        doc.text(t, x, y, { align: c.alinear ?? 'left' });
      });
      doc.setDrawColor(230);
      doc.line(MARGEN, y + 1.6, A4.w - MARGEN, y + 1.6);
      y += alto;
    }
    return y;
  };

  // ─────────── Página 1: resumen ───────────
  cabecera('Plan de corte — Resumen', `Tablero ${descTablero} · kerf ${mm(config.kerf)} mm${config.refilado ? ` · refilado ${mm(config.refilado)} mm` : ''}`);
  const m = res.metricas;
  const kpis: Array<[string, string]> = [
    ['Tableros necesarios', String(m.numTableros)],
    ['Desperdicio', pct(m.desperdicio)],
    ['Área de piezas', m2(m.areaPiezas)],
    ['Área de tableros', m2(m.areaTableros)],
    ['Retales aprovechables', String(m.numRetalesAprovechables)],
  ];
  const anchoKpi = (A4.w - 2 * MARGEN - 4 * 4) / 5;
  kpis.forEach(([etq, val], i) => {
    const x = MARGEN + i * (anchoKpi + 4);
    doc.setDrawColor(215);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(x, 30, anchoKpi, 20, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(etq.toUpperCase(), x + 4, 36);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20);
    doc.text(val, x + 4, 45);
    doc.setFont('helvetica', 'normal');
  });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Piezas por tablero', MARGEN, 62);
  doc.setFont('helvetica', 'normal');
  const colsResumen = [
    { titulo: 'Tablero', x: MARGEN + 2 },
    { titulo: 'Nº piezas', x: MARGEN + 40 },
    { titulo: 'Piezas', x: MARGEN + 65 },
    { titulo: 'Desperdicio', x: A4.w - MARGEN - 2, alinear: 'right' as const },
  ];
  let y = tabla(
    70,
    colsResumen,
    res.tableros.map((t) => ({
      celdas: [
        `Tablero ${t.indice}`,
        String(t.piezas.length),
        t.piezas.map((p) => `${p.numero}`).join(', ').slice(0, 120),
        pct(t.desperdicio),
      ],
    })),
    () => {
      doc.addPage();
      cabecera('Plan de corte — Resumen (cont.)', descTablero);
      return 30;
    },
  );

  if (res.sinColocar.length) {
    y += 4;
    doc.setTextColor(176, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Atención: ${res.sinColocar.length} pieza(s) sin colocar por falta de tableros: ` +
        res.sinColocar.map((p) => `${p.numero} ${p.etiqueta} (${medida(p.ancho, p.alto)})`).join(', ').slice(0, 220),
      MARGEN,
      y,
      { maxWidth: A4.w - 2 * MARGEN },
    );
    doc.setTextColor(20);
    doc.setFont('helvetica', 'normal');
  }

  // ─────────── Una página por tablero ───────────
  // Contenedor oculto: svg2pdf necesita el SVG en el DOM para medir textos
  const contenedor = document.createElement('div');
  contenedor.style.cssText = 'position:fixed;left:-10000px;top:0;width:1200px;';
  document.body.appendChild(contenedor);

  try {
    for (const t of res.tableros) {
      doc.addPage();
      const titulo = `Tablero ${t.indice} de ${n}`;
      const sub = `${descTablero} · ${t.piezas.length} ${t.piezas.length === 1 ? 'pieza' : 'piezas'} · desperdicio ${pct(t.desperdicio)} · kerf ${mm(config.kerf)} mm`;
      cabecera(titulo, sub);

      // Plano
      contenedor.innerHTML = renderToStaticMarkup(<PlanoCorte tablero={t} />);
      const svg = contenedor.querySelector('svg')!;
      const vb = svg.viewBox.baseVal;
      const maxW = A4.w - 2 * MARGEN;
      const maxH = 118;
      const escala = Math.min(maxW / vb.width, maxH / vb.height);
      const wPlano = vb.width * escala;
      const hPlano = vb.height * escala;
      await svg2pdf(svg, doc, { x: MARGEN + (maxW - wPlano) / 2, y: MARGEN + 14, width: wPlano, height: hPlano });
      restablecerEstilo();

      // Listado de piezas del tablero
      y = MARGEN + 14 + hPlano + 8;
      const cols = [
        { titulo: 'Nº', x: MARGEN + 2 },
        { titulo: 'Etiqueta', x: MARGEN + 20 },
        { titulo: 'Medida (ancho × alto)', x: MARGEN + 85 },
        { titulo: 'Posición X', x: MARGEN + 160, alinear: 'right' as const },
        { titulo: 'Posición Y', x: MARGEN + 190, alinear: 'right' as const },
        { titulo: 'Girada', x: MARGEN + 205 },
      ];
      const filas = t.piezas.map((p) => ({
        color: colorPieza(p.color).borde,
        celdas: [String(p.numero), p.etiqueta, `${medida(p.anchoOriginal, p.altoOriginal)} mm`, mm(p.x), mm(p.y), p.rotada ? 'Sí' : 'No'],
      }));
      const aprovechables = t.retales.filter((r) => Math.min(r.w, r.h) >= 100);
      for (const r of aprovechables) {
        filas.push({ color: '#c8c8c8', celdas: ['—', 'Retal sobrante', `${medida(r.w, r.h)} mm`, mm(r.x), mm(r.y), ''] });
      }
      tabla(y, cols, filas, () => {
        doc.addPage();
        cabecera(`${titulo} (cont.)`, sub);
        return 30;
      });
    }
  } finally {
    contenedor.remove();
  }

  // Numeración de páginas
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`Página ${i} de ${total}`, A4.w - MARGEN, A4.h - 6, { align: 'right' });
  }

  doc.save('plan-de-corte.pdf');
}
