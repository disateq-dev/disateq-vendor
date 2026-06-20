import { X } from 'lucide-react'
import { useEffect, useRef, type ChangeEvent, type ReactElement } from 'react'
import type { ResultadoBusquedaPresentacion } from '../../../../domains/farmacia/types'

interface BuscadorProductoIngresoProps {
  abierto: boolean
  termino: string
  resultados: ResultadoBusquedaPresentacion[]
  onTerminoChange: (t: string) => void
  onSeleccionar: (r: ResultadoBusquedaPresentacion) => void
  onCerrar: () => void
  onCrearNuevo: () => void
}

export function BuscadorProductoIngreso({
  abierto,
  termino,
  resultados,
  onTerminoChange,
  onSeleccionar,
  onCerrar,
  onCrearNuevo,
}: BuscadorProductoIngresoProps): ReactElement | null {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!abierto) return undefined
    inputRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-6 py-20">
      <div className="w-full max-w-2xl rounded-2xl border border-[#EAF3DE] bg-white p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            value={termino}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onTerminoChange(event.target.value)}
            placeholder="Buscar producto o presentación..."
            className="h-12 flex-1 rounded-xl border border-[#EAF3DE] px-3 text-[14px] font-semibold outline-none focus:border-[#639922]"
          />
          <button type="button" onClick={onCerrar} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3DE] text-[#639922]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 max-h-[420px] overflow-auto">
          {resultados.map((resultado) => (
            <button
              key={resultado.presentacionId}
              type="button"
              onClick={() => onSeleccionar(resultado)}
              className="block w-full border-b border-[#EAF3DE] px-3 py-3 text-left hover:bg-[#EAF3DE]"
            >
              <div className="flex items-center justify-between gap-3">
                <span>
                  <span className="block text-[14px] font-bold text-slate-900">{resultado.productoNombre}</span>
                  <span className="block text-[12px] font-semibold text-slate-500">
                    {resultado.descripcion} · {resultado.fabricante}
                  </span>
                </span>
                {resultado.requiereLote && (
                  <span className="rounded-full bg-[#EAF3DE] px-2.5 py-1 text-[10px] font-bold uppercase text-[#639922]">
                    Lote
                  </span>
                )}
              </div>
            </button>
          ))}
          {termino.trim().length >= 2 && resultados.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-[12px] font-semibold text-slate-500">Sin resultados</p>
              <button
                type="button"
                onClick={onCrearNuevo}
                className="mt-3 rounded-xl bg-[#639922] px-4 py-2 text-[12px] font-bold text-white"
              >
                Este producto no existe — regístralo ahora
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
