import { BookOpen, Pill, X } from 'lucide-react'
import type { ReactElement } from 'react'
import { BuscadorProducto } from './components/BuscadorProducto'
import { DetalleProducto } from './components/DetalleProducto'
import { NuevoProductoStepper } from './components/NuevoProductoStepper'
import { useCatalogoFarmacia } from './hooks/useCatalogoFarmacia'

export function CatalogoFarmaciaWorkspace(): ReactElement {
  const catalogo = useCatalogoFarmacia()

  return (
    <section className="flex min-h-0 flex-1 gap-2">
      <div className="flex flex-[40] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#0284C7]/50 bg-[#FDFCF9]">
        <div className="shrink-0 flex h-[42px] items-center justify-between gap-2 px-4 border-b bg-[#E0F2FE]/60 border-[#0284C7]/15">
          <div className="flex items-center gap-2">
            <Pill size={13} strokeWidth={2} className="shrink-0 text-[#0284C7]" />
            <span className="text-[13px] font-semibold uppercase tracking-tight leading-none text-[#121416]">
              CATÁLOGO
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            {catalogo.termino.trim().length >= 2 &&
              catalogo.resultados.length > 0 &&
              !catalogo.creandoAbierto && (
                <button
                  type="button"
                  onClick={catalogo.onNuevo}
                  className="rounded-full bg-[#E0F2FE] px-3 py-1 text-[11px] font-bold text-[#0284C7]"
                >
                  + NUEVO
                </button>
              )}
            {catalogo.error !== null && (
              <button
                type="button"
                onClick={catalogo.onLimpiarError}
                className="flex min-w-0 items-center gap-2 rounded-full bg-[#E0F2FE] px-3 py-1 text-[11px] font-bold text-[#0284C7]"
              >
                <span className="truncate">{catalogo.error}</span>
                <X className="h-3.5 w-3.5 shrink-0" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <BuscadorProducto
            termino={catalogo.termino}
            resultados={catalogo.resultados}
            cargando={catalogo.cargando}
            onTerminoChange={catalogo.onTerminoChange}
            onSeleccionar={catalogo.onSeleccionar}
            onLimpiar={catalogo.onLimpiar}
          />
        </div>
      </div>

      <div className="flex flex-[60] min-h-0 flex-col overflow-hidden rounded-[28px] border border-[#0284C7]/30 bg-[#FDFCF9]">
        <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 border-b bg-[#E0F2FE]/60 border-[#0284C7]/15">
          {catalogo.creandoAbierto ? (
            <X size={13} strokeWidth={2} className="shrink-0 text-[#0284C7]" />
          ) : (
            <BookOpen size={13} strokeWidth={2} className="shrink-0 text-[#0284C7]" />
          )}
          <span className="text-[13px] font-semibold uppercase tracking-tight leading-none text-[#121416]">
            {catalogo.creandoAbierto ? 'NUEVO PRODUCTO' : 'DETALLE'}
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          {catalogo.creandoAbierto && (
            <NuevoProductoStepper
              paso={catalogo.pasoNuevo}
              terminoBusqueda={catalogo.termino}
              cargando={catalogo.cargando}
              error={catalogo.error}
              onPasoSiguiente={catalogo.onPasoSiguiente}
              onPasoAnterior={catalogo.onPasoAnterior}
              onCancelar={catalogo.onCerrarCreacion}
              onGuardar={catalogo.onGuardarProducto}
            />
          )}

          {!catalogo.creandoAbierto && catalogo.productoSeleccionado !== null && (
            <DetalleProducto
              producto={catalogo.productoSeleccionado}
              presentaciones={catalogo.presentaciones}
              nodos={catalogo.nodos}
              tabActiva={catalogo.tabDetalle}
              cargando={catalogo.cargando}
              onTabChange={catalogo.onTabChange}
              onVolver={catalogo.onVolverBusqueda}
            />
          )}

          {!catalogo.creandoAbierto && catalogo.productoSeleccionado === null && catalogo.sinResultados && (
            <div className="flex flex-col items-center justify-center gap-2 p-6">
              <p className="text-[12px] text-slate-400">No se encontró «{catalogo.termino}»</p>
              <button
                type="button"
                onClick={catalogo.onNuevo}
                className="rounded-xl bg-[#0284C7] px-4 py-2 text-[12px] font-bold text-white"
              >
                + Crear producto nuevo
              </button>
              <button
                type="button"
                onClick={catalogo.onVolverBusqueda}
                className="cursor-pointer text-[11px] text-slate-400"
              >
                Volver a buscar
              </button>
            </div>
          )}

          {!catalogo.creandoAbierto && catalogo.productoSeleccionado === null && !catalogo.sinResultados && (
            <div className="flex flex-col items-center justify-center gap-1 p-6">
              <p className="text-[12px] text-slate-400">
                Selecciona un producto para ver su detalle
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
