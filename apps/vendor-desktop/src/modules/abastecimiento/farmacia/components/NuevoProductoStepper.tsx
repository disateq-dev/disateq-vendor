import { Check, Plus, Trash2 } from 'lucide-react'
import { useState, type ReactElement } from 'react'
import type {
  CategoriaFarmacia,
  CondicionVenta,
  CrearNodoInput,
  CrearPresentacionInput,
  CrearProductoComercialInput,
  CrearProductoGenericoInput,
  FormaFarmaceutica,
  TipoFormaVenta,
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
    generico: CrearProductoGenericoInput,
    comercial: Omit<CrearProductoComercialInput, 'productoGenericoId'>,
    presentacion: CrearPresentacionInput,
    nodosExtra: CrearNodoInput[],
  ) => Promise<void>
}

interface PasoGenericoProps {
  generico: CrearProductoGenericoInput
  setGenerico: (generico: CrearProductoGenericoInput) => void
}

interface PasoComercialProps {
  comercial: Omit<CrearProductoComercialInput, 'productoGenericoId'>
  setComercial: (comercial: Omit<CrearProductoComercialInput, 'productoGenericoId'>) => void
}

interface PresentacionForm {
  descripcion: string
  fraccionDIGEMID: number
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
}

interface PasoFormasVentaProps {
  presentacion: PresentacionForm
  nodosExtra: NodoExtraForm[]
  setNodosExtra: (nodos: NodoExtraForm[]) => void
}

interface StepperHeaderProps {
  paso: number
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
const TIPOS_NODO_EXTRA: Exclude<TipoFormaVenta, 'PRESENTACION_ORIGINAL'>[] = ['FRACCION', 'PACK', 'PROMOCION']

function etiqueta(valor: string): string {
  return valor.replaceAll('_', ' ')
}

function StepperHeader({ paso }: StepperHeaderProps): ReactElement {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[1, 2, 3, 4].map((numero) => (
        <div key={numero} className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold ${
              numero <= paso ? 'bg-[#639922] text-white' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {numero < paso ? <Check className="h-4 w-4" /> : numero}
          </span>
          {numero < 4 && <span className={`h-1 flex-1 rounded-full ${numero < paso ? 'bg-[#639922]' : 'bg-slate-100'}`} />}
        </div>
      ))}
    </div>
  )
}

function PasoGenerico({ generico, setGenerico }: PasoGenericoProps): ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-500">IFA</span>
        <input className="h-11 w-full rounded-xl border border-[#EAF3DE] px-3" value={generico.ifa} onChange={(e) => setGenerico({ ...generico, ifa: e.target.value })} />
      </label>
      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-500">Concentración</span>
        <input className="h-11 w-full rounded-xl border border-[#EAF3DE] px-3" value={generico.concentracion} onChange={(e) => setGenerico({ ...generico, concentracion: e.target.value })} />
      </label>
      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-500">Forma farmacéutica</span>
        <select className="h-11 w-full rounded-xl border border-[#EAF3DE] px-3" value={generico.formaFarmaceutica} onChange={(e) => setGenerico({ ...generico, formaFarmaceutica: e.target.value as FormaFarmaceutica })}>
          {FORMAS_FARMACEUTICAS.map((forma) => <option key={forma} value={forma}>{etiqueta(forma)}</option>)}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-500">Categoría</span>
        <select className="h-11 w-full rounded-xl border border-[#EAF3DE] px-3" value={generico.categoriaFarmacia} onChange={(e) => setGenerico({ ...generico, categoriaFarmacia: e.target.value as CategoriaFarmacia })}>
          {CATEGORIAS_FARMACIA.map((categoria) => <option key={categoria} value={categoria}>{etiqueta(categoria)}</option>)}
        </select>
      </label>
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase text-slate-500">Permite fracción</span>
        <div className="flex gap-3">
          {[true, false].map((valor) => (
            <label key={String(valor)} className="flex items-center gap-2 text-[13px] font-semibold">
              <input type="radio" checked={generico.permiteFraccion === valor} onChange={() => setGenerico({ ...generico, permiteFraccion: valor })} />
              {valor ? 'Sí' : 'No'}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function PasoComercial({ comercial, setComercial }: PasoComercialProps): ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <input className="h-11 rounded-xl border border-[#EAF3DE] px-3" placeholder="Nombre comercial" value={comercial.nombreComercial} onChange={(e) => setComercial({ ...comercial, nombreComercial: e.target.value })} />
      <input className="h-11 rounded-xl border border-[#EAF3DE] px-3" placeholder="Fabricante" value={comercial.nombreFabricante} onChange={(e) => setComercial({ ...comercial, nombreFabricante: e.target.value })} />
      <input className="h-11 rounded-xl border border-[#EAF3DE] px-3" placeholder="Registro sanitario" value={comercial.registroSanitario ?? ''} onChange={(e) => setComercial({ ...comercial, registroSanitario: e.target.value || undefined })} />
      <input className="h-11 rounded-xl border border-[#EAF3DE] px-3" placeholder="Código DIGEMID" value={comercial.codigoDIGEMID ?? ''} onChange={(e) => setComercial({ ...comercial, codigoDIGEMID: e.target.value || undefined })} />
      <select className="h-11 rounded-xl border border-[#EAF3DE] px-3" value={comercial.condicionVenta} onChange={(e) => setComercial({ ...comercial, condicionVenta: e.target.value as CondicionVenta })}>
        {CONDICIONES_VENTA.map((condicion) => <option key={condicion} value={condicion}>{etiqueta(condicion)}</option>)}
      </select>
      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 text-[13px] font-semibold"><input type="checkbox" checked={comercial.requiereLote} onChange={(e) => setComercial({ ...comercial, requiereLote: e.target.checked })} />Requiere lote</label>
        <label className="flex items-center gap-2 text-[13px] font-semibold"><input type="checkbox" checked={comercial.requiereCadenaFrio} onChange={(e) => setComercial({ ...comercial, requiereCadenaFrio: e.target.checked })} />Cadena de frío</label>
      </div>
    </div>
  )
}

function PasoPresentacion({ presentacion, setPresentacion }: PasoPresentacionProps): ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <input className="h-11 rounded-xl border border-[#EAF3DE] px-3" placeholder="Descripción" value={presentacion.descripcion} onChange={(e) => setPresentacion({ ...presentacion, descripcion: e.target.value })} />
      <input className="h-11 rounded-xl border border-[#EAF3DE] px-3" type="number" min="1" placeholder="Fracción DIGEMID" value={presentacion.fraccionDIGEMID} onChange={(e) => setPresentacion({ ...presentacion, fraccionDIGEMID: Number(e.target.value) })} />
      <input className="h-11 rounded-xl border border-[#EAF3DE] px-3" placeholder="Unidad de conteo" value={presentacion.unidadConteo} onChange={(e) => setPresentacion({ ...presentacion, unidadConteo: e.target.value })} />
      <input className="h-11 rounded-xl border border-[#EAF3DE] px-3" placeholder="Código de barras" value={presentacion.codigoBarras ?? ''} onChange={(e) => setPresentacion({ ...presentacion, codigoBarras: e.target.value || undefined })} />
      <input className="h-11 rounded-xl border border-[#EAF3DE] px-3" type="number" min="0" placeholder="Costo compra" value={presentacion.costoCompra ?? ''} onChange={(e) => setPresentacion({ ...presentacion, costoCompra: e.target.value ? Number(e.target.value) : undefined })} />
    </div>
  )
}

function PasoFormasVenta({ presentacion, nodosExtra, setNodosExtra }: PasoFormasVentaProps): ReactElement {
  const agregarNodo = (): void => {
    setNodosExtra([...nodosExtra, { idTemporal: crypto.randomUUID(), nombreFormaVenta: '', tipoFormaVenta: 'FRACCION', unidadesEnNodoPadre: 1 }])
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#EAF3DE] bg-[#EAF3DE] p-4">
        <div className="text-[12px] font-bold text-slate-800">{presentacion.descripcion || 'Presentación original'}</div>
        <div className="mt-1 text-[11px] font-semibold text-[#639922]">Nodo raíz · vendible · comprable</div>
      </div>
      {nodosExtra.map((nodo) => (
        <div key={nodo.idTemporal} className="grid gap-3 rounded-2xl border border-[#EAF3DE] bg-white p-4 md:grid-cols-[1fr_160px_140px_40px]">
          <input className="h-10 rounded-xl border border-[#EAF3DE] px-3" placeholder="Nombre forma venta" value={nodo.nombreFormaVenta} onChange={(e) => setNodosExtra(nodosExtra.map((item) => item.idTemporal === nodo.idTemporal ? { ...item, nombreFormaVenta: e.target.value } : item))} />
          <select className="h-10 rounded-xl border border-[#EAF3DE] px-3" value={nodo.tipoFormaVenta} onChange={(e) => setNodosExtra(nodosExtra.map((item) => item.idTemporal === nodo.idTemporal ? { ...item, tipoFormaVenta: e.target.value as Exclude<TipoFormaVenta, 'PRESENTACION_ORIGINAL'> } : item))}>
            {TIPOS_NODO_EXTRA.map((tipo) => <option key={tipo} value={tipo}>{etiqueta(tipo)}</option>)}
          </select>
          <input className="h-10 rounded-xl border border-[#EAF3DE] px-3" type="number" min="1" value={nodo.unidadesEnNodoPadre} onChange={(e) => setNodosExtra(nodosExtra.map((item) => item.idTemporal === nodo.idTemporal ? { ...item, unidadesEnNodoPadre: Number(e.target.value) } : item))} />
          <button type="button" onClick={() => setNodosExtra(nodosExtra.filter((item) => item.idTemporal !== nodo.idTemporal))} className="flex h-10 items-center justify-center rounded-xl text-[#639922]">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={agregarNodo} className="flex items-center gap-2 rounded-xl bg-[#EAF3DE] px-4 py-2 text-[12px] font-bold text-[#639922]">
        <Plus className="h-4 w-4" /> Agregar forma de venta
      </button>
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
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const [generico, setGenerico] = useState<CrearProductoGenericoInput>({
    ifa: terminoBusqueda,
    concentracion: '',
    formaFarmaceutica: 'TABLETA',
    categoriaFarmacia: 'OTRO',
    permiteFraccion: true,
  })
  const [comercial, setComercial] = useState<Omit<CrearProductoComercialInput, 'productoGenericoId'>>({
    nombreComercial: '',
    nombreFabricante: '',
    condicionVenta: 'SIN_RECETA',
    requiereLote: false,
    requiereCadenaFrio: false,
  })
  const [presentacion, setPresentacion] = useState<PresentacionForm>({
    descripcion: '',
    fraccionDIGEMID: 1,
    unidadConteo: '',
  })
  const [nodosExtra, setNodosExtra] = useState<NodoExtraForm[]>([])

  const validarPaso = (): boolean => {
    if (paso === 1 && (!generico.ifa.trim() || !generico.concentracion.trim())) return false
    if (paso === 2 && (!comercial.nombreComercial.trim() || !comercial.nombreFabricante.trim())) return false
    if (paso === 3 && (!presentacion.descripcion.trim() || presentacion.fraccionDIGEMID < 1 || !presentacion.unidadConteo.trim())) return false
    if (paso === 4 && nodosExtra.some((nodo) => !nodo.nombreFormaVenta.trim() || nodo.unidadesEnNodoPadre < 1)) return false
    return true
  }

  const avanzar = (): void => {
    if (!validarPaso()) {
      setErrorLocal('Completa los campos requeridos antes de continuar.')
      return
    }
    setErrorLocal(null)
    onPasoSiguiente()
  }

  const guardar = async (): Promise<void> => {
    if (!validarPaso()) {
      setErrorLocal('Completa los campos requeridos antes de guardar.')
      return
    }
    const presentacionInput: CrearPresentacionInput = {
      productoComercialId: '',
      ...presentacion,
      factorConversionBase: presentacion.fraccionDIGEMID,
    }
    const nodosInput: CrearNodoInput[] = nodosExtra.map((nodo) => ({
      presentacionId: '',
      nombreFormaVenta: nodo.nombreFormaVenta,
      tipoFormaVenta: nodo.tipoFormaVenta,
      unidadesEnNodoPadre: nodo.unidadesEnNodoPadre,
      unidadesBase: nodo.unidadesEnNodoPadre,
      esVendible: true,
      esComprable: false,
    }))
    try {
      await onGuardar(generico, comercial, presentacionInput, nodosInput)
    } catch (guardarError) {
      setErrorLocal(guardarError instanceof Error ? guardarError.message : String(guardarError))
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-6 py-5">
      <button type="button" onClick={onCancelar} className="w-fit text-[12px] font-bold text-[#639922]">
        Cancelar y volver
      </button>
      <div className="rounded-2xl border border-[#EAF3DE] bg-white p-5">
        <StepperHeader paso={paso} />
        <div className="mt-6">
          {paso === 1 && <PasoGenerico generico={generico} setGenerico={setGenerico} />}
          {paso === 2 && <PasoComercial comercial={comercial} setComercial={setComercial} />}
          {paso === 3 && <PasoPresentacion presentacion={presentacion} setPresentacion={setPresentacion} />}
          {paso === 4 && <PasoFormasVenta presentacion={presentacion} nodosExtra={nodosExtra} setNodosExtra={setNodosExtra} />}
        </div>
        {(errorLocal || error) && <div className="mt-5 rounded-xl bg-[#EAF3DE] px-4 py-3 text-[12px] font-bold text-[#639922]">{errorLocal ?? error}</div>}
        <footer className="mt-6 flex justify-between gap-3">
          <button type="button" onClick={onPasoAnterior} disabled={paso === 1} className="rounded-xl border border-[#EAF3DE] px-4 py-2 text-[12px] font-bold text-slate-600 disabled:opacity-40">
            Anterior
          </button>
          {paso < 4 ? (
            <button type="button" onClick={avanzar} className="rounded-xl bg-[#639922] px-5 py-2 text-[12px] font-bold text-white">
              Siguiente
            </button>
          ) : (
            <button type="button" onClick={guardar} disabled={cargando} className="rounded-xl bg-[#639922] px-5 py-2 text-[12px] font-bold text-white disabled:opacity-50">
              Guardar
            </button>
          )}
        </footer>
      </div>
    </section>
  )
}
