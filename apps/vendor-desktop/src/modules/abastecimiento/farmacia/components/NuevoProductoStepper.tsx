import { Check, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState, type ReactElement } from 'react'
import { obtenerUbicacionesFisicasSugeridas } from '../../../../domains/catalog/hov.service'
import {
  buscarEnCatalogoMaestro,
  obtenerDetalleCatalogoMaestro,
  type DetalleCatalogoMaestro,
  type SugerenciaCatalogoMaestro,
} from '../../../../domains/farmacia/catalogo-maestro.service'
import { mapearFormaFarmaceutica } from '../../../../domains/farmacia/mapeo-forma-digemid.utils'
import {
  LABEL_CATEGORIA_FARMACIA,
  LABEL_CATEGORIA_GENERAL,
  LABEL_CONDICION_VENTA,
  LABEL_FORMA_FARMACEUTICA,
  LABEL_TIPO_SERVICIO,
} from '../../../../domains/catalog/etiquetas-ui'
import { obtenerProductosComerciales } from '../../../../domains/farmacia/farmacia.service'
import { construirDescripcionDigemid } from '../../../../domains/farmacia/descripcion-digemid.utils'
import type {
  CategoriaFarmacia,
  CategoriaGeneral,
  CondicionVenta,
  CrearNodoInput,
  CrearPresentacionInput,
  CrearProductoComercialInput,
  CrearProductoGenericoInput,
  FormaFarmaceutica,
  ProductoComercial,
  TipoFormaVenta,
  TipoRecursoOperacional,
  TipoServicioFarmacia,
} from '../../../../domains/farmacia/types'

interface NuevoProductoStepperProps {
  paso: number
  terminoBusqueda: string
  cargando: boolean
  error: string | null
  onPasoSiguiente: () => void
  onPasoAnterior: () => void
  onCancelar: () => void
  onGuardar: (
    tipoRecurso: TipoRecursoOperacional,
    generico: CrearProductoGenericoInput,
    comercial: Omit<CrearProductoComercialInput, 'productoGenericoId'>,
    presentacion: CrearPresentacionInput,
    nodosExtra: CrearNodoInput[],
    ubicacionFisica?: string,
  ) => Promise<void>
}

interface PasoMedicamentoVentaProps {
  generico: CrearProductoGenericoInput
  comercial: Omit<CrearProductoComercialInput, 'productoGenericoId'>
  setGenerico: (generico: CrearProductoGenericoInput) => void
  setComercial: (comercial: Omit<CrearProductoComercialInput, 'productoGenericoId'>) => void
}

interface PasoComercialProps {
  comercial: Omit<CrearProductoComercialInput, 'productoGenericoId'>
  similares: ProductoComercial[]
  buscandoSimilares: boolean
  sugerenciasDigemid: SugerenciaCatalogoMaestro[]
  buscandoDigemid: boolean
  sugerenciaDigemidElegida: DetalleCatalogoMaestro | null
  setComercial: (comercial: Omit<CrearProductoComercialInput, 'productoGenericoId'>) => void
  onElegirSugerenciaDigemid: (codProd: number) => void
  onQuitarSugerenciaDigemid: () => void
}

interface PasoRegulatorioProps {
  comercial: Omit<CrearProductoComercialInput, 'productoGenericoId'>
  estadoRegistroSanitario: 'VIGENTE' | 'SUSPENDIDO' | 'CANCELADO' | 'VENCIDO'
  setComercial: (comercial: Omit<CrearProductoComercialInput, 'productoGenericoId'>) => void
  setEstadoRegistroSanitario: (estado: 'VIGENTE' | 'SUSPENDIDO' | 'CANCELADO' | 'VENCIDO') => void
}

interface PresentacionForm {
  descripcion: string
  fraccionDIGEMID: number
  factorConversionBase: number
  unidadConteo: string
  codigoBarras?: string
  costoCompra?: number
}

interface PasoPresentacionProps {
  presentacion: PresentacionForm
  setPresentacion: (presentacion: PresentacionForm) => void
}

interface NodoExtraForm {
  idTemporal: string
  nombreFormaVenta: string
  tipoFormaVenta: Exclude<TipoFormaVenta, 'PRESENTACION_ORIGINAL'>
  unidadesEnNodoPadre: number
  nodoPadreLocalId: string | null
}

interface PasoFormasVentaProps {
  descripcionRaiz: string
  nodosExtra: NodoExtraForm[]
  ubicacionFisica: string
  setUbicacionFisica: (valor: string) => void
  sugerenciasUbicacion: string[]
  setNodosExtra: (nodos: NodoExtraForm[]) => void
}

interface ProductoGeneralForm {
  nombre: string
  categoriaGeneral: CategoriaGeneral
  unidadVenta: string
  codigoBarras?: string
  descripcionPresentacion: string
  factorConversionBase: number
  costoCompra?: number
}

interface ServicioForm {
  nombre: string
  tipoServicio: TipoServicioFarmacia
  descripcion?: string
  duracionMinutos?: number
}

interface StepperHeaderProps {
  paso: number
  totalPasos: number
}

const FORMAS_FARMACEUTICAS: FormaFarmaceutica[] = [
  'TABLETA',
  'TABLETA_RECUBIERTA',
  'TABLETA_MASTICABLE',
  'TABLETA_LIB_PROLONGADA',
  'CAPSULA',
  'CAPSULA_BLANDA',
  'COMPRIMIDO',
  'COMPRIMIDO_RECUBIERTO',
  'COMPRIMIDO_MASTICABLE',
  'SOLUCION_ORAL',
  'SOLUCION_INYECTABLE',
  'SOLUCION_OFTALMICA',
  'SOLUCION_TOPICA',
  'SUSPENSION_ORAL',
  'SUSPENSION_INYECTABLE',
  'JARABE',
  'POLVO_SUSPENSION_ORAL',
  'POLVO_SOLUCION_INYECTABLE',
  'CREMA',
  'POMADA',
  'UNGUENTO',
  'GEL',
  'OVULO',
  'SUPOSITORIO',
  'AMPOLLA',
  'VIAL',
  'FRASCO_GOTERO',
  'SPRAY',
  'INHALADOR',
  'PARCHE',
  'OTRO',
]

const CATEGORIAS_FARMACIA: CategoriaFarmacia[] = [
  'ANALGESICO',
  'ANTIBIOTICO',
  'ANTIHISTAMINICO',
  'ANTIINFLAMATORIO',
  'ANTIACIDO',
  'VITAMINA',
  'TOPICO',
  'OFTALMICO',
  'INYECTABLE',
  'DISPOSITIVO',
  'CUIDADO_PERSONAL',
  'BEBE',
  'OTRO',
]

const CONDICIONES_VENTA: CondicionVenta[] = ['SIN_RECETA', 'CON_RECETA', 'CONTROLADO']
const TIPOS_NODO_EXTRA: Exclude<TipoFormaVenta, 'PRESENTACION_ORIGINAL'>[] = ['FRACCION', 'PACK', 'PROMOCION', 'INTERMEDIA']
const CATEGORIAS_GENERALES: CategoriaGeneral[] = ['CUIDADO_PERSONAL', 'BEBE', 'DISPOSITIVO_MEDICO', 'SUPLEMENTO', 'HIGIENE', 'OTRO']
const TIPOS_SERVICIO: TipoServicioFarmacia[] = ['INYECTABLE', 'NEBULIZACION', 'CONTROL_GLUCOSA', 'CONTROL_PRESION', 'TEST_EMBARAZO', 'CURACION', 'OTRO']

function etiqueta(valor: string, mapa: Record<string, string>): string {
  return mapa[valor] ?? valor.replaceAll('_', ' ')
}

function StepperHeader({ paso, totalPasos }: StepperHeaderProps): ReactElement {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${totalPasos}, minmax(0, 1fr))` }}>
      {Array.from({ length: totalPasos }, (_, indice) => indice + 1).map((numero) => (
        <div key={numero} className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold ${
              numero <= paso ? 'bg-[#1E88C7] text-white' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {numero < paso ? <Check className="h-4 w-4" /> : numero}
          </span>
          {numero < totalPasos && <span className={`h-1 flex-1 rounded-full ${numero < paso ? 'bg-[#1E88C7]' : 'bg-slate-100'}`} />}
        </div>
      ))}
    </div>
  )
}

function PasoMedicamentoVenta({ generico, comercial, setGenerico, setComercial }: PasoMedicamentoVentaProps): ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-500">¿Necesita receta?</span>
        <select className="h-11 w-full rounded-xl border border-[var(--dv-input-border)] px-3" value={comercial.condicionVenta} onChange={(e) => setComercial({ ...comercial, condicionVenta: e.target.value as CondicionVenta })}>
          {CONDICIONES_VENTA.map((condicion) => <option key={condicion} value={condicion}>{etiqueta(condicion, LABEL_CONDICION_VENTA)}</option>)}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-500">Principio activo</span>
        <input className="h-11 w-full rounded-xl border border-[var(--dv-input-border)] px-3" value={generico.ifa} onChange={(e) => setGenerico({ ...generico, ifa: e.target.value })} />
      </label>
      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-500">Dosis</span>
        <input className="h-11 w-full rounded-xl border border-[var(--dv-input-border)] px-3" value={generico.concentracion} onChange={(e) => setGenerico({ ...generico, concentracion: e.target.value })} />
      </label>
      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-500">Presentación</span>
        <select className="h-11 w-full rounded-xl border border-[var(--dv-input-border)] px-3" value={generico.formaFarmaceutica} onChange={(e) => setGenerico({ ...generico, formaFarmaceutica: e.target.value as FormaFarmaceutica })}>
          {FORMAS_FARMACEUTICAS.map((forma) => <option key={forma} value={forma}>{etiqueta(forma, LABEL_FORMA_FARMACEUTICA)}</option>)}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-500">Categoría</span>
        <select className="h-11 w-full rounded-xl border border-[var(--dv-input-border)] px-3" value={generico.categoriaFarmacia} onChange={(e) => setGenerico({ ...generico, categoriaFarmacia: e.target.value as CategoriaFarmacia })}>
          {CATEGORIAS_FARMACIA.map((categoria) => <option key={categoria} value={categoria}>{etiqueta(categoria, LABEL_CATEGORIA_FARMACIA)}</option>)}
        </select>
      </label>
      <div className="flex flex-col gap-3 pt-5">
        <label className="flex items-center gap-2 text-[13px] font-semibold"><input type="checkbox" checked={comercial.requiereCadenaFrio} onChange={(e) => setComercial({ ...comercial, requiereCadenaFrio: e.target.checked })} />Refrigerar</label>
        <label className="flex items-center gap-2 text-[13px] font-semibold"><input type="checkbox" checked={comercial.requiereLote} onChange={(e) => setComercial({ ...comercial, requiereLote: e.target.checked })} />Con vencimiento</label>
        <label className="flex items-center gap-2 text-[13px] font-semibold"><input type="checkbox" checked={generico.permiteFraccion} onChange={(e) => setGenerico({ ...generico, permiteFraccion: e.target.checked })} />Permite fraccionar</label>
      </div>
    </div>
  )
}

function PasoComercial({
  comercial,
  similares,
  buscandoSimilares,
  sugerenciasDigemid,
  buscandoDigemid,
  sugerenciaDigemidElegida,
  setComercial,
  onElegirSugerenciaDigemid,
  onQuitarSugerenciaDigemid,
}: PasoComercialProps): ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input className="h-11 flex-1 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Nombre comercial" value={comercial.nombreComercial} onChange={(e) => setComercial({ ...comercial, nombreComercial: e.target.value })} />
          {sugerenciaDigemidElegida !== null ? (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-bold text-[#1E88C7]">
                ✓ Prellenado desde DIGEMID
                {sugerenciaDigemidElegida.situacion !== null ? ` · Situación DIGEMID: ${sugerenciaDigemidElegida.situacion}` : ''}
              </span>
              <button type="button" onClick={onQuitarSugerenciaDigemid} className="font-bold text-[#1E88C7]">
                Quitar sugerencia
              </button>
            </div>
          ) : null}
        </div>
        {sugerenciasDigemid.length > 0 && sugerenciaDigemidElegida === null ? (
          <div className="rounded-xl border border-[#E3F1FA] bg-white px-4 py-3">
            <p className="text-[11px] font-bold text-[#1E88C7]">Coincidencias en catálogo DIGEMID</p>
            <div className="mt-2 grid gap-2">
              {sugerenciasDigemid.map((sugerencia) => (
                <button
                  key={sugerencia.codProd}
                  type="button"
                  onClick={() => onElegirSugerenciaDigemid(sugerencia.codProd)}
                  className="rounded-lg border border-[#E3F1FA] bg-white px-3 py-2 text-left"
                >
                  <div className="text-[12px] font-bold text-slate-800">{sugerencia.nombre ?? 'Sin nombre comercial'}</div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {[sugerencia.laboratorio, sugerencia.forma, sugerencia.presentacion].filter(Boolean).join(' · ') || 'Sin datos complementarios'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : buscandoDigemid && sugerenciaDigemidElegida === null ? (
          <p className="text-[11px] text-slate-400">Buscando en catálogo DIGEMID...</p>
        ) : null}
      </div>
      {similares.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col gap-2">
          <p className="text-[11px] font-bold text-amber-700">
            ⚠ Ya existe algo similar en el catálogo:
          </p>
          {similares.map((similar) => (
            <div key={similar.id} className="rounded-lg bg-white border border-amber-100 px-3 py-2">
              <div className="text-[12px] font-bold text-slate-800">
                {similar.nombreComercial} · {similar.concentracion} · {similar.formaFarmaceutica}
              </div>
              <div className="text-[11px] text-slate-500">
                {similar.nombreFabricante}
              </div>
            </div>
          ))}
          <p className="text-[10px] text-amber-600">
            ¿Es el mismo producto? Cancela y búscalo en el catálogo. ¿Es diferente? Continúa con el registro.
          </p>
        </div>
      ) : buscandoSimilares ? (
        <p className="text-[11px] text-slate-400">Buscando similares...</p>
      ) : null}
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Fabricante" value={comercial.nombreFabricante} onChange={(e) => setComercial({ ...comercial, nombreFabricante: e.target.value })} />
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Titular (opcional)" value={comercial.nombreTitular ?? ''} onChange={(e) => setComercial({ ...comercial, nombreTitular: e.target.value || undefined })} />
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="País de origen (opcional)" value={comercial.paisOrigen ?? ''} onChange={(e) => setComercial({ ...comercial, paisOrigen: e.target.value || undefined })} />
    </div>
  )
}

function PasoRegulatorio({ comercial, estadoRegistroSanitario, setComercial, setEstadoRegistroSanitario }: PasoRegulatorioProps): ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Número de registro sanitario (opcional)" value={comercial.registroSanitario ?? ''} onChange={(e) => setComercial({ ...comercial, registroSanitario: e.target.value || undefined })} />
      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-500">Estado del registro</span>
        <select className="h-11 w-full rounded-xl border border-[var(--dv-input-border)] px-3" value={estadoRegistroSanitario} onChange={(e) => setEstadoRegistroSanitario(e.target.value as 'VIGENTE' | 'SUSPENDIDO' | 'CANCELADO' | 'VENCIDO')}>
          <option value="VIGENTE">Vigente</option>
          <option value="SUSPENDIDO">Suspendido</option>
          <option value="CANCELADO">Cancelado</option>
          <option value="VENCIDO">Vencido</option>
        </select>
      </label>
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Código DIGEMID (opcional)" value={comercial.codigoDIGEMID ?? ''} onChange={(e) => setComercial({ ...comercial, codigoDIGEMID: e.target.value || undefined })} />
    </div>
  )
}

function PasoPresentacion({ presentacion, setPresentacion }: PasoPresentacionProps): ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Descripción" value={presentacion.descripcion} onChange={(e) => setPresentacion({ ...presentacion, descripcion: e.target.value })} />
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Unidad de conteo" value={presentacion.unidadConteo} onChange={(e) => setPresentacion({ ...presentacion, unidadConteo: e.target.value })} />
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" type="number" min="1" placeholder="Fracción DIGEMID (uso regulatorio)" value={presentacion.fraccionDIGEMID} onChange={(e) => setPresentacion({ ...presentacion, fraccionDIGEMID: Number(e.target.value) })} />
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" type="number" min="1" placeholder="Unidades totales en esta presentación" value={presentacion.factorConversionBase} onChange={(e) => setPresentacion({ ...presentacion, factorConversionBase: Number(e.target.value) })} />
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Código de barras" value={presentacion.codigoBarras ?? ''} onChange={(e) => setPresentacion({ ...presentacion, codigoBarras: e.target.value || undefined })} />
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" type="number" min="0" placeholder="Costo de compra" value={presentacion.costoCompra ?? ''} onChange={(e) => setPresentacion({ ...presentacion, costoCompra: e.target.value ? Number(e.target.value) : undefined })} />
    </div>
  )
}

function PasoFormasVenta({
  descripcionRaiz,
  nodosExtra,
  ubicacionFisica,
  setUbicacionFisica,
  sugerenciasUbicacion,
  setNodosExtra,
}: PasoFormasVentaProps): ReactElement {
  const agregarNodo = (): void => {
    setNodosExtra([...nodosExtra, { idTemporal: crypto.randomUUID(), nombreFormaVenta: '', tipoFormaVenta: 'FRACCION', unidadesEnNodoPadre: 1, nodoPadreLocalId: null }])
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#E3F1FA] bg-[#E3F1FA] p-4">
        <div className="text-[12px] font-bold text-slate-800">{descripcionRaiz || 'Presentación original'}</div>
        <div className="mt-1 text-[11px] font-semibold text-[#1E88C7]">Nodo raíz · vendible · comprable</div>
      </div>
      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-500">Ubicación (opcional)</span>
        <input
          className="h-11 w-full rounded-xl border border-[var(--dv-input-border)] px-3"
          list="sugerencias-ubicacion-fisica-stepper"
          placeholder="Ej. Anaquel 3, Vitrina refrigerada..."
          value={ubicacionFisica}
          onChange={(e) => setUbicacionFisica(e.target.value)}
        />
        <datalist id="sugerencias-ubicacion-fisica-stepper">
          {sugerenciasUbicacion.map((ubicacion) => <option key={ubicacion} value={ubicacion} />)}
        </datalist>
      </label>
      {nodosExtra.map((nodo, indice) => {
        const nodosPadreDisponibles = nodosExtra.slice(0, indice)

        return (
          <div key={nodo.idTemporal} className="grid gap-3 rounded-2xl border border-[#E3F1FA] bg-white p-4 md:grid-cols-[1fr_160px_140px_190px_40px]">
            <input className="h-10 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Nombre forma venta" value={nodo.nombreFormaVenta} onChange={(e) => setNodosExtra(nodosExtra.map((item) => item.idTemporal === nodo.idTemporal ? { ...item, nombreFormaVenta: e.target.value } : item))} />
            <select className="h-10 rounded-xl border border-[var(--dv-input-border)] px-3" value={nodo.tipoFormaVenta} onChange={(e) => setNodosExtra(nodosExtra.map((item) => item.idTemporal === nodo.idTemporal ? { ...item, tipoFormaVenta: e.target.value as Exclude<TipoFormaVenta, 'PRESENTACION_ORIGINAL'> } : item))}>
              {TIPOS_NODO_EXTRA.map((tipo) => <option key={tipo} value={tipo}>{tipo.replaceAll('_', ' ')}</option>)}
            </select>
            <input className="h-10 rounded-xl border border-[var(--dv-input-border)] px-3" type="number" min="1" value={nodo.unidadesEnNodoPadre} onChange={(e) => setNodosExtra(nodosExtra.map((item) => item.idTemporal === nodo.idTemporal ? { ...item, unidadesEnNodoPadre: Number(e.target.value) } : item))} />
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">Depende de</span>
              <select className="h-10 w-full rounded-xl border border-[var(--dv-input-border)] px-3" value={nodo.nodoPadreLocalId ?? ''} onChange={(e) => setNodosExtra(nodosExtra.map((item) => item.idTemporal === nodo.idTemporal ? { ...item, nodoPadreLocalId: e.target.value || null } : item))}>
                <option value="">Presentación original (raíz)</option>
                {nodosPadreDisponibles.map((nodoPadre) => (
                  <option key={nodoPadre.idTemporal} value={nodoPadre.idTemporal}>
                    {nodoPadre.nombreFormaVenta.trim() || 'Forma de venta previa'}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => setNodosExtra(nodosExtra.filter((item) => item.idTemporal !== nodo.idTemporal))} className="flex h-10 items-center justify-center rounded-xl text-[#1E88C7]">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      })}
      <button type="button" onClick={agregarNodo} className="flex items-center gap-2 rounded-xl bg-[#E3F1FA] px-4 py-2 text-[12px] font-bold text-[#1E88C7]">
        <Plus className="h-4 w-4" /> Agregar forma de venta
      </button>
    </div>
  )
}

function PasoProductoGeneralUno({ formulario, setFormulario }: { formulario: ProductoGeneralForm; setFormulario: (formulario: ProductoGeneralForm) => void }): ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Nombre" value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} />
      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-500">Categoría</span>
        <select className="h-11 w-full rounded-xl border border-[var(--dv-input-border)] px-3" value={formulario.categoriaGeneral} onChange={(e) => setFormulario({ ...formulario, categoriaGeneral: e.target.value as CategoriaGeneral })}>
          {CATEGORIAS_GENERALES.map((categoria) => <option key={categoria} value={categoria}>{etiqueta(categoria, LABEL_CATEGORIA_GENERAL)}</option>)}
        </select>
      </label>
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Unidad de venta" value={formulario.unidadVenta} onChange={(e) => setFormulario({ ...formulario, unidadVenta: e.target.value })} />
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Código de barras (opcional)" value={formulario.codigoBarras ?? ''} onChange={(e) => setFormulario({ ...formulario, codigoBarras: e.target.value || undefined })} />
    </div>
  )
}

function PasoProductoGeneralDos({ formulario, setFormulario }: { formulario: ProductoGeneralForm; setFormulario: (formulario: ProductoGeneralForm) => void }): ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Descripción de presentación" value={formulario.descripcionPresentacion} onChange={(e) => setFormulario({ ...formulario, descripcionPresentacion: e.target.value })} />
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" type="number" min="1" placeholder="Unidades totales en este paquete" value={formulario.factorConversionBase} onChange={(e) => setFormulario({ ...formulario, factorConversionBase: Number(e.target.value) })} />
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" type="number" min="0" placeholder="Costo de compra (opcional)" value={formulario.costoCompra ?? ''} onChange={(e) => setFormulario({ ...formulario, costoCompra: e.target.value ? Number(e.target.value) : undefined })} />
    </div>
  )
}

function PasoServicio({ formulario, setFormulario }: { formulario: ServicioForm; setFormulario: (formulario: ServicioForm) => void }): ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Nombre del servicio" value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} />
      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-500">Tipo de servicio</span>
        <select className="h-11 w-full rounded-xl border border-[var(--dv-input-border)] px-3" value={formulario.tipoServicio} onChange={(e) => setFormulario({ ...formulario, tipoServicio: e.target.value as TipoServicioFarmacia })}>
          {TIPOS_SERVICIO.map((tipo) => <option key={tipo} value={tipo}>{etiqueta(tipo, LABEL_TIPO_SERVICIO)}</option>)}
        </select>
      </label>
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" placeholder="Descripción (opcional)" value={formulario.descripcion ?? ''} onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value || undefined })} />
      <input className="h-11 rounded-xl border border-[var(--dv-input-border)] px-3" type="number" min="0" placeholder="Duración estimada en minutos (opcional)" value={formulario.duracionMinutos ?? ''} onChange={(e) => setFormulario({ ...formulario, duracionMinutos: e.target.value ? Number(e.target.value) : undefined })} />
    </div>
  )
}

export function NuevoProductoStepper({
  paso,
  terminoBusqueda,
  cargando,
  error,
  onPasoSiguiente,
  onPasoAnterior,
  onCancelar,
  onGuardar,
}: NuevoProductoStepperProps): ReactElement {
  const [tipoRecurso, setTipoRecurso] = useState<TipoRecursoOperacional | null>(null)
  const [similares, setSimilares] = useState<ProductoComercial[]>([])
  const [buscandoSimilares, setBuscandoSimilares] = useState<boolean>(false)
  const [sugerenciasDigemid, setSugerenciasDigemid] = useState<SugerenciaCatalogoMaestro[]>([])
  const [buscandoDigemid, setBuscandoDigemid] = useState<boolean>(false)
  const [sugerenciaDigemidElegida, setSugerenciaDigemidElegida] = useState<DetalleCatalogoMaestro | null>(null)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const [generico, setGenerico] = useState<CrearProductoGenericoInput>({
    ifa: '',
    concentracion: '',
    formaFarmaceutica: 'TABLETA',
    categoriaFarmacia: 'OTRO',
    permiteFraccion: true,
  })
  const [comercial, setComercial] = useState<Omit<CrearProductoComercialInput, 'productoGenericoId'>>({
    nombreComercial: terminoBusqueda,
    nombreFabricante: '',
    paisOrigen: 'PE',
    condicionVenta: 'SIN_RECETA',
    tipoRecurso: 'MEDICAMENTO',
    requiereLote: false,
    requiereCadenaFrio: false,
  })
  const [estadoRegistroSanitario, setEstadoRegistroSanitario] = useState<'VIGENTE' | 'SUSPENDIDO' | 'CANCELADO' | 'VENCIDO'>('VIGENTE')
  const [presentacion, setPresentacion] = useState<PresentacionForm>({
    descripcion: '',
    fraccionDIGEMID: 1,
    factorConversionBase: 1,
    unidadConteo: '',
  })
  const [nodosExtra, setNodosExtra] = useState<NodoExtraForm[]>([])
  const [ubicacionFisica, setUbicacionFisica] = useState<string>('')
  const [productoGeneral, setProductoGeneral] = useState<ProductoGeneralForm>({
    nombre: terminoBusqueda,
    categoriaGeneral: 'OTRO',
    unidadVenta: '',
    descripcionPresentacion: '',
    factorConversionBase: 1,
  })
  const [servicio, setServicio] = useState<ServicioForm>({
    nombre: terminoBusqueda,
    tipoServicio: 'INYECTABLE',
  })

  useEffect(() => {
    if (tipoRecurso !== 'MEDICAMENTO' || comercial.nombreComercial.trim().length < 4) {
      setSimilares([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setBuscandoSimilares(true)
      try {
        const resultados = await obtenerProductosComerciales(comercial.nombreComercial.trim(), false)
        setSimilares(resultados.slice(0, 3))
      } finally {
        setBuscandoSimilares(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [comercial.nombreComercial, tipoRecurso])

  useEffect(() => {
    const termino = comercial.nombreComercial.trim()
    if (tipoRecurso !== 'MEDICAMENTO' || termino.length < 3 || sugerenciaDigemidElegida !== null) {
      setSugerenciasDigemid([])
      setBuscandoDigemid(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setBuscandoDigemid(true)
      try {
        const resultados = await buscarEnCatalogoMaestro(termino)
        setSugerenciasDigemid(resultados)
      } catch {
        setSugerenciasDigemid([])
      } finally {
        setBuscandoDigemid(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [comercial.nombreComercial, tipoRecurso, sugerenciaDigemidElegida])

  useEffect(() => {
    if (tipoRecurso === 'MEDICAMENTO' && paso === 4 && presentacion.descripcion.trim() === '') {
      setPresentacion({
        ...presentacion,
        descripcion: construirDescripcionDigemid(
          generico.ifa,
          generico.concentracion,
          generico.formaFarmaceutica,
          '',
        ),
      })
    }
  }, [tipoRecurso, paso, generico.ifa, generico.concentracion, generico.formaFarmaceutica])

  const totalPasos = tipoRecurso === 'MEDICAMENTO' ? 4 : tipoRecurso === 'PRODUCTO_GENERAL' ? 3 : 1

  const cancelar = (): void => {
    setSimilares([])
    setSugerenciasDigemid([])
    setSugerenciaDigemidElegida(null)
    onCancelar()
  }

  const elegirSugerenciaDigemid = async (codProd: number): Promise<void> => {
    try {
      const detalle = await obtenerDetalleCatalogoMaestro(codProd)
      if (detalle === null) return

      setComercial((actual) => ({
        ...actual,
        nombreFabricante: detalle.laboratorio ?? actual.nombreFabricante,
        nombreTitular: detalle.titular ?? actual.nombreTitular,
        registroSanitario: detalle.numRegsan ?? actual.registroSanitario,
        codigoDIGEMID: String(detalle.codProd),
      }))
      setGenerico((actual) => {
        const principiosActivos = detalle.principiosActivos
        const formaFarmaceutica = mapearFormaFarmaceutica(detalle.forma)

        if (principiosActivos.length === 1) {
          const principioActivo = principiosActivos[0]
          return {
            ...actual,
            ifa: principioActivo.nombreDci,
            concentracion: principioActivo.concentracion ?? detalle.concentracionRaw ?? actual.concentracion,
            formaFarmaceutica,
          }
        }

        if (principiosActivos.length > 1) {
          const concentraciones = principiosActivos
            .map((principioActivo) => principioActivo.concentracion?.trim() ?? '')
            .filter((concentracion) => concentracion !== '')

          return {
            ...actual,
            ifa: principiosActivos.map((principioActivo) => principioActivo.nombreDci).join(' + '),
            concentracion: detalle.concentracionRaw ?? concentraciones.join(' / '),
            formaFarmaceutica,
          }
        }

        return {
          ...actual,
          formaFarmaceutica,
        }
      })
      setSugerenciaDigemidElegida(detalle)
      setSugerenciasDigemid([])
    } catch {
      setSugerenciasDigemid([])
    }
  }

  const quitarSugerenciaDigemid = (): void => {
    setSugerenciaDigemidElegida(null)
  }

  const validarPaso = (): boolean => {
    if (tipoRecurso === 'MEDICAMENTO') {
      if (paso === 1) return Boolean(comercial.nombreComercial.trim() && comercial.nombreFabricante.trim())
      if (paso === 2) return Boolean(generico.ifa.trim() && generico.concentracion.trim())
      if (paso === 3) return true
      if (paso === 4) {
        return Boolean(
          presentacion.descripcion.trim()
          && presentacion.fraccionDIGEMID >= 1
          && presentacion.factorConversionBase >= 1
          && presentacion.unidadConteo.trim()
          && !nodosExtra.some((nodo) => !nodo.nombreFormaVenta.trim() || nodo.unidadesEnNodoPadre < 1),
        )
      }
    }
    if (tipoRecurso === 'PRODUCTO_GENERAL') {
      if (paso === 1) return Boolean(productoGeneral.nombre.trim() && productoGeneral.unidadVenta.trim())
      if (paso === 2) return Boolean(productoGeneral.descripcionPresentacion.trim() && productoGeneral.factorConversionBase >= 1)
      if (paso === 3) return !nodosExtra.some((nodo) => !nodo.nombreFormaVenta.trim() || nodo.unidadesEnNodoPadre < 1)
    }
    if (tipoRecurso === 'SERVICIO') return Boolean(servicio.nombre.trim())
    return false
  }

  const avanzar = (): void => {
    if (!validarPaso()) {
      setErrorLocal('Completa los campos requeridos antes de continuar.')
      return
    }
    setErrorLocal(null)
    onPasoSiguiente()
  }

  const guardarMedicamento = async (): Promise<void> => {
    const presentacionInput: CrearPresentacionInput = {
      productoComercialId: '',
      ...presentacion,
    }
    const nodosInput: CrearNodoInput[] = nodosExtra.map((nodo) => ({
      presentacionId: '',
      idTemporal: nodo.idTemporal,
      nodoPadreLocalId: nodo.nodoPadreLocalId ?? undefined,
      nombreFormaVenta: nodo.nombreFormaVenta,
      tipoFormaVenta: nodo.tipoFormaVenta,
      unidadesEnNodoPadre: nodo.unidadesEnNodoPadre,
      unidadesBase: nodo.unidadesEnNodoPadre,
      esVendible: true,
      esComprable: false,
    }))
    await onGuardar('MEDICAMENTO', generico, comercial, presentacionInput, nodosInput, ubicacionFisica.trim() || undefined)
  }

  const guardarProductoGeneral = async (): Promise<void> => {
    const nodosInput: CrearNodoInput[] = nodosExtra.map((nodo) => ({
      presentacionId: '',
      idTemporal: nodo.idTemporal,
      nodoPadreLocalId: nodo.nodoPadreLocalId ?? undefined,
      nombreFormaVenta: nodo.nombreFormaVenta,
      tipoFormaVenta: nodo.tipoFormaVenta,
      unidadesEnNodoPadre: nodo.unidadesEnNodoPadre,
      unidadesBase: nodo.unidadesEnNodoPadre,
      esVendible: true,
      esComprable: false,
    }))

    await onGuardar(
      'PRODUCTO_GENERAL',
      {
        ifa: productoGeneral.nombre,
        concentracion: '-',
        formaFarmaceutica: 'OTRO',
        categoriaFarmacia: 'OTRO',
        permiteFraccion: false,
      },
      {
        nombreComercial: productoGeneral.nombre,
        nombreFabricante: '-',
        condicionVenta: 'SIN_RECETA',
        tipoRecurso: 'PRODUCTO_GENERAL',
        requiereLote: false,
        requiereCadenaFrio: false,
      },
      {
        productoComercialId: '',
        descripcion: productoGeneral.descripcionPresentacion,
        fraccionDIGEMID: 1,
        unidadConteo: productoGeneral.unidadVenta,
        factorConversionBase: productoGeneral.factorConversionBase,
        codigoBarras: productoGeneral.codigoBarras,
        costoCompra: productoGeneral.costoCompra,
      },
      nodosInput,
      ubicacionFisica.trim() || undefined,
    )
  }

  const guardarServicio = async (): Promise<void> => {
    await onGuardar(
      'SERVICIO',
      {
        ifa: servicio.nombre,
        concentracion: '-',
        formaFarmaceutica: 'OTRO',
        categoriaFarmacia: 'OTRO',
        permiteFraccion: false,
      },
      {
        nombreComercial: servicio.nombre,
        nombreFabricante: '-',
        condicionVenta: 'SIN_RECETA',
        tipoRecurso: 'SERVICIO',
        requiereLote: false,
        requiereCadenaFrio: false,
      },
      {
        productoComercialId: '',
        descripcion: servicio.nombre,
        fraccionDIGEMID: 1,
        unidadConteo: 'servicio',
        factorConversionBase: 1,
      },
      [],
    )
  }

  const guardar = async (): Promise<void> => {
    if (!validarPaso()) {
      setErrorLocal('Completa los campos requeridos antes de guardar.')
      return
    }
    try {
      if (tipoRecurso === 'MEDICAMENTO') await guardarMedicamento()
      if (tipoRecurso === 'PRODUCTO_GENERAL') await guardarProductoGeneral()
      if (tipoRecurso === 'SERVICIO') await guardarServicio()
    } catch (guardarError) {
      setErrorLocal(guardarError instanceof Error ? guardarError.message : String(guardarError))
    }
  }

  if (tipoRecurso === null) {
    return (
      <section className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-6 py-5">
        <h3 className="text-[14px] font-bold text-slate-700">¿Qué vas a registrar?</h3>
        <div className="space-y-3">
          <button type="button" onClick={() => {
            setNodosExtra([])
            setUbicacionFisica('')
            setTipoRecurso('MEDICAMENTO')
          }} className="flex w-full items-center gap-4 rounded-2xl border-2 border-[#E3F1FA] px-6 py-5 text-left">
            <span className="text-2xl" aria-hidden="true">💊</span>
            <span><span className="block text-[14px] font-bold text-slate-700">Medicamento</span><span className="mt-1 block text-[12px] text-slate-500">Fármacos con principio activo, concentración, registro sanitario y lote.</span></span>
          </button>
          <button type="button" onClick={() => {
            setNodosExtra([])
            setUbicacionFisica('')
            setTipoRecurso('PRODUCTO_GENERAL')
          }} className="flex w-full items-center gap-4 rounded-2xl border-2 border-[#E3F1FA] px-6 py-5 text-left">
            <span className="text-2xl" aria-hidden="true">📦</span>
            <span><span className="block text-[14px] font-bold text-slate-700">Producto general</span><span className="mt-1 block text-[12px] text-slate-500">Pañales, jabones, suplementos, dispositivos y otros productos sin modelo farmacéutico.</span></span>
          </button>
          <button type="button" onClick={() => {
            setNodosExtra([])
            setUbicacionFisica('')
            setTipoRecurso('SERVICIO')
          }} className="flex w-full items-center gap-4 rounded-2xl border-2 border-[#E3F1FA] px-6 py-5 text-left">
            <span className="text-2xl" aria-hidden="true">✚</span>
            <span><span className="block text-[14px] font-bold text-slate-700">Servicio</span><span className="mt-1 block text-[12px] text-slate-500">Aplicación de inyectables, nebulizaciones, controles y otros servicios.</span></span>
          </button>
        </div>
        <button type="button" onClick={cancelar} className="w-fit text-[12px] font-bold text-[#1E88C7]">
          Cancelar y volver
        </button>
      </section>
    )
  }

  const sugerenciasUbicacion = obtenerUbicacionesFisicasSugeridas()

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-6 py-5">
      <button type="button" onClick={cancelar} className="w-fit text-[12px] font-bold text-[#1E88C7]">
        Cancelar y volver
      </button>
      <div className="rounded-2xl border border-[#E3F1FA] bg-white p-5">
        <StepperHeader paso={paso} totalPasos={totalPasos} />
        <div className="mt-6">
          {tipoRecurso === 'MEDICAMENTO' && paso === 1 && (
            <PasoComercial
              comercial={comercial}
              similares={similares}
              buscandoSimilares={buscandoSimilares}
              sugerenciasDigemid={sugerenciasDigemid}
              buscandoDigemid={buscandoDigemid}
              sugerenciaDigemidElegida={sugerenciaDigemidElegida}
              setComercial={setComercial}
              onElegirSugerenciaDigemid={elegirSugerenciaDigemid}
              onQuitarSugerenciaDigemid={quitarSugerenciaDigemid}
            />
          )}
          {tipoRecurso === 'MEDICAMENTO' && paso === 2 && <PasoMedicamentoVenta generico={generico} comercial={comercial} setGenerico={setGenerico} setComercial={setComercial} />}
          {tipoRecurso === 'MEDICAMENTO' && paso === 3 && <PasoRegulatorio comercial={comercial} estadoRegistroSanitario={estadoRegistroSanitario} setComercial={setComercial} setEstadoRegistroSanitario={setEstadoRegistroSanitario} />}
          {tipoRecurso === 'MEDICAMENTO' && paso === 4 && (
            <div className="space-y-5">
              <PasoPresentacion presentacion={presentacion} setPresentacion={setPresentacion} />
              <PasoFormasVenta
                descripcionRaiz={presentacion.descripcion}
                nodosExtra={nodosExtra}
                ubicacionFisica={ubicacionFisica}
                setUbicacionFisica={setUbicacionFisica}
                sugerenciasUbicacion={sugerenciasUbicacion}
                setNodosExtra={setNodosExtra}
              />
            </div>
          )}
          {tipoRecurso === 'PRODUCTO_GENERAL' && paso === 1 && <PasoProductoGeneralUno formulario={productoGeneral} setFormulario={setProductoGeneral} />}
          {tipoRecurso === 'PRODUCTO_GENERAL' && paso === 2 && <PasoProductoGeneralDos formulario={productoGeneral} setFormulario={setProductoGeneral} />}
          {tipoRecurso === 'PRODUCTO_GENERAL' && paso === 3 && (
            <PasoFormasVenta
              descripcionRaiz={productoGeneral.descripcionPresentacion}
              nodosExtra={nodosExtra}
              ubicacionFisica={ubicacionFisica}
              setUbicacionFisica={setUbicacionFisica}
              sugerenciasUbicacion={sugerenciasUbicacion}
              setNodosExtra={setNodosExtra}
            />
          )}
          {tipoRecurso === 'SERVICIO' && paso === 1 && <PasoServicio formulario={servicio} setFormulario={setServicio} />}
        </div>
        {(errorLocal || error) && <div className="mt-5 rounded-xl bg-[#E3F1FA] px-4 py-3 text-[12px] font-bold text-[#1E88C7]">{errorLocal ?? error}</div>}
        <footer className="mt-6 flex justify-between gap-3">
          <div className="flex items-center gap-3">
            {paso === 1 && (
              <button type="button" onClick={() => {
                setNodosExtra([])
                setUbicacionFisica('')
                setTipoRecurso(null)
              }} className="text-[12px] font-bold text-[#1E88C7]">
                ← Cambiar tipo
              </button>
            )}
            <button type="button" onClick={onPasoAnterior} disabled={paso === 1} className="rounded-xl border border-[#E3F1FA] px-4 py-2 text-[12px] font-bold text-slate-600 disabled:opacity-40">
              Anterior
            </button>
          </div>
          {paso < totalPasos ? (
            <button type="button" onClick={avanzar} className="rounded-xl bg-[#45b356] px-5 py-2 text-[12px] font-bold text-white hover:bg-[#3a9e4a]">
              Siguiente
            </button>
          ) : (
            <button type="button" onClick={guardar} disabled={cargando} className="rounded-xl bg-[#45b356] px-5 py-2 text-[12px] font-bold text-white hover:bg-[#3a9e4a] disabled:opacity-50">
              Guardar
            </button>
          )}
        </footer>
      </div>
    </section>
  )
}
