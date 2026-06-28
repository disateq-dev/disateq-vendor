import { type ReactElement, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmacionVencimientoPanelProps {
  nombreProducto: string
  diasAlVencimiento: number
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmacionVencimientoPanel({
  nombreProducto,
  diasAlVencimiento,
  onConfirmar,
  onCancelar,
}: ConfirmacionVencimientoPanelProps): ReactElement {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onCancelar()
      if (event.key === 'Enter') onConfirmar()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancelar, onConfirmar])

  return (
    <div className="absolute inset-x-0 top-0 z-50 rounded-2xl border bg-white px-3 py-3 shadow-md">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} color="#dc2626" />
        <span className="text-[11px] font-semibold uppercase text-[#dc2626]">
          PRODUCTO PROXIMO A VENCER
        </span>
      </div>

      <p className="mt-1.5 text-[14px] font-bold uppercase text-[#111827]">
        {nombreProducto}
      </p>
      <p className="mt-0.5 text-[13px] font-semibold text-[#dc2626]">
        {diasAlVencimiento === 0
          ? 'Este producto esta VENCIDO.'
          : `Vence en ${diasAlVencimiento} dias.`}
      </p>

      <p className="mt-1 text-[12px] text-[#6b7280]">
        Confirme que el producto es apto para la venta antes de continuar.
      </p>

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-[10px] border border-[#f97316] bg-transparent px-3.5 py-[7px] text-[12px] font-semibold text-[#f97316] hover:bg-[#fff7ed]"
        >
          CANCELAR
          <kbd className="ml-1.5 rounded bg-[#fef3c7] px-1 py-px text-[10px] text-[#92400e]">{'<Esc>'}</kbd>
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          className="rounded-[10px] border-0 bg-[#dc2626] px-3.5 py-[7px] text-[12px] font-semibold text-white hover:bg-[#b91c1c]"
        >
          CONFIRMAR IGUAL
          <kbd className="ml-1.5 rounded bg-white/20 px-1 py-px text-[10px] text-white">{'<Enter>'}</kbd>
        </button>
      </div>
    </div>
  )
}
