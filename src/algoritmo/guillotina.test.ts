import { describe, expect, it } from 'vitest';
import { optimizarCortes } from './guillotina';
import type { ConfigTablero, PiezaEntrada, ResultadoOptimizacion } from '../tipos';
import { PIEZAS_EJEMPLO, TABLERO_EJEMPLO } from '../datosEjemplo';

// ───────────── Ayudas para los tests ─────────────

const config = (parcial: Partial<ConfigTablero> = {}): ConfigTablero => ({
  ancho: 2440,
  alto: 1220,
  grosor: 18,
  cantidad: null,
  kerf: 3,
  refilado: 0,
  permitirRotacion: true,
  ...parcial,
});

let sec = 0;
const pieza = (ancho: number, alto: number, cantidad = 1, veta = false): PiezaEntrada => ({
  id: `t${++sec}`,
  etiqueta: `P${sec}`,
  ancho,
  alto,
  cantidad,
  veta,
});

/**
 * Comprueba la validez geométrica de un resultado:
 * piezas dentro del tablero y separadas al menos por el kerf.
 */
function comprobarGeometria(r: ResultadoOptimizacion, cfg: ConfigTablero) {
  for (const t of r.tableros) {
    for (const p of t.piezas) {
      expect(p.x).toBeGreaterThanOrEqual(cfg.refilado);
      expect(p.y).toBeGreaterThanOrEqual(cfg.refilado);
      expect(p.x + p.w).toBeLessThanOrEqual(cfg.ancho - cfg.refilado);
      expect(p.y + p.h).toBeLessThanOrEqual(cfg.alto - cfg.refilado);
    }
    for (let i = 0; i < t.piezas.length; i++)
      for (let j = i + 1; j < t.piezas.length; j++) {
        const a = t.piezas[i];
        const b = t.piezas[j];
        // Separación en X o en Y debe ser ≥ kerf
        const sepX = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
        const sepY = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
        expect(Math.max(sepX, sepY)).toBeGreaterThanOrEqual(cfg.kerf);
      }
  }
}

// ───────────── Tests ─────────────

describe('optimizarCortes (guillotina)', () => {
  it('1. pieza única: usa un tablero y la coloca en el origen', () => {
    const cfg = config();
    const r = optimizarCortes([pieza(800, 400)], cfg);
    expect(r.errores).toEqual([]);
    expect(r.tableros).toHaveLength(1);
    const p = r.tableros[0].piezas[0];
    expect(p).toMatchObject({ x: 0, y: 0, numero: 1, anchoOriginal: 800, altoOriginal: 400 });
    expect(r.metricas.areaPiezas).toBe(800 * 400);
    expect(r.metricas.desperdicio).toBeCloseTo((1 - (800 * 400) / (2440 * 1220)) * 100, 5);
    // Debe quedar retal aprovechable
    expect(r.tableros[0].retales.length).toBeGreaterThan(0);
  });

  it('2. piezas que caben exactas (kerf 0): 4 × 1220×610 llenan el tablero al 100 %', () => {
    const cfg = config({ kerf: 0 });
    const r = optimizarCortes([pieza(1220, 610, 4)], cfg);
    expect(r.errores).toEqual([]);
    expect(r.tableros).toHaveLength(1);
    expect(r.tableros[0].piezas).toHaveLength(4);
    expect(r.metricas.desperdicio).toBeCloseTo(0, 5);
    expect(r.tableros[0].retales).toHaveLength(0);
    comprobarGeometria(r, cfg);
  });

  it('3. kerf: las mismas piezas exactas ya NO caben en un tablero con kerf 3 mm', () => {
    const cfg = config({ kerf: 3 });
    const r = optimizarCortes([pieza(1220, 610, 4)], cfg);
    expect(r.errores).toEqual([]);
    expect(r.tableros.length).toBeGreaterThan(1);
    comprobarGeometria(r, cfg);
  });

  it('3b. kerf: dos piezas contiguas quedan separadas exactamente por el kerf', () => {
    const cfg = config({ kerf: 4 });
    const r = optimizarCortes([pieza(1200, 1220, 2)], cfg);
    expect(r.tableros).toHaveLength(1);
    const xs = r.tableros[0].piezas.map((p) => p.x).sort((a, b) => a - b);
    expect(xs).toEqual([0, 1204]);
    comprobarGeometria(r, cfg);
  });

  it('4. rotación necesaria: 1000×2000 solo cabe girada en 2440×1220', () => {
    const cfg = config();
    const r = optimizarCortes([pieza(1000, 2000)], cfg);
    expect(r.errores).toEqual([]);
    const p = r.tableros[0].piezas[0];
    expect(p.rotada).toBe(true);
    expect([p.w, p.h]).toEqual([2000, 1000]);
    expect([p.anchoOriginal, p.altoOriginal]).toEqual([1000, 2000]);
  });

  it('4b. sin rotación permitida (o con veta) esa pieza da error claro', () => {
    const sinRot = optimizarCortes([pieza(1000, 2000)], config({ permitirRotacion: false }));
    expect(sinRot.errores[0]).toMatch(/solo cabe girada/);
    const conVeta = optimizarCortes([pieza(1000, 2000, 1, true)], config());
    expect(conVeta.errores[0]).toMatch(/veta/);
  });

  it('4c. respeta la veta: una pieza con veta nunca se gira aunque convenga', () => {
    const cfg = config();
    const r = optimizarCortes([pieza(600, 1000, 6, true)], cfg);
    for (const t of r.tableros) for (const p of t.piezas) expect(p.rotada).toBe(false);
    comprobarGeometria(r, cfg);
  });

  it('5. pieza más grande que el tablero: debe fallar con mensaje claro', () => {
    const r = optimizarCortes([pieza(3000, 1300)], config());
    expect(r.errores).toHaveLength(1);
    expect(r.errores[0]).toMatch(/más grande que el tablero/);
    expect(r.tableros).toHaveLength(0);
  });

  it('6. límite de tableros: las piezas que no caben quedan "sin colocar"', () => {
    const r = optimizarCortes([pieza(2000, 1200, 3)], config({ cantidad: 2 }));
    expect(r.tableros).toHaveLength(2);
    expect(r.sinColocar).toHaveLength(1);
  });

  it('7. refilado: las piezas empiezan tras el margen perimetral', () => {
    const cfg = config({ refilado: 10 });
    const r = optimizarCortes([pieza(500, 500)], cfg);
    expect(r.tableros[0].piezas[0]).toMatchObject({ x: 10, y: 10 });
    // 2440×1220 exacta ya no cabe con refilado
    expect(optimizarCortes([pieza(2440, 1220)], cfg).errores).toHaveLength(1);
  });

  it('8. ejemplo armario: todas las piezas colocadas sin solapes', () => {
    const r = optimizarCortes(PIEZAS_EJEMPLO, TABLERO_EJEMPLO);
    expect(r.errores).toEqual([]);
    expect(r.sinColocar).toHaveLength(0);
    expect(r.metricas.numPiezas).toBe(9);
    // Las baldas (560 mín.) no caben en las tiras de ~440 mm que dejan las piezas de 2000:
    // el mínimo teórico por área es 3, el real con guillotina es 4.
    expect(r.tableros).toHaveLength(4);
    comprobarGeometria(r, TABLERO_EJEMPLO);
  });

  it('9. estrés: 60 piezas aleatorias sin solapes ni salirse del tablero', () => {
    let semilla = 42;
    const rnd = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
    const piezas = Array.from({ length: 20 }, () =>
      pieza(100 + Math.floor(rnd() * 1100), 100 + Math.floor(rnd() * 900), 3, rnd() < 0.3),
    );
    const cfg = config({ refilado: 5 });
    const r = optimizarCortes(piezas, cfg);
    expect(r.errores).toEqual([]);
    expect(r.metricas.numPiezas).toBe(60);
    comprobarGeometria(r, cfg);
  });
});
