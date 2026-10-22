import { useEffect, useState } from 'react';

interface Props {
  texto: string;
  pregunta: string;
  onConfirmar: () => void;
  className?: string;
}

/**
 * Botón con confirmación en línea (sin window.confirm, que algunos
 * navegadores embebidos bloquean): primer clic pregunta, segundo confirma.
 */
export function BotonConfirmar({ texto, pregunta, onConfirmar, className }: Props) {
  const [preguntando, setPreguntando] = useState(false);

  // Si el usuario no responde en 4 s, se cancela solo
  useEffect(() => {
    if (!preguntando) return;
    const t = setTimeout(() => setPreguntando(false), 4000);
    return () => clearTimeout(t);
  }, [preguntando]);

  if (!preguntando) {
    return (
      <button type="button" className={className} onClick={() => setPreguntando(true)}>
        {texto}
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-xs text-slate-200">{pregunta}</span>
      <button
        type="button"
        className="rounded-md bg-red-600 px-2.5 py-1.5 text-white hover:bg-red-700"
        onClick={() => {
          setPreguntando(false);
          onConfirmar();
        }}
      >
        Sí
      </button>
      <button type="button" className={className} onClick={() => setPreguntando(false)}>
        No
      </button>
    </span>
  );
}
