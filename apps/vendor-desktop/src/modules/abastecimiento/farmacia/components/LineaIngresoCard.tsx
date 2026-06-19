import { Trash2 } from 'lucide-react'
import type { ChangeEvent, ReactElement } from 'react'
import type { LineaIngresoDraft } from '../hooks/useIngresosMercaderia'

interface LineaIngresoCardProps {
  linea: LineaIngresoDraft
  numero: number
  onActualizar: (cambios: Partial<LineaIngresoDraft>) => void
  onEliminar: () => void
  onUsarLoteGenerico: () => void
  onUsarLoteReal: () => void
}

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10)
}

export function LineaIngresoCard({
  linea,
  numero,
  onActualizar,
  onEliminar,
  onUsarLoteGenerico,
  onUsarLoteReal,
}: LineaIngresoCardProps): ReactElement {
  const loteGenerico = `SIN-LOTE-${fechaHoy()}`

  return (
    <article className="rounded-2xl border border-[#EAF3DE] bg-white p-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase text-[#639922]">Línea {numero}</div>
          <h3 className="mt-1 text-[14px] font-bold text-slate-900">{linea.productoNombre}</h3>
          <p className="text-[12px] font-semibold text-slate-500">{linea.presentacionDescripcion}</p>
        </div>
        <button type="button" onClick={onEliminar} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3DE] text-[#639922]">
          <Trash2 className="h-4 w-4" />
        </button>
      </header>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500">Cantidad</span>
          <input
            type="number"
            min="0"
            value={linea.cantidad}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onActualizar({ cantidad: Number(event.target.value) })}
            className="h-10 w-full rounded-xl border border-[#EAF3DE] px-3"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500">Costo unitario</span>
          <input
            type="number"
            min="0"
            value={linea.costoUnitario ?? ''}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onActualizar({ costoUnitario: event.target.value ? Number(event.target.value) : undefined })}
            className="h-10 w-full rounded-xl border border-[#EAF3DE] px-3"
          />
        </label>
      </div>
      {linea.requiereLote && (
        <div className="mt-4 rounded-xl border border-[#EAF3DE] bg-[#EAF3DE] p-3">
          {linea.esLoteGenerico ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-bold text-slate-700">Se generará el lote {loteGenerico}</p>
              <button type="button" onClick={onUsarLoteReal} className="text-[12px] font-bold text-[#639922]">
                Ingresar lote real
              </button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <input
                value={linea.numeroLote ?? ''}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onActualizar({ numeroLote: event.target.value })}
                placeholder="Número de lote"
                className="h-10 rounded-xl border border-white px-3"
              />
              <input
                type="date"
                value={linea.fechaVencimiento ?? ''}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onActualizar({ fechaVencimiento: event.target.value })}
                className="h-10 rounded-xl border border-white px-3"
              />
              <button type="button" onClick={onUsarLoteGenerico} className="w-fit text-[12px] font-bold text-[#639922]">
                No tengo el número de lote
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
