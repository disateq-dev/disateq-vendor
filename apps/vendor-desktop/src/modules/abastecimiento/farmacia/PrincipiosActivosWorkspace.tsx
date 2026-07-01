import { FlaskConical, Search, X } from 'lucide-react'
import { useState, type ReactElement } from 'react'
import { usePOS } from '../../../context/POSContext'
import type { CondicionVentaIfa, CrearPrincipioActivoInput, ModificarPrincipioActivoInput, PrincipioActivo, PrincipioActivoDetalle } from '../../../domains/farmacia/types'
import { usePrincipiosActivos } from './hooks/usePrincipiosActivos'

const LABEL_CONDICION_IFA: Record<CondicionVentaIfa, string> = {
  OTC: 'Venta libre',
  OTC_RM: 'Libre / Con receta',
  RM: 'Con receta',
  RM_ESPECIAL: 'Controlado',
}

const COLOR_CONDICION_IFA: Record<CondicionVentaIfa, string> = {
  OTC: 'bg-green-100 text-green-700',
  OTC_RM: 'bg-yellow-100 text-yellow-700',
  RM: 'bg-orange-100 text-orange-700',
  RM_ESPECIAL: 'bg-red-100 text-red-600',
}

function BadgeCondicion({ condicion }: { condicion: CondicionVentaIfa }): ReactElement {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${COLOR_CONDICION_IFA[condicion]}`}>
      {LABEL_CONDICION_IFA[condicion]}
    </span>
  )
}

interface ItemListaProps {
  principio: PrincipioActivo
  seleccionado: boolean
  onSeleccionar: (p: PrincipioActivo) => void
}

function ItemLista({ principio, seleccionado, onSeleccionar }: ItemListaProps): ReactElement {
  return (
    <button
      type="button"
      onClick={() => onSeleccionar(principio)}
      className={`block w-full border-b border-[#E8F0E6] px-3 py-2 text-left transition last:border-0 ${seleccionado ? 'bg-[#E8F0E6]' : 'hover:bg-[#E8F0E6]'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-slate-800 truncate">{principio.nombreDci}</span>
        <BadgeCondicion condicion={principio.condicionVentaIfa} />
      </div>
      <div className="mt-0.5 flex items-center gap-2">
        <span className="text-[10px] text-slate-400 truncate">{principio.grupoTerapeutico}</span>
        {principio.esCombinacion && (
          <span className="shrink-0 rounded-full bg-[#E8F0E6] px-1.5 py-0.5 text-[9px] font-bold text-[#3B6B34]">COMBINACIÓN</span>
        )}
        {principio.esPsicotropico && (
          <span className="shrink-0 rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-500">CONTROLADO</span>
        )}
      </div>
    </button>
  )
}

interface PanelResumenProps {
  principio: PrincipioActivoDetalle
  onEditar: () => void
  onVolver: () => void
  cargando: boolean
}

function PanelResumen({ principio, onEditar, onVolver, cargando }: PanelResumenProps): ReactElement {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
        {cargando && <p className="text-[12px] font-semibold text-[#3B6B34]">Cargando...</p>}
        {!cargando && (
          <>
            <div className="flex flex-wrap gap-2">
              <BadgeCondicion condicion={principio.condicionVentaIfa} />
              {principio.esCombinacion && (
                <span className="rounded-full bg-[#E8F0E6] px-2 py-0.5 text-[10px] font-bold text-[#3B6B34]">COMBINACIÓN DE IFAs</span>
              )}
              {principio.esEsencialMinsa && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">ESENCIAL MINSA</span>
              )}
              {principio.esPsicotropico && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">CONTROLADO</span>
              )}
            </div>

            <div>
              <h2 className="text-[18px] font-bold text-slate-900 leading-tight">{principio.nombreDci}</h2>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{principio.grupoTerapeutico}</p>
            </div>

            <div className="rounded-xl border border-[#E8F0E6] bg-white px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">DESCRIPCIÓN DE USO</div>
              <p className="text-[12px] text-slate-700 leading-relaxed">{principio.descripcionUso || '-'}</p>
            </div>

            {principio.productosVinculados.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  MEDICAMENTOS QUE LO USAN ({principio.productosVinculados.length})
                </h3>
                <div className="space-y-1">
                  {principio.productosVinculados.map((producto) => (
                    <div key={producto.id} className="flex items-center justify-between rounded-xl border border-[#E8F0E6] bg-white px-3 py-2">
                      <span className="text-[12px] font-semibold text-slate-800">{producto.nombreComercial}</span>
                      {producto.codigoInterno && (
                        <span className="text-[10px] font-mono text-slate-400">{producto.codigoInterno}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {principio.productosVinculados.length === 0 && (
              <p className="text-[12px] text-slate-400">Sin medicamentos vinculados en el catálogo.</p>
            )}
          </>
        )}
      </div>
      <div className="shrink-0 flex justify-end gap-2 px-5 pb-4">
        <button
          type="button"
          onClick={onVolver}
          className="group relative rounded-xl border border-[#f97316]/40 px-4 py-2 text-[12px] font-bold text-[#f97316] hover:bg-[#fff7ed]"
        >
          VOLVER
          <kbd className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#fef08a] bg-[#fefce8] px-2 py-1 text-[11px] font-bold leading-none text-[#713f12] opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">Esc</kbd>
        </button>
        <button
          type="button"
          onClick={onEditar}
          className="rounded-xl border border-[#45b356]/40 px-4 py-2 text-[12px] font-bold text-[#45b356] hover:bg-[#F2F7F3]"
        >
          EDITAR
        </button>
      </div>
    </section>
  )
}

interface FormularioPrincipioProps {
  valorInicial?: PrincipioActivoDetalle
  cargando: boolean
  error: string | null
  operadorId: string
  onGuardar: (datos: CrearPrincipioActivoInput | ModificarPrincipioActivoInput) => Promise<void>
  onCancelar: () => void
}

function FormularioPrincipio({ valorInicial, cargando, error, operadorId, onGuardar, onCancelar }: FormularioPrincipioProps): ReactElement {
  const esEdicion = valorInicial !== undefined
  const [nombreDci, setNombreDci] = useState<string>(valorInicial?.nombreDci ?? '')
  const [descripcionUso, setDescripcionUso] = useState<string>(valorInicial?.descripcionUso ?? '')
  const [grupoTerapeutico, setGrupoTerapeutico] = useState<string>(valorInicial?.grupoTerapeutico ?? '')
  const [condicionVenta, setCondicionVenta] = useState<CondicionVentaIfa>(valorInicial?.condicionVentaIfa ?? 'OTC')
  const [esCombinacion, setEsCombinacion] = useState<boolean>(valorInicial?.esCombinacion ?? false)
  const [esPsicotropico, setEsPsicotropico] = useState<boolean>(valorInicial?.esPsicotropico ?? false)
  const [esEsencialMinsa, setEsEsencialMinsa] = useState<boolean>(valorInicial?.esEsencialMinsa ?? false)
  const [motivo, setMotivo] = useState<string>('')

  const puedeGuardar = nombreDci.trim().length > 0 && (!esEdicion || motivo.trim().length > 0)

  async function onSubmit(): Promise<void> {
    if (!puedeGuardar) return
    if (esEdicion && valorInicial !== undefined) {
      const datos: ModificarPrincipioActivoInput = {
        id: valorInicial.id,
        nombreDci: nombreDci.trim(),
        descripcionUso: descripcionUso.trim(),
        grupoTerapeutico: grupoTerapeutico.trim(),
        condicionVenta,
        esCombinacion,
        esPsicotropico,
        esEsencialMinsa,
        motivo: motivo.trim(),
        operadorId,
      }
      await onGuardar(datos)
    } else {
      const datos: CrearPrincipioActivoInput = {
        nombreDci: nombreDci.trim(),
        descripcionUso: descripcionUso.trim(),
        grupoTerapeutico: grupoTerapeutico.trim(),
        condicionVenta,
        esCombinacion,
        esPsicotropico,
        esEsencialMinsa,
      }
      await onGuardar(datos)
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
        {error !== null && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>
        )}

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">NOMBRE DCI *</span>
          <input
            value={nombreDci}
            onChange={(e) => setNombreDci(e.target.value)}
            placeholder="Ej: Paracetamol"
            className="mt-1 h-[36px] w-full rounded-xl border border-[#E8F0E6] bg-white px-3 text-[13px] font-semibold text-slate-800 outline-none focus:border-[#3B6B34] focus:ring-2 focus:ring-[#E8F0E6]"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">GRUPO TERAPÉUTICO</span>
          <input
            value={grupoTerapeutico}
            onChange={(e) => setGrupoTerapeutico(e.target.value)}
            placeholder="Ej: Analgésico / Antipirético"
            className="mt-1 h-[36px] w-full rounded-xl border border-[#E8F0E6] bg-white px-3 text-[13px] font-semibold text-slate-800 outline-none focus:border-[#3B6B34] focus:ring-2 focus:ring-[#E8F0E6]"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">CONDICIÓN DE VENTA</span>
          <select
            value={condicionVenta}
            onChange={(e) => setCondicionVenta(e.target.value as CondicionVentaIfa)}
            className="mt-1 h-[36px] w-full rounded-xl border border-[#E8F0E6] bg-white px-3 text-[13px] font-semibold text-slate-800 outline-none focus:border-[#3B6B34]"
          >
            <option value="OTC">Venta libre (OTC)</option>
            <option value="OTC_RM">Libre / Con receta (OTC+RM)</option>
            <option value="RM">Con receta médica (RM)</option>
            <option value="RM_ESPECIAL">Controlado (RM Especial)</option>
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">DESCRIPCIÓN DE USO</span>
          <textarea
            value={descripcionUso}
            onChange={(e) => setDescripcionUso(e.target.value)}
            rows={3}
            placeholder="Descripción en lenguaje operacional para el personal..."
            className="mt-1 w-full rounded-xl border border-[#E8F0E6] bg-white px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-[#3B6B34] focus:ring-2 focus:ring-[#E8F0E6] resize-none"
          />
        </label>

        <div className="flex flex-col gap-2 rounded-xl border border-[#E8F0E6] bg-white px-4 py-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">FLAGS REGULATORIOS</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={esCombinacion}
              onChange={(e) => setEsCombinacion(e.target.checked)}
              className="h-4 w-4 rounded border-[#E8F0E6] text-[#3B6B34]"
            />
            <span className="text-[12px] font-semibold text-slate-700">Es combinación de IFAs</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={esEsencialMinsa}
              onChange={(e) => setEsEsencialMinsa(e.target.checked)}
              className="h-4 w-4 rounded border-[#E8F0E6] text-[#3B6B34]"
            />
            <span className="text-[12px] font-semibold text-slate-700">Esencial MINSA (Ley 32033)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={esPsicotropico}
              onChange={(e) => setEsPsicotropico(e.target.checked)}
              className="h-4 w-4 rounded border-[#E8F0E6] text-[#3B6B34]"
            />
            <span className="text-[12px] font-semibold text-slate-700">Medicamento controlado (psicotrópico / estupefaciente)</span>
          </label>
        </div>

        {esEdicion && (
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">MOTIVO DE CORRECCIÓN *</span>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describe el motivo del cambio..."
              className="mt-1 h-[36px] w-full rounded-xl border border-[#E8F0E6] bg-white px-3 text-[13px] font-semibold text-slate-800 outline-none focus:border-[#3B6B34] focus:ring-2 focus:ring-[#E8F0E6]"
            />
          </label>
        )}
      </div>
      <div className="shrink-0 flex justify-end gap-2 px-5 pb-4">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-xl border border-[#f97316]/40 px-4 py-2 text-[12px] font-bold text-[#f97316] hover:bg-[#fff7ed]"
        >
          CANCELAR
        </button>
        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={cargando || !puedeGuardar}
          className="rounded-xl bg-[#45b356] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#3a9e4a] disabled:opacity-50"
        >
          {esEdicion ? 'GUARDAR CAMBIOS' : 'REGISTRAR'}
        </button>
      </div>
    </section>
  )
}

export function PrincipiosActivosWorkspace(): ReactElement {
  const { activeOperator } = usePOS()
  const operadorId = activeOperator?.id ?? ''
  const estado = usePrincipiosActivos()

  const topbarLabel = (): string => {
    if (estado.modo === 'nuevo') return 'NUEVO PRINCIPIO ACTIVO'
    if (estado.modo === 'editar') return 'EDITAR PRINCIPIO ACTIVO'
    if (estado.modo === 'resumen' && estado.principioSeleccionado !== null) return 'PRINCIPIO ACTIVO'
    return 'PRINCIPIOS ACTIVOS IFA'
  }

  return (
    <section className="flex min-h-0 flex-1 gap-2">
      {/* Panel izquierdo — buscador */}
      <div className="flex flex-[40] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#3B6B34]/50 bg-[#FDFCF9]">
        <div className="shrink-0 flex h-[42px] items-center justify-between gap-2 px-4 border-b bg-[#E8F0E6]/60 border-[#3B6B34]/15">
          <div className="flex items-center gap-2">
            <FlaskConical size={13} strokeWidth={2} className="shrink-0 text-[#3B6B34]" />
            <span className="text-[13px] font-semibold uppercase tracking-tight leading-none text-[#121416]">
              PRINCIPIOS ACTIVOS
            </span>
          </div>
          {estado.error !== null && (
            <button
              type="button"
              onClick={estado.onLimpiarError}
              className="flex min-w-0 items-center gap-2 rounded-full bg-[#E8F0E6] px-3 py-1 text-[11px] font-bold text-[#3B6B34]"
            >
              <span className="truncate">{estado.error}</span>
              <X className="h-3.5 w-3.5 shrink-0" />
            </button>
          )}
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#3B6B34]" />
              <input
                value={estado.termino}
                onChange={(e) => estado.onTerminoChange(e.target.value)}
                placeholder="Nombre DCI o grupo terapéutico..."
                className="h-[38px] w-full rounded-xl border border-[#E8F0E6] bg-white pl-9 pr-8 text-[13px] font-semibold text-slate-800 outline-none transition focus:border-[#3B6B34] focus:ring-2 focus:ring-[#E8F0E6] placeholder:text-[#b8c4cf]"
              />
              {estado.termino.length > 0 && (
                <button
                  type="button"
                  onClick={estado.onLimpiar}
                  className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            {estado.cargando && (
              <p className="mt-2 text-[11px] font-semibold text-[#3B6B34]">Buscando...</p>
            )}
          </div>

          <div className="flex-1 overflow-auto mt-2">
            {!estado.cargando && estado.resultados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10">
                <FlaskConical size={24} className="text-[#3B6B34]/30" />
                <p className="mt-2 text-center text-[11px] text-slate-400">Sin resultados</p>
              </div>
            )}
            {estado.resultados.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-[#E8F0E6] bg-white mx-3">
                {estado.resultados.map((principio) => (
                  <ItemLista
                    key={principio.id}
                    principio={principio}
                    seleccionado={estado.principioSeleccionado?.id === principio.id}
                    onSeleccionar={(p) => void estado.onSeleccionar(p)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 px-3 pb-4 pt-2 flex gap-2">
            <button
              type="button"
              onClick={estado.onLimpiar}
              disabled={estado.termino.length === 0 && estado.principioSeleccionado === null}
              className="group relative flex-[1] rounded-xl border border-[#f97316]/40 px-2 py-2 text-[12px] font-bold text-[#f97316] hover:bg-[#fff7ed] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              × LIMPIAR
            </button>
            <button
              type="button"
              onClick={estado.onIrNuevo}
              className="group relative flex-[2] rounded-xl border border-[#45b356]/40 px-3 py-2 text-[12px] font-bold text-[#45b356] hover:bg-[#F2F7F3] flex items-center justify-center"
            >
              + NUEVO IFA
            </button>
          </div>
        </div>
      </div>

      {/* Panel derecho — sheetworks */}
      <div className="flex flex-[60] min-h-0 flex-col overflow-hidden rounded-[28px] border border-[#3B6B34]/30 bg-[#FDFCF9]">
        <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 border-b bg-[#E8F0E6]/60 border-[#3B6B34]/15">
          <FlaskConical size={13} strokeWidth={2} className="shrink-0 text-[#3B6B34]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight leading-none text-[#121416]">
            {topbarLabel()}
          </span>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {/* Modo resumen */}
          {estado.modo === 'resumen' && estado.principioSeleccionado !== null && (
            <PanelResumen
              principio={estado.principioSeleccionado}
              onEditar={estado.onIrEditar}
              onVolver={estado.onVolverBusqueda}
              cargando={estado.cargando}
            />
          )}

          {/* Modo editar */}
          {estado.modo === 'editar' && estado.principioSeleccionado !== null && (
            <FormularioPrincipio
              valorInicial={estado.principioSeleccionado}
              cargando={estado.cargando}
              error={estado.error}
              operadorId={operadorId}
              onGuardar={(datos) => void estado.onGuardarEdicion(datos as ModificarPrincipioActivoInput)}
              onCancelar={() => { estado.onVolverBusqueda(); void estado.onRecargarDetalle() }}
            />
          )}

          {/* Modo nuevo */}
          {estado.modo === 'nuevo' && (
            <FormularioPrincipio
              cargando={estado.cargando}
              error={estado.error}
              operadorId={operadorId}
              onGuardar={(datos) => void estado.onGuardarNuevo(datos as CrearPrincipioActivoInput)}
              onCancelar={estado.onVolverBusqueda}
            />
          )}

          {/* Estado vacío */}
          {estado.modo === 'busqueda' && (
            <div className="flex flex-col items-center justify-center pb-14 pt-[106px]">
              <FlaskConical size={32} className="text-[#3B6B34]/30" />
              <p className="mt-3 text-center text-[12px] text-slate-400">
                Selecciona un principio activo para ver su detalle
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
