import { Truck, X } from 'lucide-react'
import type { ReactElement } from 'react'
import { BuscadorProductoIngreso } from './components/BuscadorProductoIngreso'
import { LineaIngresoCard } from './components/LineaIngresoCard'
import { SelectorProveedorIngreso } from './components/SelectorProveedorIngreso'
import { useIngresosMercaderia } from './hooks/useIngresosMercaderia'

export function IngresosMercaderiaWorkspace(): ReactElement {
  const ingresos = useIngresosMercaderia()
  const lineasConLote = ingresos.lineas.filter((linea) => linea.requiereLote).length

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-[#EAF3DE] bg-white px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3DE] text-[#639922]">
            <Truck className="h-5 w-5" />
          </span>
          <h1 className="text-[15px] font-bold text-slate-900">Ingresos</h1>
        </div>
        {ingresos.error && (
          <button type="button" onClick={ingresos.onLimpiarError} className="flex items-center gap-2 rounded-full bg-[#EAF3DE] px-3 py-1.5 text-[11px] font-bold text-[#639922]">
            {ingresos.error}
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </header>
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-6 py-5">
        <SelectorProveedorIngreso
          proveedorSeleccionado={ingresos.proveedorSeleccionado}
          termino={ingresos.terminoProveedor}
          resultados={ingresos.resultadosProveedor}
          buscando={ingresos.buscandoProveedor}
          onTerminoChange={ingresos.onTerminoProveedorChange}
          onSeleccionar={ingresos.onSeleccionarProveedor}
        />
        <button type="button" onClick={ingresos.onAbrirBuscadorProducto} className="w-fit rounded-xl bg-[#639922] px-4 py-2 text-[12px] font-bold text-white">
          Agregar producto
        </button>
        <div className="space-y-3">
          {ingresos.lineas.map((linea, index) => (
            <LineaIngresoCard
              key={linea.id}
              linea={linea}
              numero={index + 1}
              onActualizar={(cambios) => ingresos.onActualizarLinea(linea.id, cambios)}
              onEliminar={() => ingresos.onEliminarLinea(linea.id)}
              onUsarLoteGenerico={() => ingresos.onUsarLoteGenerico(linea.id)}
              onUsarLoteReal={() => ingresos.onUsarLoteReal(linea.id)}
            />
          ))}
        </div>
      </main>
      <footer className="flex items-center justify-between border-t border-[#EAF3DE] bg-white px-6 py-4">
        <span className="text-[12px] font-bold text-slate-600">
          {ingresos.lineas.length} líneas · {lineasConLote} con lote
        </span>
        <div className="flex gap-3">
          <button type="button" onClick={ingresos.onCancelar} className="rounded-xl border border-[#EAF3DE] px-4 py-2 text-[12px] font-bold text-slate-600">
            Cancelar
          </button>
          <button type="button" onClick={() => void ingresos.onConfirmarIngreso()} disabled={!ingresos.ingresoValido || ingresos.cargando} className="rounded-xl bg-[#639922] px-5 py-2 text-[12px] font-bold text-white disabled:opacity-50">
            Confirmar ingreso
          </button>
        </div>
      </footer>
      <BuscadorProductoIngreso
        abierto={ingresos.buscadorProductoAbierto}
        termino={ingresos.terminoProducto}
        resultados={ingresos.resultadosProducto}
        onTerminoChange={ingresos.onTerminoProductoChange}
        onSeleccionar={ingresos.onAgregarLinea}
        onCerrar={ingresos.onCerrarBuscadorProducto}
      />
    </div>
  )
}
