# Optimizador de Cortes

Aplicación web (100 % en el navegador) para calcular planos de corte de tableros en **guillotina**, inspirada en CutList Optimizer.

## Requisitos
- Node.js 20 o superior (probado con Node 22)

## Ejecutar en local
```bash
npm install
npm run dev        # abre http://localhost:5173
```

## Otros comandos
```bash
npm test           # tests unitarios del algoritmo (Vitest)
npm run build      # comprueba tipos y genera la versión de producción en dist/
npm run preview    # sirve dist/ en http://localhost:4173
```

## Estructura
```
optimizador-cortes/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts               # Vite + React + Tailwind v4 + Vitest
└── src/
    ├── main.tsx                 # arranque de React
    ├── App.tsx                  # maquetación y orquestación
    ├── index.css                # Tailwind
    ├── tipos.ts                 # tipos compartidos
    ├── datosEjemplo.ts          # armario de 2 puertas por defecto
    ├── estado.ts                # useReducer + localStorage
    ├── algoritmo/
    │   ├── guillotina.ts        # algoritmo de corte (validación, BFD, kerf, rotación, veta)
    │   └── guillotina.test.ts   # tests Vitest
    ├── componentes/
    │   ├── CampoNumero.tsx      # input numérico tolerante (coma decimal, vacío)
    │   ├── TablaPiezas.tsx      # tabla editable de piezas
    │   ├── FormTablero.tsx      # tablero, kerf, refilado, rotación
    │   ├── PanelResumen.tsx     # métricas
    │   ├── PlanoCorte.tsx       # plano SVG a escala
    │   └── ListadoCortes.tsx    # piezas, retales y secuencia de cortes
    └── utilidades/
        ├── colores.ts
        ├── formato.ts
        ├── exportarCsv.ts
        └── exportarPdf.tsx      # jsPDF + svg2pdf.js (vectorial)
```

## Convenciones
- Medidas en milímetros.
- **Ancho** = eje largo del tablero; la veta del tablero corre a lo largo de ese eje.
- Una pieza con **Veta** marcada no se gira nunca: su ancho queda a favor de la veta.
- **Kerf**: se descuenta en cada corte entre piezas. Si una pieza llega justo al borde no se descuenta.
- **Refilado**: margen perimetral opcional para eliminar cantos dañados del tablero (por defecto 0).
- Retal **aprovechable**: el que tiene ambos lados ≥ 100 mm.
