import type { ReactNode } from 'react';
import type { ConfigTablero } from '../tipos';
import { CampoNumero } from './CampoNumero';

interface Props {
  config: ConfigTablero;
  onCambio: (cambios: Partial<ConfigTablero>) => void;
}

/** Formulario del tablero comercial y opciones de corte. */
export function FormTablero({ config, onCambio }: Props) {
  const campo = (etiqueta: string, ayuda: string | null, input: ReactNode) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{etiqueta}</span>
      {input}
      {ayuda && <span className="mt-0.5 block text-[11px] text-slate-400">{ayuda}</span>}
    </label>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {campo('Ancho (mm)', null, <CampoNumero ariaLabel="Ancho del tablero" valor={config.ancho} onCambio={(v) => onCambio({ ancho: v ?? NaN })} />)}
        {campo('Alto (mm)', null, <CampoNumero ariaLabel="Alto del tablero" valor={config.alto} onCambio={(v) => onCambio({ alto: v ?? NaN })} />)}
        {campo('Grosor (mm)', null, <CampoNumero ariaLabel="Grosor" permitirVacio placeholder="—" valor={config.grosor} onCambio={(v) => onCambio({ grosor: v })} />)}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {campo('Cantidad máx.', 'Vacío = ilimitada', <CampoNumero ariaLabel="Cantidad de tableros" permitirVacio placeholder="∞" valor={config.cantidad} onCambio={(v) => onCambio({ cantidad: v })} />)}
        {campo('Kerf (mm)', 'Grosor de sierra', <CampoNumero ariaLabel="Kerf" valor={config.kerf} onCambio={(v) => onCambio({ kerf: v ?? NaN })} />)}
        {campo('Refilado (mm)', 'Margen perimetral', <CampoNumero ariaLabel="Refilado" valor={config.refilado} onCambio={(v) => onCambio({ refilado: v ?? NaN })} />)}
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="h-4 w-4 accent-sky-600"
          checked={config.permitirRotacion}
          onChange={(e) => onCambio({ permitirRotacion: e.target.checked })}
        />
        Permitir girar piezas 90°
        <span className="text-xs text-slate-400">(las piezas con veta nunca se giran)</span>
      </label>
    </div>
  );
}
