// ─────────────────────────────────────────────────────────────
// Estado global de la app (useReducer) + persistencia en localStorage.
// ─────────────────────────────────────────────────────────────

import type { ConfigTablero, PiezaEntrada } from './tipos';
import { PIEZAS_EJEMPLO, TABLERO_EJEMPLO } from './datosEjemplo';

export interface Estado {
  piezas: PiezaEntrada[];
  config: ConfigTablero;
}

export type Accion =
  | { tipo: 'añadirPieza' }
  | { tipo: 'editarPieza'; id: string; cambios: Partial<PiezaEntrada> }
  | { tipo: 'eliminarPieza'; id: string }
  | { tipo: 'duplicarPieza'; id: string }
  | { tipo: 'editarConfig'; cambios: Partial<ConfigTablero> }
  | { tipo: 'cargar'; estado: Estado }
  | { tipo: 'restaurarEjemplo' }
  | { tipo: 'vaciarPiezas' };

const CLAVE_STORAGE = 'optimizador-cortes:v1';

/** Id corto y único para cada fila. */
export const nuevoId = (): string => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function estadoInicial(): Estado {
  return cargarDeStorage() ?? { piezas: PIEZAS_EJEMPLO, config: TABLERO_EJEMPLO };
}

export function reductor(estado: Estado, accion: Accion): Estado {
  switch (accion.tipo) {
    case 'añadirPieza':
      return {
        ...estado,
        piezas: [
          ...estado.piezas,
          { id: nuevoId(), etiqueta: '', ancho: 500, alto: 300, cantidad: 1, veta: false },
        ],
      };
    case 'editarPieza':
      return {
        ...estado,
        piezas: estado.piezas.map((p) => (p.id === accion.id ? { ...p, ...accion.cambios } : p)),
      };
    case 'eliminarPieza':
      return { ...estado, piezas: estado.piezas.filter((p) => p.id !== accion.id) };
    case 'duplicarPieza': {
      const i = estado.piezas.findIndex((p) => p.id === accion.id);
      if (i < 0) return estado;
      const copia = { ...estado.piezas[i], id: nuevoId() };
      const piezas = [...estado.piezas];
      piezas.splice(i + 1, 0, copia);
      return { ...estado, piezas };
    }
    case 'editarConfig':
      return { ...estado, config: { ...estado.config, ...accion.cambios } };
    case 'cargar':
      return accion.estado;
    case 'restaurarEjemplo':
      return { piezas: PIEZAS_EJEMPLO, config: TABLERO_EJEMPLO };
    case 'vaciarPiezas':
      return { ...estado, piezas: [] };
  }
}

// ─────────── localStorage ───────────

export function guardarEnStorage(estado: Estado): boolean {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado));
    return true;
  } catch {
    return false; // modo privado, cuota llena, etc.
  }
}

export function cargarDeStorage(): Estado | null {
  try {
    const txt = localStorage.getItem(CLAVE_STORAGE);
    if (!txt) return null;
    const datos = JSON.parse(txt) as Partial<Estado>;
    if (!Array.isArray(datos.piezas) || !datos.config) return null;
    // Fusionamos con los valores por defecto por si faltan campos de versiones anteriores
    return {
      piezas: datos.piezas,
      config: { ...TABLERO_EJEMPLO, ...datos.config },
    };
  } catch {
    return null;
  }
}
