import { useEffect, useState } from 'react';

interface Props {
  valor: number | null;
  onCambio: (v: number | null) => void;
  /** Si true, un campo vacío se interpreta como null (p. ej. "sin límite") */
  permitirVacio?: boolean;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * Input numérico que mantiene el texto mientras se escribe
 * (permite borrar el campo sin que salte a 0) y acepta coma decimal.
 */
export function CampoNumero({ valor, onCambio, permitirVacio, placeholder, className, ariaLabel }: Props) {
  const [texto, setTexto] = useState(valor === null || Number.isNaN(valor) ? '' : String(valor));

  // Sincroniza si el valor cambia desde fuera (p. ej. "restaurar ejemplo")
  useEffect(() => {
    const actual = texto.trim() === '' ? null : Number(texto.replace(',', '.'));
    if (actual !== valor && !(Number.isNaN(actual) && Number.isNaN(valor))) {
      setTexto(valor === null || Number.isNaN(valor) ? '' : String(valor));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={texto}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const t = e.target.value;
        if (!/^[0-9]*[.,]?[0-9]*$/.test(t)) return; // solo números
        setTexto(t);
        if (t.trim() === '') onCambio(permitirVacio ? null : NaN);
        else onCambio(Number(t.replace(',', '.')));
      }}
      className={
        'w-full rounded border border-slate-300 bg-white px-2 py-1 text-right tabular-nums text-sm ' +
        'focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 ' +
        (className ?? '')
      }
    />
  );
}
