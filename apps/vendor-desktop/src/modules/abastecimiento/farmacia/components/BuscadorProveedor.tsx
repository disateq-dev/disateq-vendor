import { Plus, Search } from 'lucide-react'
import { useEffect, useRef, type ChangeEvent, type ReactElement } from 'react'
import type { Proveedor } from '../../../../domains/farmacia/types'

interface BuscadorProveedorProps {
  termino: string
  resultados: Proveedor[]
  cargando: boolean
  onTerminoChange: (t: string) => void
  onSeleccionar: (p: Proveedor) => void
  onIrSunat: () => void
  onIrManual: () => void
}

function chipEstado(estado: string): string {
  return estado === 'ACTIVO' ? 'bg-[#E3F1FA] text-[#1E88C7]' : 'bg-red-50 text-red-600'
}

export function BuscadorProveedor({
  termino,
  resultados,
  cargando,
  onTerminoChange,
  onSeleccionar,
  onIrSunat,
  onIrManual,
}: BuscadorProveedorProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)
  const puedeMostrarResultados = termino.trim().length >= 2

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <section className="flex flex-1 items-start justify-center px-6 py-14">
      <div className="w-full max-w-3xl">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1E88C7]" />
          <input
            ref={inputRef}
            value={termino}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onTerminoChange(event.target.value)}
            placeholder="Ej: Lab. Portugal, Medifarma, 20501234567..."
            className="h-16 w-full rounded-[28px] border border-[var(--dv-input-border)] bg-white pl-14 pr-6 text-[18px] font-semibold text-slate-800 outline-none focus:border-[var(--dv-input-border-focus)] focus:ring-4 focus:ring-[var(--dv-input-ring-focus)]"
          />
        </div>
        {!puedeMostrarResultados && (
          <p className="mt-3 text-center text-[12px] font-medium text-slate-500">
            Escribe al menos 2 caracteres para ver resultados
          </p>
        )}
        {cargando && puedeMostrarResultados && (
          <p className="mt-5 text-center text-[13px] font-semibold text-[#1E88C7]">Buscando...</p>
        )}
        {!cargando && puedeMostrarResultados && resultados.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#E3F1FA] bg-white">
            {resultados.map((proveedor) => (
              <button
                key={proveedor.id}
                type="button"
                onClick={() => onSeleccionar(proveedor)}
                className="block w-full border-b border-[#E3F1FA] px-5 py-4 text-left hover:bg-[#E3F1FA]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[14px] font-bold text-slate-800">{proveedor.razonSocial}</div>
                    <div className="mt-1 text-[12px] font-medium text-slate-500">{proveedor.ruc ?? 'Sin RUC'}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${chipEstado(proveedor.estado)}`}>
                    {proveedor.estado}
                  </span>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={onIrManual}
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-[13px] font-bold text-[#1E88C7] hover:bg-[#E3F1FA]"
            >
              <Plus className="h-4 w-4" /> Registrar nuevo proveedor
            </button>
          </div>
        )}
        {!cargando && puedeMostrarResultados && resultados.length === 0 && (
          <div className="mt-5 rounded-2xl border border-[#E3F1FA] bg-white p-5 text-center">
            <p className="text-[13px] font-bold text-slate-700">No encontrado</p>
            <div className="mt-4 flex justify-center gap-3">
              <button type="button" onClick={onIrSunat} className="rounded-xl border border-[#45b356]/40 px-4 py-2 text-[12px] font-bold text-[#45b356] hover:bg-[#F2F7F3]">
                Consultar SUNAT por RUC
              </button>
              <button type="button" onClick={onIrManual} className="rounded-xl border border-[#45b356]/40 px-4 py-2 text-[12px] font-bold text-[#45b356] hover:bg-[#F2F7F3]">
                Registrar manualmente
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
