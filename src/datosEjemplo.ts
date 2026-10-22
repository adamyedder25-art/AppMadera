import type { ConfigTablero, PiezaEntrada } from './tipos';

// Datos por defecto al arrancar la app: armario de 2 puertas.

export const TABLERO_EJEMPLO: ConfigTablero = {
  ancho: 2440,
  alto: 1220,
  grosor: 18,
  cantidad: 5,
  kerf: 3,
  refilado: 0,
  permitirRotacion: true,
};

// Laterales y puertas con veta (la veta debe ir a lo largo de la pieza).
export const PIEZAS_EJEMPLO: PiezaEntrada[] = [
  { id: 'p1', etiqueta: 'Lateral', ancho: 2000, alto: 600, cantidad: 2, veta: true },
  { id: 'p2', etiqueta: 'Balda', ancho: 560, alto: 580, cantidad: 4, veta: false },
  { id: 'p3', etiqueta: 'Puerta', ancho: 1990, alto: 590, cantidad: 2, veta: true },
  { id: 'p4', etiqueta: 'Trasera', ancho: 2000, alto: 1200, cantidad: 1, veta: false },
];
