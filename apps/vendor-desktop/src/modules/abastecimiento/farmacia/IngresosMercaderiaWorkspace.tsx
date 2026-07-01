import { Truck, X } from 'lucide-react'
import type { ReactElement } from 'react'
import { BuscadorProductoIngreso } from './components/BuscadorProductoIngreso'
import { ConsultaSunatProveedor } from './components/ConsultaSunatProveedor'
import { FormularioProveedor } from './components/FormularioProveedor'
import { LineaIngresoCard } from './components/LineaIngresoCard'
import { NuevoProductoStepper } from './components/NuevoProductoStepper'
import { SelectorProveedorIngreso } from './components/SelectorProveedorIngreso'
import { useIngresosMercaderia } from './hooks/useIngresosMercaderia'

export function IngresosMercaderiaWorkspace(): ReactElement {
  const ingresos = useIngresosMercaderia()
  const lineasConLote = ingresos.lineas.filter((linea) => linea.requiereLote).length

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#3B6B34]/50 bg-[#FDFCF9]">
      <div className="shrink-0 flex h-[42px] items-center justify-between gap-2 px-4 border-b bg-[#E8F0E6]/60 border-[#3B6B34]/15">
        <div className="flex items-center gap-2">
          <Truck size={13} strokeWidth={2} className="shrink-0 text-[#3B6B34]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight leading-none text-[#121416]">
            {ingresos.creandoProductoAbierto && 'REGISTRANDO PRODUCTO'}
            {!ingresos.creandoProductoAbierto && ingresos.creandoProveedorAbierto && 'REGISTRANDO PROVEEDOR'}
            {!ingresos.creandoProductoAbierto && !ingresos.creandoProveedorAbierto && 'INGRESOS DE MERCANCÍA'}
          </span>
        </div>
        {ingresos.error && (
          <button
            type="button"
            onClick={ingresos.onLimpiarError}
            className="flex min-w-0 items-center gap-2 rounded-full bg-[#E8F0E6] px-3 py-1 text-[11px] font-bold text-[#3B6B34]"
          >
            <span className="truncate">{ingresos.error}</span>
            <X className="h-3.5 w-3.5 shrink-0" />
          </button>
        )}
      </div>

      {!ingresos.creandoProductoAbierto && !ingresos.creandoProveedorAbierto && (
        <div className="min-h-0 flex-1 overflow-auto px-6 py-5 flex flex-col gap-4">
          <SelectorProveedorIngreso
            proveedorSeleccionado={ingresos.proveedorSeleccionado}
            termino={ingresos.terminoProveedor}
            resultados={ingresos.resultadosProveedor}
            buscando={ingresos.buscandoProveedor}
            onTerminoChange={ingresos.onTerminoProveedorChange}
            onSeleccionar={ingresos.onSeleccionarProveedor}
            onIrSunat={ingresos.onAbrirCreacionProveedorSunat}
            onIrManual={ingresos.onAbrirCreacionProveedorManual}
          />
          <button
            type="button"
            onClick={ingresos.onAbrirBuscadorProducto}
            className="w-fit rounded-xl border border-[#45b356]/40 px-4 py-2 text-[12px] font-bold text-[#45b356] hover:bg-[#F2F7F3]"
          >
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
        </div>
      )}

      {ingresos.creandoProductoAbierto && (
        <div className="min-h-0 flex-1 overflow-auto">
          <NuevoProductoStepper
            paso={ingresos.pasoNuevoProducto}
            terminoBusqueda={ingresos.terminoProducto}
            cargando={ingresos.cargando}
            error={ingresos.error}
            onPasoSiguiente={ingresos.onPasoSiguienteProducto}
            onPasoAnterior={ingresos.onPasoAnteriorProducto}
            onCancelar={ingresos.onCerrarCreacionProducto}
            onGuardar={ingresos.onGuardarProductoYAgregarLinea}
          />
        </div>
      )}

      {ingresos.creandoProveedorAbierto && ingresos.modoCreacionProveedor === 'sunat' && (
        <div className="min-h-0 flex-1 overflow-auto">
          <ConsultaSunatProveedor
            ruc={ingresos.rucConsultaProveedor}
            datosRuc={ingresos.datosRucProveedor}
            consultando={ingresos.consultandoSunatProveedor}
            error={ingresos.error}
            onRucChange={ingresos.onRucProveedorChange}
            onConsultar={ingresos.onConsultarRucProveedor}
            onGuardar={ingresos.onGuardarProveedorSunatYSeleccionar}
            onVolver={ingresos.onCerrarCreacionProveedor}
          />
        </div>
      )}

      {ingresos.creandoProveedorAbierto && ingresos.modoCreacionProveedor === 'manual' && (
        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
          <FormularioProveedor
            titulo="Registrar proveedor recibido"
            datosIniciales={{ razonSocial: ingresos.terminoProveedor }}
            cargando={ingresos.cargando}
            onGuardar={ingresos.onGuardarProveedorManualYSeleccionar}
            onCancelar={ingresos.onCerrarCreacionProveedor}
          />
        </div>
      )}

      {!ingresos.creandoProductoAbierto && !ingresos.creandoProveedorAbierto && (
        <footer className="shrink-0 flex items-center justify-between border-t border-[#E8F0E6] bg-white px-6 py-4">
          <span className="text-[12px] font-bold text-slate-600">
            {ingresos.lineas.length} líneas · {lineasConLote} con lote
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={ingresos.onCancelar}
              className="rounded-xl border border-[#f97316]/40 px-4 py-2 text-[12px] font-bold text-[#f97316] hover:bg-[#fff7ed]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void ingresos.onConfirmarIngreso()}
              disabled={!ingresos.ingresoValido || ingresos.cargando}
              className="rounded-xl bg-[#45b356] px-5 py-2 text-[12px] font-bold text-white hover:bg-[#3a9e4a] disabled:opacity-50"
            >
              Confirmar ingreso
            </button>
          </div>
        </footer>
      )}

      <BuscadorProductoIngreso
        abierto={ingresos.buscadorProductoAbierto}
        termino={ingresos.terminoProducto}
        resultados={ingresos.resultadosProducto}
        onTerminoChange={ingresos.onTerminoProductoChange}
        onSeleccionar={ingresos.onAgregarLinea}
        onCerrar={ingresos.onCerrarBuscadorProducto}
        onCrearNuevo={ingresos.onAbrirCreacionProducto}
      />
    </div>
  )
}
