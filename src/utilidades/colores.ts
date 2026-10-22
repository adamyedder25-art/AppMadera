// Paleta de colores suaves para las piezas (una por fila de entrada).
// Relleno claro + borde más oscuro, legible en pantalla y en PDF impreso.

const PALETA: Array<{ relleno: string; borde: string }> = [
  { relleno: '#cfe3f7', borde: '#3b6ea5' }, // azul
  { relleno: '#d6efd0', borde: '#3f8a3a' }, // verde
  { relleno: '#fbe3c4', borde: '#b87420' }, // naranja
  { relleno: '#ead9f4', borde: '#7c4ea3' }, // lila
  { relleno: '#f8d4d4', borde: '#b04545' }, // rojo
  { relleno: '#d0efee', borde: '#2c8582' }, // turquesa
  { relleno: '#f5edc0', borde: '#9a8420' }, // amarillo
  { relleno: '#e4dccf', borde: '#7a6243' }, // madera
  { relleno: '#d9def7', borde: '#4a57a8' }, // índigo
  { relleno: '#f6d9ea', borde: '#a3487b' }, // rosa
];

export function colorPieza(indice: number) {
  return PALETA[((indice % PALETA.length) + PALETA.length) % PALETA.length];
}
