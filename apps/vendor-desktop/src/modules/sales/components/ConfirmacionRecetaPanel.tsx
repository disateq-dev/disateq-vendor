import { useEffect, type ReactElement } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmacionRecetaPanelProps {
  nombreProducto: string
  condicion: 'CON_RECETA' | 'CONTROLADO'
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmacionRecetaPanel({
  nombreProducto,
  condicion,
  onConfirmar,
  onCancelar,
}: ConfirmacionRecetaPanelProps): ReactElement {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onCancelar()
      }
      if (event.key === 'Enter') {
        onConfirmar()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancelar, onConfirmar])

  const esControlado = condicion === 'CONTROLADO'
  const colorCondicion = esControlado ? '#dc2626' : '#f97316'
  const textoCondicion = esControlado
    ? 'MEDICAMENTO CONTROLADO — REQUIERE RECETA ESPECIAL'
    : 'REQUIERE RECETA MEDICA'

  return (
    <div className="absolute inset-x-0 top-0 z-50 px-3 py-3 bg-white border border-slate-200 rounded-[16px] shadow-md">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} color={colorCondicion} />
        <span className="text-[11px] font-semibold uppercase" style={{ color: colorCondicion }}>
          {textoCondicion}
        </span>
      </div>

      <p className="mt-1.5 text-[14px] font-bold uppercase text-[#111827]">{nombreProducto}</p>
      <p className="mt-1 text-[12px] text-[#6b7280]">
        Confirme que el paciente presenta receta valida antes de continuar.
      </p>

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-[10px] border border-[#f97316] bg-transparent px-[14px] py-[7px] text-[12px] font-semibold text-[#f97316] hover:bg-[#fff7ed]"
        >
          CANCELAR
          <kbd className="ml-1.5 rounded bg-[#fef3c7] px-1 py-px text-[10px] text-[#92400e]">{'<Esc>'}</kbd>
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          className="rounded-[10px] border-0 bg-[#45b356] px-[14px] py-[7px] text-[12px] font-semibold text-white hover:bg-[#3a9e4a]"
        >
          CONFIRMAR VENTA
          <kbd className="ml-1.5 rounded bg-white/20 px-1 py-px text-[10px] text-white">{'<Enter>'}</kbd>
        </button>
      </div>
    </div>
  )
}
