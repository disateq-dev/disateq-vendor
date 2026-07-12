import { useCallback, useEffect, useState, type ReactElement } from 'react'
import type {
  EstadoRegistroSanitario,
  CrearNodoInput,
  ModificarProductoComercialInput,
  CorregirDatosOperacionalesInput,
  ModificarPresentacionInput,
  ModificarNodoInput,
  NodoFraccionamiento,
  PresentacionComercial,
  ProductoComercial,
} from '../../../../domains/farmacia/types'
import type { CrearValorOperacionalInput, EstadoValorOperacional, ModificarValorOperacionalInput, TipoValorOperacional, ValorOperacionalFarmacia } from '../../../../domains/farmacia/types'
import {
  modificarUbicacionFisica,
  obtenerHOVsDeNodos,
  obtenerUbicacionesFisicasSugeridas,
} from '../../../../domains/catalog/hov.service'
import type { HOV } from '../../../../domains/catalog/hov.types'
import {
  crearNodo,
  crearValorOperacional,
  desactivarProductoComercial,
  eliminarProductoComercialFisico,
  modificarProductoComercial,
  corregirDatosOperacionales,
  modificarValorOperacional,
  modificarPresentacion,
  modificarNodo,
  obtenerNodosFraccionamiento,
  obtenerValoresNodo,
  reactivarProductoComercial,
  verificarHistorialPresentacion,
  verificarHistorialNodo,
  verificarHistorialProducto,
  asignarPrincipiosAProducto,
} from '../../../../domains/farmacia/farmacia.service'
import { proyectarAHov, retirarHovDeNodo, retirarHovsDeProducto, reactivarHovsDeProducto, sincronizarValorOperacionalFarmacia } from '../../../../domains/farmacia/hov-projector.service'
import { usePOS } from '../../../../context/POSContext'
import { ComboboxFiltrado } from '../../../../components/ComboboxFiltrado'
import { LABEL_CAMPO, LABEL_CONDICION_VENTA, LABEL_FORMA_FARMACEUTICA } from '../../../../domains/catalog/etiquetas-ui'
import type { VistaCatalogo } from '../hooks/useCatalogoFarmacia'
import { SelectorPrincipiosActivos } from './SelectorPrincipiosActivos'

interface DetalleProductoProps {
  producto: ProductoComercial
  productoPreview: ProductoComercial | null
  productoConfirmado: boolean
  presentaciones: PresentacionComercial[]
  nodos: NodoFraccionamiento[]
  vistaActiva: VistaCatalogo
  cargando: boolean
  onIrADetalle: () => void
  onIrAPresentaciones: () => void
  onIrAPrecios: () => void
  onActualizarProductoSeleccionado: (p: ProductoComercial) => void
  onNavegaAIngresos: () => void
  onLimpiar: () => void
}

type ModoDetalle = 'lectura' | 'corrigiendo' | 'desactivando'

interface CampoLecturaProps {
  label: string
  valor?: string | number
}

interface PresentacionesTabProps {
  producto: ProductoComercial
  presentaciones: PresentacionComercial[]
  nodos: NodoFraccionamiento[]
  nombreProducto: string
  nombreFabricante: string
}

interface FormularioPresentacion {
  descripcion: string
  codigoBarras: string
  costoCompra: string
  fraccionDIGEMID: string
  unidadConteo: string
  factorConversionBase: string
}

interface FormularioNodo {
  nombreFormaVenta: string
  descripcionPromo: string
  esVendible: boolean
  tipoFormaVenta: NodoFraccionamiento['tipoFormaVenta']
  unidadesBase: string
}

interface PreciosTabProps {
  nodos: NodoFraccionamiento[]
  nombreProducto: string
  nombreFabricante: string
}

interface ProductoComercialConCategoria extends ProductoComercial {
  categoriaFarmacia?: string
}

function categoriaProducto(producto: ProductoComercial): string {
  const productoConCategoria = producto as ProductoComercialConCategoria
  return productoConCategoria.categoriaFarmacia ?? 'SIN CATEGORIA'
}

function formatearFecha(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

function CampoLectura({ label, valor }: CampoLecturaProps): ReactElement {
  return (
    <div className="rounded-xl border border-[var(--dv-border)] bg-[var(--dv-surface-panel)] px-3 py-2">
      <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">{label}</div>
      <div className="mt-1 min-h-5 text-[11px] font-semibold text-[var(--dv-text-primary)]">{valor ?? '-'}</div>
    </div>
  )
}

interface FormularioNuevoNodo {
  nombreFormaVenta: string
  tipoFormaVenta: 'FRACCION' | 'PACK' | 'PROMOCION' | 'INTERMEDIA'
  unidadesBase: string
  esVendible: boolean
  esComprable: boolean
  nodoPadreId: string
  descripcionPromo: string
}
function PresentacionesTab({ producto, presentaciones, nodos, nombreProducto, nombreFabricante }: PresentacionesTabProps): ReactElement {
  const { activeOperator } = usePOS()
  const tiposFormaVentaEditables: NodoFraccionamiento['tipoFormaVenta'][] = ['FRACCION', 'PACK', 'PROMOCION', 'INTERMEDIA']
  const [hovs, setHovs] = useState<HOV[]>([])
  const [presentacionesLocales, setPresentacionesLocales] = useState<PresentacionComercial[]>(presentaciones)
  const [nodosLocales, setNodosLocales] = useState<NodoFraccionamiento[]>(nodos)
  const [formularioUbicacion, setFormularioUbicacion] = useState<{ hovId: string; valor: string } | null>(null)
  const [guardandoUbicacion, setGuardandoUbicacion] = useState<boolean>(false)
  const [presentacionEnEdicionId, setPresentacionEnEdicionId] = useState<string | null>(null)
  const [formularioPresentacion, setFormularioPresentacion] = useState<FormularioPresentacion | null>(null)
  const [presentacionTieneHistorial, setPresentacionTieneHistorial] = useState<boolean | null>(null)
  const [motivoPresentacion, setMotivoPresentacion] = useState<string>('')
  const [guardandoPresentacion, setGuardandoPresentacion] = useState<boolean>(false)
  const [errorPresentacion, setErrorPresentacion] = useState<string | null>(null)
  const [nodoEnEdicionId, setNodoEnEdicionId] = useState<string | null>(null)
  const [formularioNodo, setFormularioNodo] = useState<FormularioNodo | null>(null)
  const [nodoTieneHistorial, setNodoTieneHistorial] = useState<boolean | null>(null)
  const [motivoNodo, setMotivoNodo] = useState<string>('')
  const [guardandoNodo, setGuardandoNodo] = useState<boolean>(false)
  const [errorNodo, setErrorNodo] = useState<string | null>(null)
  const [presentacionAgregarNodoId, setPresentacionAgregarNodoId] = useState<string | null>(null)
  const [formularioNuevoNodo, setFormularioNuevoNodo] = useState<FormularioNuevoNodo | null>(null)
  const [guardandoNuevoNodo, setGuardandoNuevoNodo] = useState<boolean>(false)
  const [errorNuevoNodo, setErrorNuevoNodo] = useState<string | null>(null)

  useEffect(() => {
    setPresentacionesLocales(presentaciones)
  }, [presentaciones])

  useEffect(() => {
    setNodosLocales(nodos)
  }, [nodos])

  useEffect(() => {
    setHovs(obtenerHOVsDeNodos(nodosLocales.filter((nodo) => nodo.esVendible).map((nodo) => nodo.id)))
  }, [nodosLocales])

  const mensajeErrorCorreccion = (error: unknown): string => {
    const mensaje = error instanceof Error ? error.message : String(error)
    if (mensaje.includes('CAMPO_BLOQUEADO_POR_HISTORIAL')) {
      return 'Este campo no se puede modificar porque ya tiene movimientos registrados'
    }
    if (mensaje.includes('MOTIVO_REQUERIDO')) {
      return 'Escribe un motivo antes de guardar'
    }
    return mensaje
  }

  const numeroOpcional = (valor: string): number | undefined => {
    const limpio = valor.trim()
    if (limpio === '') return undefined
    const numero = Number(limpio)
    return Number.isFinite(numero) ? numero : undefined
  }

  const refrescarHovs = (nodosActuales: NodoFraccionamiento[]): void => {
    setHovs(obtenerHOVsDeNodos(nodosActuales.filter((nodo) => nodo.esVendible).map((nodo) => nodo.id)))
  }

  const onEditarPresentacion = async (presentacion: PresentacionComercial): Promise<void> => {
    setPresentacionEnEdicionId(presentacion.id)
    setFormularioPresentacion({
      descripcion: presentacion.descripcion,
      codigoBarras: presentacion.codigoBarras ?? '',
      costoCompra: presentacion.costoCompra?.toString() ?? '',
      fraccionDIGEMID: presentacion.fraccionDIGEMID.toString(),
      unidadConteo: presentacion.unidadConteo,
      factorConversionBase: presentacion.factorConversionBase.toString(),
    })
    setPresentacionTieneHistorial(null)
    setMotivoPresentacion('')
    setErrorPresentacion(null)
    try {
      const tieneHistorial = await verificarHistorialPresentacion(presentacion.id)
      setPresentacionTieneHistorial(tieneHistorial)
    } catch (errorHistorial) {
      setErrorPresentacion(mensajeErrorCorreccion(errorHistorial))
    }
  }

  const onCancelarPresentacion = (): void => {
    setPresentacionEnEdicionId(null)
    setFormularioPresentacion(null)
    setPresentacionTieneHistorial(null)
    setMotivoPresentacion('')
    setErrorPresentacion(null)
  }

  const onGuardarPresentacion = async (presentacion: PresentacionComercial): Promise<void> => {
    if (formularioPresentacion === null || presentacionTieneHistorial === null) return

    const fraccionDIGEMID = numeroOpcional(formularioPresentacion.fraccionDIGEMID)
    const factorConversionBase = numeroOpcional(formularioPresentacion.factorConversionBase)
    const costoCompra = numeroOpcional(formularioPresentacion.costoCompra)
    const input: ModificarPresentacionInput = {
      id: presentacion.id,
      descripcion: formularioPresentacion.descripcion,
      codigoBarras: formularioPresentacion.codigoBarras.trim() || undefined,
      costoCompra,
      fraccionDIGEMID,
      unidadConteo: formularioPresentacion.unidadConteo.trim() || undefined,
      factorConversionBase,
      motivo: presentacionTieneHistorial ? motivoPresentacion.trim() || undefined : undefined,
      operadorId: activeOperator?.id,
    }

    setGuardandoPresentacion(true)
    setErrorPresentacion(null)
    try {
      await modificarPresentacion(input)
      const presentacionActualizada: PresentacionComercial = {
        ...presentacion,
        descripcion: input.descripcion,
        codigoBarras: input.codigoBarras,
        costoCompra: input.costoCompra,
        fraccionDIGEMID: input.fraccionDIGEMID ?? presentacion.fraccionDIGEMID,
        unidadConteo: input.unidadConteo ?? presentacion.unidadConteo,
        factorConversionBase: input.factorConversionBase ?? presentacion.factorConversionBase,
      }
      setPresentacionesLocales((actuales) =>
        actuales.map((item) => (item.id === presentacion.id ? presentacionActualizada : item)),
      )
      onCancelarPresentacion()
    } catch (errorGuardar) {
      setErrorPresentacion(mensajeErrorCorreccion(errorGuardar))
    } finally {
      setGuardandoPresentacion(false)
    }
  }

  const onEditarNodo = async (nodo: NodoFraccionamiento): Promise<void> => {
    setNodoEnEdicionId(nodo.id)
    setFormularioNodo({
      nombreFormaVenta: nodo.nombreFormaVenta,
      descripcionPromo: nodo.descripcionPromo ?? '',
      esVendible: nodo.esVendible,
      tipoFormaVenta: nodo.tipoFormaVenta,
      unidadesBase: nodo.unidadesBase.toString(),
    })
    setNodoTieneHistorial(null)
    setMotivoNodo('')
    setErrorNodo(null)
    try {
      const tieneHistorial = await verificarHistorialNodo(nodo.id)
      setNodoTieneHistorial(tieneHistorial)
    } catch (errorHistorial) {
      setErrorNodo(mensajeErrorCorreccion(errorHistorial))
    }
  }

  const onCancelarNodo = (): void => {
    setNodoEnEdicionId(null)
    setFormularioNodo(null)
    setNodoTieneHistorial(null)
    setMotivoNodo('')
    setErrorNodo(null)
  }

  const onGuardarNodo = async (nodo: NodoFraccionamiento): Promise<void> => {
    if (formularioNodo === null || nodoTieneHistorial === null) return

    const nodoEsRaiz = nodo.tipoFormaVenta === 'PRESENTACION_ORIGINAL'
    const unidadesBase = nodoEsRaiz ? undefined : numeroOpcional(formularioNodo.unidadesBase)
    const input: ModificarNodoInput = {
      id: nodo.id,
      nombreFormaVenta: formularioNodo.nombreFormaVenta,
      descripcionPromo: formularioNodo.tipoFormaVenta === 'PROMOCION' ? formularioNodo.descripcionPromo.trim() || undefined : undefined,
      esVendible: formularioNodo.esVendible,
      tipoFormaVenta: nodoEsRaiz ? undefined : formularioNodo.tipoFormaVenta,
      unidadesBase,
      motivo: nodoTieneHistorial ? motivoNodo.trim() || undefined : undefined,
      operadorId: activeOperator?.id,
    }

    setGuardandoNodo(true)
    setErrorNodo(null)
    try {
      await modificarNodo(input)
      const nodoActualizado: NodoFraccionamiento = {
        ...nodo,
        nombreFormaVenta: input.nombreFormaVenta,
        descripcionPromo: input.descripcionPromo,
        esVendible: input.esVendible,
        tipoFormaVenta: input.tipoFormaVenta ?? nodo.tipoFormaVenta,
        unidadesBase: input.unidadesBase ?? nodo.unidadesBase,
      }
      if (!nodo.esVendible && nodoActualizado.esVendible) {
        const presentacionEncontrada = presentacionesLocales.find((presentacion) => presentacion.id === nodo.presentacionId)
        if (presentacionEncontrada !== undefined) {
          try {
            proyectarAHov(nodoActualizado, presentacionEncontrada, producto, 'default', producto.tipoRecurso, undefined)
          } catch (errorHov) {
            console.error('No se pudo proyectar la forma de venta a HOV:', errorHov)
          }
        }
      }
      if (nodo.esVendible && !nodoActualizado.esVendible) {
        try {
          retirarHovDeNodo(nodo.id)
        } catch (errorHov) {
          console.error('No se pudo retirar la HOV de la forma de venta:', errorHov)
        }
      }
      const nodosActualizados = nodosLocales.map((item) => (item.id === nodo.id ? nodoActualizado : item))
      setNodosLocales(nodosActualizados)
      refrescarHovs(nodosActualizados)
      onCancelarNodo()
    } catch (errorGuardar) {
      setErrorNodo(mensajeErrorCorreccion(errorGuardar))
    } finally {
      setGuardandoNodo(false)
    }
  }

  const onGuardarUbicacion = (): void => {
    if (formularioUbicacion === null) return

    setGuardandoUbicacion(true)
    try {
      modificarUbicacionFisica(formularioUbicacion.hovId, formularioUbicacion.valor.trim() || undefined)
      refrescarHovs(nodosLocales)
      setFormularioUbicacion(null)
    } catch (errorUbicacion) {
      console.error('No se pudo modificar la ubicación física de venta:', errorUbicacion)
    } finally {
      setGuardandoUbicacion(false)
    }
  }

  function onAbrirFormularioNuevoNodo(presentacionId: string): void {
    onCancelarPresentacion()
    onCancelarNodo()
    setPresentacionAgregarNodoId(presentacionId)
    setFormularioNuevoNodo({
      nombreFormaVenta: '',
      tipoFormaVenta: 'FRACCION',
      unidadesBase: '',
      esVendible: true,
      esComprable: false,
      nodoPadreId: '',
      descripcionPromo: '',
    })
    setErrorNuevoNodo(null)
  }

  function onCancelarNuevoNodo(): void {
    setPresentacionAgregarNodoId(null)
    setFormularioNuevoNodo(null)
    setErrorNuevoNodo(null)
  }

  async function onGuardarNuevoNodo(presentacion: PresentacionComercial): Promise<void> {
    if (!formularioNuevoNodo) return

    if (!formularioNuevoNodo.nombreFormaVenta.trim()) {
      setErrorNuevoNodo('El nombre de la forma de venta es obligatorio')
      return
    }
    const unidadesBase = Number(formularioNuevoNodo.unidadesBase)
    if (!Number.isFinite(unidadesBase) || unidadesBase <= 0) {
      setErrorNuevoNodo('Las unidades base deben ser un número mayor a 0')
      return
    }

    const nodoRaiz = nodosLocales.find(
      n => n.presentacionId === presentacion.id && n.tipoFormaVenta === 'PRESENTACION_ORIGINAL'
    )
    const nodoPadreIdFinal = formularioNuevoNodo.nodoPadreId || nodoRaiz?.id

    const input: CrearNodoInput = {
      presentacionId: presentacion.id,
      nodoPadreId: nodoPadreIdFinal,
      nombreFormaVenta: formularioNuevoNodo.nombreFormaVenta.trim(),
      tipoFormaVenta: formularioNuevoNodo.tipoFormaVenta,
      unidadesBase,
      esVendible: formularioNuevoNodo.esVendible,
      esComprable: formularioNuevoNodo.esComprable,
      descripcionPromo: formularioNuevoNodo.tipoFormaVenta === 'PROMOCION'
        ? formularioNuevoNodo.descripcionPromo.trim() || undefined
        : undefined,
    }

    setGuardandoNuevoNodo(true)
    setErrorNuevoNodo(null)
    try {
      const nuevoId = await crearNodo(input)
      const nodosRefrescados = await obtenerNodosFraccionamiento(presentacion.id)
      const nodoCreado = nodosRefrescados.find(n => n.id === nuevoId)
      if (nodoCreado?.esVendible) {
        try {
          proyectarAHov(
            nodoCreado,
            presentacion,
            producto,
            'default',
            producto.tipoRecurso,
            undefined
          )
        } catch (errorHov) {
          console.error('No se pudo proyectar la nueva forma de venta a HOV:', errorHov)
        }
      }
      const otrasPresent = nodosLocales.filter(n => n.presentacionId !== presentacion.id)
      const nodosActualizados = [...otrasPresent, ...nodosRefrescados]
      setNodosLocales(nodosActualizados)
      refrescarHovs(nodosActualizados)
      onCancelarNuevoNodo()
    } catch (errorGuardar) {
      setErrorNuevoNodo(errorGuardar instanceof Error ? errorGuardar.message : String(errorGuardar))
    } finally {
      setGuardandoNuevoNodo(false)
    }
  }

  const sugerenciasUbicacion = obtenerUbicacionesFisicasSugeridas()

  return (
    <>
      <div className="flex items-start gap-3 mb-4 px-1">
        <div>
          <h2 className="text-[16px] font-bold text-[var(--dv-text-primary)]">{nombreProducto}</h2>
          <p className="text-[12px] font-semibold text-[var(--dv-text-secondary)]">{nombreFabricante}</p>
        </div>
      </div>
      <datalist id="sugerencias-ubicacion-fisica-detalle">
        {sugerenciasUbicacion.map((ubicacion) => <option key={ubicacion} value={ubicacion} />)}
      </datalist>
      <div className="space-y-4">
        {presentacionesLocales.map((presentacion) => {
          const editandoPresentacion = presentacionEnEdicionId === presentacion.id && formularioPresentacion !== null

          return (
            <article key={presentacion.id} className="rounded-2xl border border-[var(--dv-border)] bg-[var(--dv-surface-panel)] p-4">
              <div className="flex items-start justify-between gap-4">
                {editandoPresentacion && formularioPresentacion !== null ? (
                  <div className="min-w-0 flex-1 rounded-xl border border-[var(--dv-mod-abastecimiento-border)] bg-[var(--dv-mod-abastecimiento-bg)] p-3">
                    {errorPresentacion !== null && (
                      <p className="mb-2 rounded-lg border border-[var(--dv-color-danger-border)] bg-[var(--dv-color-danger-bg)] px-3 py-2 text-[11px] font-semibold text-[var(--dv-color-danger)]">{errorPresentacion}</p>
                    )}
                    {presentacionTieneHistorial === null && (
                      <p className="mb-2 text-[11px] font-semibold text-[var(--dv-text-muted)]">Verificando historial...</p>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      <label>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Descripción</span>
                        <input
                          type="text"
                          value={formularioPresentacion.descripcion}
                          onChange={(event) => setFormularioPresentacion({ ...formularioPresentacion, descripcion: event.target.value })}
                          className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                        />
                      </label>
                      <label>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Código de barras</span>
                        <input
                          type="text"
                          value={formularioPresentacion.codigoBarras}
                          onChange={(event) => setFormularioPresentacion({ ...formularioPresentacion, codigoBarras: event.target.value })}
                          className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                        />
                      </label>
                      <label>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Costo compra</span>
                        <input
                          type="number"
                          value={formularioPresentacion.costoCompra}
                          onChange={(event) => setFormularioPresentacion({ ...formularioPresentacion, costoCompra: event.target.value })}
                          className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                        />
                      </label>
                      <label>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Fracción DIGEMID</span>
                        <input
                          type="number"
                          value={formularioPresentacion.fraccionDIGEMID}
                          onChange={(event) => setFormularioPresentacion({ ...formularioPresentacion, fraccionDIGEMID: event.target.value })}
                          disabled={presentacionTieneHistorial !== false}
                          className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)] disabled:cursor-not-allowed disabled:bg-[var(--dv-surface-field)] disabled:text-[var(--dv-text-muted)]"
                        />
                        {presentacionTieneHistorial === true && <span className="mt-1 block text-[10px] font-semibold text-amber-600">Bloqueado -- tiene movimientos registrados</span>}
                      </label>
                      <label>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Unidad conteo</span>
                        <input
                          type="text"
                          value={formularioPresentacion.unidadConteo}
                          onChange={(event) => setFormularioPresentacion({ ...formularioPresentacion, unidadConteo: event.target.value })}
                          disabled={presentacionTieneHistorial !== false}
                          className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)] disabled:cursor-not-allowed disabled:bg-[var(--dv-surface-field)] disabled:text-[var(--dv-text-muted)]"
                        />
                        {presentacionTieneHistorial === true && <span className="mt-1 block text-[10px] font-semibold text-amber-600">Bloqueado -- tiene movimientos registrados</span>}
                      </label>
                      <label>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Factor conversión base</span>
                        <input
                          type="number"
                          value={formularioPresentacion.factorConversionBase}
                          onChange={(event) => setFormularioPresentacion({ ...formularioPresentacion, factorConversionBase: event.target.value })}
                          disabled={presentacionTieneHistorial !== false}
                          className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)] disabled:cursor-not-allowed disabled:bg-[var(--dv-surface-field)] disabled:text-[var(--dv-text-muted)]"
                        />
                        {presentacionTieneHistorial === true && <span className="mt-1 block text-[10px] font-semibold text-amber-600">Bloqueado -- tiene movimientos registrados</span>}
                      </label>
                    </div>
                    {presentacionTieneHistorial === true && (
                      <label className="mt-2 block">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Motivo de corrección</span>
                        <input
                          type="text"
                          value={motivoPresentacion}
                          onChange={(event) => setMotivoPresentacion(event.target.value)}
                          className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                        />
                      </label>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void onGuardarPresentacion(presentacion)}
                        disabled={guardandoPresentacion || presentacionTieneHistorial === null}
                        className="rounded-lg bg-[var(--dv-color-confirm)] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={onCancelarPresentacion}
                        className="rounded-lg border border-[var(--dv-border)] px-3 py-1.5 text-[11px] font-bold text-[var(--dv-text-secondary)]"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-[14px] font-bold text-[var(--dv-text-primary)]">{presentacion.descripcion}</h3>
                    <p className="mt-1 text-[12px] font-semibold text-[var(--dv-text-secondary)]">
                      Fracción DIGEMID: {presentacion.fraccionDIGEMID} {presentacion.unidadConteo}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onAbrirFormularioNuevoNodo(presentacion.id)}
                    disabled={presentacionAgregarNodoId === presentacion.id}
                    className="rounded-full border border-[var(--dv-border)] px-3 py-1.5 text-[11px] font-bold text-[var(--dv-mod-abastecimiento)]"
                  >
                    Agregar forma de venta
                  </button>
                  {!editandoPresentacion && (
                    <button
                      type="button"
                      onClick={() => void onEditarPresentacion(presentacion)}
                      disabled={guardandoPresentacion}
                      className="rounded-full border border-[var(--dv-border)] px-3 py-1.5 text-[11px] font-bold text-[var(--dv-text-secondary)]"
                    >
                      Editar presentación
                    </button>
                  )}
                </div>
              </div>
            <div className="mt-4 space-y-2">
              {nodosLocales
                .filter((nodo) => nodo.presentacionId === presentacion.id)
                .map((nodo) => {
                  const hov = hovs.find((item) => item.nodoFraccionamientoId === nodo.id)
                  const editandoUbicacion = formularioUbicacion !== null && hov !== undefined && formularioUbicacion.hovId === hov.id
                  const editandoNodo = nodoEnEdicionId === nodo.id && formularioNodo !== null
                  const nodoEsRaiz = nodo.tipoFormaVenta === 'PRESENTACION_ORIGINAL'

                  return (
                    <div key={nodo.id} className={`rounded-xl bg-[var(--dv-mod-abastecimiento-bg)] px-3 py-2 ${nodo.nodoPadreId ? 'ml-6' : ''}`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[12px] font-bold text-[var(--dv-text-primary)]">{nodo.nombreFormaVenta}</span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[var(--dv-surface-panel)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--dv-mod-abastecimiento)]">
                            {nodo.tipoFormaVenta}
                          </span>
                          {!editandoNodo && (
                            <button
                              type="button"
                              onClick={() => void onEditarNodo(nodo)}
                              disabled={guardandoNodo}
                              className="text-[11px] font-semibold text-[var(--dv-text-muted)] underline"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-[var(--dv-text-secondary)]">Unidades base: {nodo.unidadesBase}</p>
                      {editandoNodo && formularioNodo !== null && (
                        <div className="mt-2 rounded-xl border border-[var(--dv-mod-abastecimiento-border)] bg-[var(--dv-surface-panel)] p-3">
                          {errorNodo !== null && (
                            <p className="mb-2 rounded-lg border border-[var(--dv-color-danger-border)] bg-[var(--dv-color-danger-bg)] px-3 py-2 text-[11px] font-semibold text-[var(--dv-color-danger)]">{errorNodo}</p>
                          )}
                          {nodoTieneHistorial === null && (
                            <p className="mb-2 text-[11px] font-semibold text-[var(--dv-text-muted)]">Verificando historial...</p>
                          )}
                          <div className="grid grid-cols-3 gap-2">
                            <label>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Nombre forma venta</span>
                              <input
                                type="text"
                                value={formularioNodo.nombreFormaVenta}
                                onChange={(event) => setFormularioNodo({ ...formularioNodo, nombreFormaVenta: event.target.value })}
                                className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                              />
                            </label>
                            <label className="flex items-center gap-2 pt-5">
                              <input
                                type="checkbox"
                                checked={formularioNodo.esVendible}
                                onChange={(event) => setFormularioNodo({ ...formularioNodo, esVendible: event.target.checked })}
                                className="h-4 w-4"
                              />
                              <span className="text-[11px] font-bold text-[var(--dv-text-primary)]">Vendible</span>
                            </label>
                            {!nodoEsRaiz && (
                              <label>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Tipo forma venta</span>
                                <select
                                  value={formularioNodo.tipoFormaVenta}
                                  onChange={(event) => setFormularioNodo({ ...formularioNodo, tipoFormaVenta: event.target.value as NodoFraccionamiento['tipoFormaVenta'] })}
                                  disabled={nodoTieneHistorial !== false}
                                  className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)] disabled:cursor-not-allowed disabled:bg-[var(--dv-surface-field)] disabled:text-[var(--dv-text-muted)]"
                                >
                                  {tiposFormaVentaEditables.map((tipoFormaVenta) => (
                                    <option key={tipoFormaVenta} value={tipoFormaVenta}>{tipoFormaVenta}</option>
                                  ))}
                                </select>
                                {nodoTieneHistorial === true && <span className="mt-1 block text-[10px] font-semibold text-amber-600">Bloqueado -- tiene movimientos registrados</span>}
                              </label>
                            )}
                            <label>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Unidades base</span>
                              <input
                                type="number"
                                value={formularioNodo.unidadesBase}
                                onChange={(event) => setFormularioNodo({ ...formularioNodo, unidadesBase: event.target.value })}
                                disabled={nodoEsRaiz || nodoTieneHistorial !== false}
                                className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)] disabled:cursor-not-allowed disabled:bg-[var(--dv-surface-field)] disabled:text-[var(--dv-text-muted)]"
                              />
                              {nodoEsRaiz ? (
                                <span className="mt-1 block text-[10px] font-semibold text-amber-600">Bloqueado -- presentación original</span>
                              ) : (
                                nodoTieneHistorial === true && <span className="mt-1 block text-[10px] font-semibold text-amber-600">Bloqueado -- tiene movimientos registrados</span>
                              )}
                            </label>
                            {formularioNodo.tipoFormaVenta === 'PROMOCION' && (
                              <label>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Descripción promo</span>
                                <input
                                  type="text"
                                  value={formularioNodo.descripcionPromo}
                                  onChange={(event) => setFormularioNodo({ ...formularioNodo, descripcionPromo: event.target.value })}
                                  className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                                />
                              </label>
                            )}
                          </div>
                          {nodoTieneHistorial === true && (
                            <label className="mt-2 block">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Motivo de corrección</span>
                              <input
                                type="text"
                                value={motivoNodo}
                                onChange={(event) => setMotivoNodo(event.target.value)}
                                className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                              />
                            </label>
                          )}
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => void onGuardarNodo(nodo)}
                              disabled={guardandoNodo || nodoTieneHistorial === null}
                              className="rounded-lg bg-[var(--dv-color-confirm)] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={onCancelarNodo}
                              className="rounded-lg border border-[var(--dv-border)] px-3 py-1.5 text-[11px] font-bold text-[var(--dv-text-secondary)]"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                      {nodo.esVendible && (
                        <div className="mt-2">
                          {editandoUbicacion && formularioUbicacion !== null ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                list="sugerencias-ubicacion-fisica-detalle"
                                value={formularioUbicacion.valor}
                                onChange={(event) => setFormularioUbicacion({ ...formularioUbicacion, valor: event.target.value })}
                                className="h-8 min-w-[220px] flex-1 rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                              />
                              <button
                                type="button"
                                onClick={onGuardarUbicacion}
                                disabled={guardandoUbicacion}
                                className="rounded-lg bg-[var(--dv-color-confirm)] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormularioUbicacion(null)}
                                className="rounded-lg border border-[var(--dv-border)] px-3 py-1.5 text-[11px] font-bold text-[var(--dv-text-secondary)]"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[11px] font-semibold text-[var(--dv-text-secondary)]">
                                Ubicación: <span className="text-[var(--dv-text-muted)]">{hov?.ubicacionFisica ?? 'Sin asignar'}</span>
                              </p>
                              {hov !== undefined && (
                                <button
                                  type="button"
                                  onClick={() => setFormularioUbicacion({ hovId: hov.id, valor: hov.ubicacionFisica ?? '' })}
                                  className="text-[11px] font-semibold text-[var(--dv-text-muted)] underline"
                                >
                                  Editar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
            {presentacionAgregarNodoId === presentacion.id && formularioNuevoNodo !== null && (
              <div className="mt-3 rounded-xl border border-[var(--dv-mod-abastecimiento-border)] bg-[var(--dv-mod-abastecimiento-bg)] p-3">
                {errorNuevoNodo !== null && (
                  <p className="mb-2 rounded-lg border border-[var(--dv-color-danger-border)] bg-[var(--dv-color-danger-bg)] px-3 py-2 text-[11px] font-semibold text-[var(--dv-color-danger)]">
                    {errorNuevoNodo}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <label className="col-span-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Nombre forma de venta</span>
                    <input
                      autoFocus
                      type="text"
                      value={formularioNuevoNodo.nombreFormaVenta}
                      onChange={e => setFormularioNuevoNodo({ ...formularioNuevoNodo, nombreFormaVenta: e.target.value })}
                      placeholder="Ej: Blíster x10, Caja x20, Unidad"
                      className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                    />
                  </label>
                  <label>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Tipo</span>
                    <select
                      value={formularioNuevoNodo.tipoFormaVenta}
                      onChange={e => setFormularioNuevoNodo({ ...formularioNuevoNodo, tipoFormaVenta: e.target.value as FormularioNuevoNodo['tipoFormaVenta'] })}
                      className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                    >
                      <option value="FRACCION">Fracción</option>
                      <option value="PACK">Pack</option>
                      <option value="PROMOCION">Promoción</option>
                      <option value="INTERMEDIA">Intermedia</option>
                    </select>
                  </label>
                  <label>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Unidades base</span>
                    <input
                      type="number"
                      value={formularioNuevoNodo.unidadesBase}
                      onChange={e => setFormularioNuevoNodo({ ...formularioNuevoNodo, unidadesBase: e.target.value })}
                      placeholder="Ej: 10"
                      min="1"
                      className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold tabular-nums text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                    />
                  </label>
                  <div className="flex items-center gap-4 pt-5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formularioNuevoNodo.esVendible}
                        onChange={e => setFormularioNuevoNodo({ ...formularioNuevoNodo, esVendible: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-[11px] font-bold text-[var(--dv-text-primary)]">Vendible</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formularioNuevoNodo.esComprable}
                        onChange={e => setFormularioNuevoNodo({ ...formularioNuevoNodo, esComprable: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-[11px] font-bold text-[var(--dv-text-primary)]">Comprable</span>
                    </label>
                  </div>
                  {formularioNuevoNodo.tipoFormaVenta === 'PROMOCION' && (
                    <label className="col-span-3">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Descripción de la promoción</span>
                      <input
                        type="text"
                        value={formularioNuevoNodo.descripcionPromo}
                        onChange={e => setFormularioNuevoNodo({ ...formularioNuevoNodo, descripcionPromo: e.target.value })}
                        placeholder="Ej: 2x1 en caja grande"
                        className="mt-1 h-8 w-full rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-input-bg)] px-2 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                      />
                    </label>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void onGuardarNuevoNodo(presentacion)}
                    disabled={guardandoNuevoNodo}
                    className="rounded-lg bg-[#45b356] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                  >
                    GUARDAR
                  </button>
                  <button
                    type="button"
                    onClick={onCancelarNuevoNodo}
                    className="rounded-lg border border-[var(--dv-color-exit-border)] px-3 py-1.5 text-[11px] font-bold text-[var(--dv-color-exit)]"
                  >
                    CANCELAR
                  </button>
                </div>
              </div>
            )}
          </article>
          )
        })}
      </div>
    </>
  )
}

function PreciosTab({ nodos, nombreProducto, nombreFabricante }: PreciosTabProps): ReactElement {
  const ETIQUETA_TIPO: Record<TipoValorOperacional, string> = {
    VENTA_NORMAL: 'Precio base',
    VENTA_MAYOREO: 'Por mayor',
    VENTA_FRECUENTE: 'Cliente frecuente',
    VENTA_PROMOCION: 'Promoción',
  }
  const TODOS_LOS_TIPOS: TipoValorOperacional[] = [
    'VENTA_NORMAL',
    'VENTA_MAYOREO',
    'VENTA_FRECUENTE',
    'VENTA_PROMOCION',
  ]

  interface FormularioNuevo {
    nodoId: string
    tipo: TipoValorOperacional
    valor: string
    condicionMinima: string
    vigenciaDesde: string
    vigenciaHasta: string
  }

  interface FormularioEdicion {
    id: string
    nodoId: string
    valor: string
    condicionMinima: string
    vigenciaHasta: string
    estado: EstadoValorOperacional
  }

  const [valoresPorNodo, setValoresPorNodo] = useState<Record<string, ValorOperacionalFarmacia[]>>({})
  const [cargando, setCargando] = useState<boolean>(true)
  const [guardando, setGuardando] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [formularioNuevo, setFormularioNuevo] = useState<FormularioNuevo | null>(null)
  const [formularioEdicion, setFormularioEdicion] = useState<FormularioEdicion | null>(null)

  const nodosVendibles = nodos.filter((nodo) => nodo.esVendible)

  const cargarTodosLosValores = useCallback(async (): Promise<void> => {
    try {
      const resultados = await Promise.all(nodosVendibles.map((nodo) => obtenerValoresNodo(nodo.id)))
      const valoresCargados: Record<string, ValorOperacionalFarmacia[]> = {}
      nodosVendibles.forEach((nodo, index) => {
        valoresCargados[nodo.id] = resultados[index]
      })
      setValoresPorNodo(valoresCargados)
    } catch (cargaError) {
      setError(cargaError instanceof Error ? cargaError.message : String(cargaError))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargarTodosLosValores()
  }, [cargarTodosLosValores])

  function tiposDisponibles(nodoId: string): TipoValorOperacional[] {
    const tiposExistentes = (valoresPorNodo[nodoId] ?? []).map((valor) => valor.tipo)
    return TODOS_LOS_TIPOS.filter((tipo) => !tiposExistentes.includes(tipo))
  }

  const onAbrirFormularioNuevo = useCallback((nodoId: string): void => {
    const disponibles = tiposDisponibles(nodoId)
    if (disponibles.length === 0) return
    setFormularioNuevo({
      nodoId,
      tipo: disponibles[0],
      valor: '',
      condicionMinima: '',
      vigenciaDesde: new Date().toISOString().slice(0, 10),
      vigenciaHasta: '',
    })
    setFormularioEdicion(null)
  }, [valoresPorNodo])

  const onAbrirFormularioEdicion = useCallback((v: ValorOperacionalFarmacia): void => {
    setFormularioEdicion({
      id: v.id,
      nodoId: v.nodoId,
      valor: v.valor.toString(),
      condicionMinima: (v.condicionCantidadMinima ?? '').toString(),
      vigenciaHasta: v.vigenciaHasta ?? '',
      estado: v.estado,
    })
    setFormularioNuevo(null)
  }, [])

  const onCancelar = useCallback((): void => {
    setFormularioNuevo(null)
    setFormularioEdicion(null)
  }, [])

  const onGuardarNuevo = useCallback(async (): Promise<void> => {
    if (formularioNuevo === null) return
    const valor = parseFloat(formularioNuevo.valor)
    if (Number.isNaN(valor) || valor <= 0) return
    const input: CrearValorOperacionalInput = {
      nodoId: formularioNuevo.nodoId,
      tipo: formularioNuevo.tipo,
      valor,
      condicionCantidadMinima:
        formularioNuevo.tipo === 'VENTA_MAYOREO' && formularioNuevo.condicionMinima !== ''
          ? parseFloat(formularioNuevo.condicionMinima)
          : undefined,
      vigenciaDesde: formularioNuevo.vigenciaDesde,
      vigenciaHasta: formularioNuevo.vigenciaHasta || undefined,
    }
    setGuardando(true)
    try {
      await crearValorOperacional(input)
      const nodoSincronizado = nodos.find((nodo) => nodo.id === formularioNuevo.nodoId)
      if (nodoSincronizado !== undefined) {
        try {
          sincronizarValorOperacionalFarmacia(nodoSincronizado, {
            tipo: formularioNuevo.tipo,
            valor,
            moneda: 'PEN',
            condicionCantidadMinima:
              formularioNuevo.tipo === 'VENTA_MAYOREO' && formularioNuevo.condicionMinima !== ''
                ? parseFloat(formularioNuevo.condicionMinima)
                : undefined,
            vigenciaDesde: formularioNuevo.vigenciaDesde,
            vigenciaHasta: formularioNuevo.vigenciaHasta || undefined,
            estado: 'ACTIVO',
          })
        } catch (errorSincronizacion) {
          console.error('No se pudo sincronizar el precio de farmacia con el catálogo de ventas:', errorSincronizacion)
        }
      }
      setFormularioNuevo(null)
      const valores = await obtenerValoresNodo(formularioNuevo.nodoId)
      setValoresPorNodo((actuales) => ({ ...actuales, [formularioNuevo.nodoId]: valores }))
    } catch (guardarError) {
      setError(guardarError instanceof Error ? guardarError.message : String(guardarError))
    } finally {
      setGuardando(false)
    }
  }, [formularioNuevo, nodos])

  const onGuardarEdicion = useCallback(async (): Promise<void> => {
    if (formularioEdicion === null) return
    const valor = parseFloat(formularioEdicion.valor)
    if (Number.isNaN(valor) || valor <= 0) return
    const valorExistente = (valoresPorNodo[formularioEdicion.nodoId] ?? []).find(
      (valorNodo) => valorNodo.id === formularioEdicion.id,
    )
    const input: ModificarValorOperacionalInput = {
      id: formularioEdicion.id,
      valor,
      condicionCantidadMinima:
        valorExistente?.tipo === 'VENTA_MAYOREO' && formularioEdicion.condicionMinima !== ''
          ? parseFloat(formularioEdicion.condicionMinima)
          : undefined,
      vigenciaHasta: formularioEdicion.vigenciaHasta || undefined,
      estado: formularioEdicion.estado,
    }
    setGuardando(true)
    try {
      await modificarValorOperacional(input)
      const nodoSincronizado = nodos.find((nodo) => nodo.id === formularioEdicion.nodoId)
      if (nodoSincronizado !== undefined && valorExistente !== undefined) {
        try {
          sincronizarValorOperacionalFarmacia(nodoSincronizado, {
            tipo: valorExistente.tipo,
            valor,
            moneda: 'PEN',
            condicionCantidadMinima:
              valorExistente.tipo === 'VENTA_MAYOREO' && formularioEdicion.condicionMinima !== ''
                ? parseFloat(formularioEdicion.condicionMinima)
                : undefined,
            vigenciaDesde: valorExistente.vigenciaDesde,
            vigenciaHasta: formularioEdicion.vigenciaHasta || undefined,
            estado: formularioEdicion.estado,
          })
        } catch (errorSincronizacion) {
          console.error('No se pudo sincronizar el precio de farmacia con el catálogo de ventas:', errorSincronizacion)
        }
      }
      setFormularioEdicion(null)
      const valores = await obtenerValoresNodo(formularioEdicion.nodoId)
      setValoresPorNodo((actuales) => ({ ...actuales, [formularioEdicion.nodoId]: valores }))
    } catch (guardarError) {
      setError(guardarError instanceof Error ? guardarError.message : String(guardarError))
    } finally {
      setGuardando(false)
    }
  }, [formularioEdicion, nodos, valoresPorNodo])

  if (cargando) {
    return <div className="text-[13px] font-semibold text-[var(--dv-mod-abastecimiento)]">Cargando precios...</div>
  }

  if (error) {
    return <div className="text-[13px] text-[var(--dv-color-danger)]">{error}</div>
  }

  if (nodosVendibles.length === 0) {
    return <div className="text-[13px] text-[var(--dv-text-muted)]">Sin formas de venta configuradas</div>
  }

  return (
    <>
      <div className="flex items-start gap-3 mb-4 px-1">
        <div>
          <h2 className="text-[16px] font-bold text-[var(--dv-text-primary)]">{nombreProducto}</h2>
          <p className="text-[12px] font-semibold text-[var(--dv-text-secondary)]">{nombreFabricante}</p>
        </div>
      </div>
      <div className="space-y-4">
        {nodosVendibles.map((nodo) => {
          const valoresNodo = valoresPorNodo[nodo.id] ?? []
          const tiposNodoDisponibles = tiposDisponibles(nodo.id)
          const valorEnEdicion = valoresNodo.find((valor) => valor.id === formularioEdicion?.id)

          return (
            <article key={nodo.id} className="rounded-2xl border border-[var(--dv-border)] bg-[var(--dv-surface-panel)] p-4">
            <header className="flex justify-between items-center mb-3">
              <h3 className="text-[14px] font-bold text-[var(--dv-text-primary)]">{nodo.nombreFormaVenta}</h3>
              {tiposNodoDisponibles.length > 0 &&
                formularioNuevo?.nodoId !== nodo.id &&
                formularioEdicion?.nodoId !== nodo.id && (
                  <button
                    type="button"
                    onClick={() => onAbrirFormularioNuevo(nodo.id)}
                    disabled={guardando}
                    className="rounded-full border border-[var(--dv-mod-abastecimiento)] px-3 py-1 text-[11px] font-bold text-[var(--dv-mod-abastecimiento)]"
                  >
                    + Precio
                  </button>
                )}
            </header>

            {valoresNodo.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-2 py-2 border-b border-[var(--dv-border)] last:border-0">
                <div>
                  <div className="text-[12px] font-bold text-[var(--dv-text-primary)]">
                    {ETIQUETA_TIPO[v.tipo]}
                    {v.tipo === 'VENTA_FRECUENTE' && (
                      <span className="ml-2 text-[10px] font-semibold text-amber-600">
                        Aún no se aplica automáticamente en el cobro -- pendiente de integración con Clientes
                      </span>
                    )}
                  </div>
                  {v.tipo === 'VENTA_MAYOREO' && v.condicionCantidadMinima !== undefined && (
                    <div className="text-[11px] text-[var(--dv-text-muted)]">Mín. {v.condicionCantidadMinima} unidades</div>
                  )}
                  {v.tipo === 'VENTA_FRECUENTE' && (
                    <div className="text-[11px] text-[var(--dv-text-muted)]">Requiere cliente frecuente</div>
                  )}
                  {v.tipo === 'VENTA_PROMOCION' && v.vigenciaHasta && (
                    <div className="text-[11px] text-[var(--dv-text-muted)]">
                      {v.vigenciaDesde} - {v.vigenciaHasta}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[var(--dv-mod-abastecimiento)]">S/ {v.valor.toFixed(2)}</span>
                  {v.estado === 'INACTIVO' && (
                    <span className="text-[9px] bg-red-100 text-red-500 rounded px-1">INACTIVO</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onAbrirFormularioEdicion(v)}
                    disabled={guardando || formularioNuevo?.nodoId === nodo.id || formularioEdicion?.nodoId === nodo.id}
                    className="text-[11px] font-semibold text-[var(--dv-text-muted)] underline"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}

            {formularioNuevo?.nodoId === nodo.id && (
              <div className="mt-3 p-3 rounded-xl border border-[var(--dv-mod-abastecimiento-border)] bg-[var(--dv-mod-abastecimiento-bg)] space-y-2">
                <select
                  value={formularioNuevo.tipo}
                  onChange={(event) => setFormularioNuevo({ ...formularioNuevo, tipo: event.target.value as TipoValorOperacional })}
                  className="w-full rounded-lg border border-[var(--dv-input-border)] px-2 py-1.5 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                >
                  {tiposNodoDisponibles.map((tipo) => (
                    <option key={tipo} value={tipo}>{ETIQUETA_TIPO[tipo]}</option>
                  ))}
                </select>
                {formularioNuevo.tipo === 'VENTA_FRECUENTE' && (
                  <p className="text-[10px] font-semibold text-amber-600">
                    Aún no se aplica automáticamente en el cobro -- pendiente de integración con Clientes
                  </p>
                )}
                <input
                  type="number"
                  placeholder="Precio S/"
                  value={formularioNuevo.valor}
                  onChange={(event) => setFormularioNuevo({ ...formularioNuevo, valor: event.target.value })}
                  className="w-full rounded-lg border border-[var(--dv-input-border)] px-2 py-1.5 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                />
                {formularioNuevo.tipo === 'VENTA_MAYOREO' && (
                  <input
                    type="number"
                    placeholder="Cantidad mínima"
                    value={formularioNuevo.condicionMinima}
                    onChange={(event) => setFormularioNuevo({ ...formularioNuevo, condicionMinima: event.target.value })}
                    className="w-full rounded-lg border border-[var(--dv-input-border)] px-2 py-1.5 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                  />
                )}
                {formularioNuevo.tipo === 'VENTA_PROMOCION' && (
                  <input
                    type="date"
                    placeholder="Vigente hasta"
                    value={formularioNuevo.vigenciaHasta}
                    onChange={(event) => setFormularioNuevo({ ...formularioNuevo, vigenciaHasta: event.target.value })}
                    className="w-full rounded-lg border border-[var(--dv-input-border)] px-2 py-1.5 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void onGuardarNuevo()}
                    disabled={guardando}
                    className="rounded-lg bg-[var(--dv-mod-abastecimiento)] px-3 py-1.5 text-[12px] font-bold text-white"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={onCancelar}
                    className="rounded-lg border border-[var(--dv-border)] px-3 py-1.5 text-[12px] font-bold text-[var(--dv-text-secondary)]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {formularioEdicion?.nodoId === nodo.id && (
              <div className="mt-3 p-3 rounded-xl border border-[var(--dv-mod-abastecimiento-border)] bg-[var(--dv-mod-abastecimiento-bg)] space-y-2">
                <input
                  type="number"
                  value={formularioEdicion.valor}
                  onChange={(event) => setFormularioEdicion({ ...formularioEdicion, valor: event.target.value })}
                  className="w-full rounded-lg border border-[var(--dv-input-border)] px-2 py-1.5 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                />
                {valorEnEdicion?.tipo === 'VENTA_MAYOREO' && (
                  <input
                    type="number"
                    placeholder="Cantidad mínima"
                    value={formularioEdicion.condicionMinima}
                    onChange={(event) => setFormularioEdicion({ ...formularioEdicion, condicionMinima: event.target.value })}
                    className="w-full rounded-lg border border-[var(--dv-input-border)] px-2 py-1.5 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                  />
                )}
                {valorEnEdicion?.tipo === 'VENTA_PROMOCION' && (
                  <input
                    type="date"
                    value={formularioEdicion.vigenciaHasta}
                    onChange={(event) => setFormularioEdicion({ ...formularioEdicion, vigenciaHasta: event.target.value })}
                    className="w-full rounded-lg border border-[var(--dv-input-border)] px-2 py-1.5 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                  />
                )}
                <select
                  value={formularioEdicion.estado}
                  onChange={(event) => setFormularioEdicion({ ...formularioEdicion, estado: event.target.value as EstadoValorOperacional })}
                  className="w-full rounded-lg border border-[var(--dv-input-border)] px-2 py-1.5 text-[12px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)]"
                >
                  <option value="ACTIVO">Activa</option>
                  <option value="INACTIVO">Inactiva</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void onGuardarEdicion()}
                    disabled={guardando}
                    className="rounded-lg bg-[var(--dv-mod-abastecimiento)] px-3 py-1.5 text-[12px] font-bold text-white"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={onCancelar}
                    className="rounded-lg border border-[var(--dv-border)] px-3 py-1.5 text-[12px] font-bold text-[var(--dv-text-secondary)]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            </article>
          )
        })}
      </div>
    </>
  )
}

export function DetalleProducto({
  producto,
  productoPreview,
  productoConfirmado,
  presentaciones,
  nodos,
  vistaActiva,
  cargando,
  onIrADetalle,
  onIrAPresentaciones,
  onIrAPrecios,
  onActualizarProductoSeleccionado,
  onNavegaAIngresos,
  onLimpiar,
}: DetalleProductoProps): ReactElement {
  const { activeOperator } = usePOS()
  const esAdmin = activeOperator?.codigoRol === 'ADMIN'
  const [modo, setModo] = useState<ModoDetalle>('lectura')
  const [tieneHistorial, setTieneHistorial] = useState<boolean>(false)
  const [verificandoHistorial, setVerificandoHistorial] = useState<boolean>(false)
  const [guardandoCambios, setGuardandoCambios] = useState<boolean>(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [formularioCorreccion, setFormularioCorreccion] = useState<ModificarProductoComercialInput | null>(null)
  const [formularioOperacional, setFormularioOperacional] = useState<{ condicionVenta: string; requiereLote: boolean; requiereCadenaFrio: boolean } | null>(null)
  const [motivoOperacional, setMotivoOperacional] = useState<string>('')
  const [indiceAccion, setIndiceAccion] = useState<number>(-1)
  const [principiosSeleccionadosIds, setPrincipiosSeleccionadosIds] = useState<string[]>([])

  useEffect(() => {
    setIndiceAccion(-1)
    setModo('lectura')
    setErrorAccion(null)
    setFormularioCorreccion(null)
    if (producto) {
      setVerificandoHistorial(true)
      verificarHistorialProducto(producto.id)
        .then(tiene => setTieneHistorial(tiene))
        .catch(() => setTieneHistorial(false))
        .finally(() => setVerificandoHistorial(false))
    }
  }, [producto.id])

  useEffect(() => {
    setIndiceAccion(productoConfirmado ? 0 : -1)
  }, [productoConfirmado])

  useEffect(() => {
    document.dispatchEvent(new CustomEvent('pos:detalleActivo', { detail: { active: productoConfirmado } }))
  }, [productoConfirmado])

  useEffect(() => {
    document.dispatchEvent(new CustomEvent('pos:modoDetalle', { detail: { modo } }))
  }, [modo])

  const onIniciarCorreccion = (): void => {
    setFormularioCorreccion({
      id: producto.id,
      nombreComercial: producto.nombreComercial,
      nombreFabricante: producto.nombreFabricante,
      nombreTitular: producto.nombreTitular,
      paisOrigen: producto.paisOrigen,
      registroSanitario: producto.registroSanitario,
      estadoRegistroSanitario: producto.estadoRegistroSanitario,
      codigoDIGEMID: producto.codigoDIGEMID,
      codigoInterno: producto.codigoInterno,
    })
    setModo('corrigiendo')
    setFormularioOperacional({ condicionVenta: producto.condicionVenta, requiereLote: producto.requiereLote, requiereCadenaFrio: producto.requiereCadenaFrio })
    setMotivoOperacional('')
    setErrorAccion(null)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        if (modo === 'corrigiendo') {
          setModo('lectura')
          setFormularioCorreccion(null)
          setFormularioOperacional(null)
          setMotivoOperacional('')
        } else if (modo === 'desactivando') {
          setModo('lectura')
        } else if (modo === 'lectura') {
          onLimpiar()
        }
      } else if (productoConfirmado && modo === 'lectura' && vistaActiva === 'detalle' && event.key === 'ArrowRight') {
        event.preventDefault()
        setIndiceAccion(prev => (prev + 1) % 2)
      } else if (productoConfirmado && modo === 'lectura' && vistaActiva === 'detalle' && event.key === 'ArrowLeft') {
        event.preventDefault()
        setIndiceAccion(prev => (prev - 1 + 2) % 2)
      } else if (productoConfirmado && modo === 'lectura' && event.altKey && event.key === 'e') {
        event.preventDefault()
        onIrAPresentaciones()
      } else if (productoConfirmado && modo === 'lectura' && event.altKey && event.key === 'r') {
        event.preventDefault()
        onIrAPrecios()
      } else if (productoConfirmado && event.ctrlKey && event.key === 'Enter' && producto.estado === 'ACTIVO' && modo === 'lectura') {
        event.preventDefault()
        onIniciarCorreccion()
      } else if (productoConfirmado && event.ctrlKey && event.key === 'Insert' && producto.estado === 'ACTIVO' && modo === 'lectura') {
        event.preventDefault()
        onNavegaAIngresos()
      } else if (productoConfirmado && event.ctrlKey && event.key === 'Delete' && producto.estado === 'ACTIVO' && modo === 'lectura') {
        event.preventDefault()
        setModo('desactivando')
      } else if (productoConfirmado && modo === 'lectura' && vistaActiva === 'detalle' && indiceAccion >= 0 && event.key === 'Enter') {
        event.preventDefault()
        switch (indiceAccion) {
          case 0:
            if (producto.estado === 'ACTIVO') onIniciarCorreccion()
            break
          case 1:
            if (producto.estado === 'ACTIVO') setModo('desactivando')
            break
        }
      } else if (modo === 'corrigiendo' && event.ctrlKey && event.key === 'Enter') {
        event.preventDefault()
        void onGuardarCorreccion()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [modo, onLimpiar, productoConfirmado, vistaActiva, onIniciarCorreccion, onNavegaAIngresos, onIrAPresentaciones, onIrAPrecios, indiceAccion, producto.estado, onGuardarCorreccion])

  async function onGuardarCorreccion(): Promise<void> {
    if (!formularioCorreccion) return
    const hayCambioOperacional = formularioOperacional !== null && (formularioOperacional.condicionVenta !== producto.condicionVenta || formularioOperacional.requiereLote !== producto.requiereLote || formularioOperacional.requiereCadenaFrio !== producto.requiereCadenaFrio)
    if (hayCambioOperacional && motivoOperacional.trim() === '') {
      setErrorAccion('Los cambios en condicion de venta refrigeracion o vencimiento requieren un motivo. Escribelo y guarda de nuevo')
      return
    }
    setGuardandoCambios(true)
    setErrorAccion(null)
    try {
      if (principiosSeleccionadosIds.length > 0) {
        await asignarPrincipiosAProducto({
          productoGenericoId: producto.productoGenericoId,
          principioActivoIds: principiosSeleccionadosIds,
          operadorId: activeOperator?.id ?? '',
          motivo: tieneHistorial ? motivoOperacional.trim() || undefined : undefined,
        })
      }
      await modificarProductoComercial(formularioCorreccion)
      if (hayCambioOperacional && formularioOperacional !== null && activeOperator) {
        const input: CorregirDatosOperacionalesInput = {
          id: producto.id,
          condicionVenta: formularioOperacional.condicionVenta as any,
          requiereLote: formularioOperacional.requiereLote,
          requiereCadenaFrio: formularioOperacional.requiereCadenaFrio,
          motivo: motivoOperacional.trim(),
          operadorId: activeOperator.id,
        }
        await corregirDatosOperacionales(input)
      }
      const productoActualizado: ProductoComercial = { ...producto, ...formularioCorreccion, ...(hayCambioOperacional && formularioOperacional !== null ? { condicionVenta: formularioOperacional.condicionVenta as any, requiereLote: formularioOperacional.requiereLote, requiereCadenaFrio: formularioOperacional.requiereCadenaFrio } : {}) }
      onActualizarProductoSeleccionado(productoActualizado)
      setModo('lectura')
      setFormularioCorreccion(null)
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : String(e))
    } finally {
      setGuardandoCambios(false)
    }
  }

  const onConfirmarDesactivar = async (): Promise<void> => {
    setGuardandoCambios(true)
    setErrorAccion(null)
    try {
      retirarHovsDeProducto(producto.id)
      await desactivarProductoComercial(producto.id)
      const productoActualizado: ProductoComercial = { ...producto, estado: 'INACTIVO' }
      onActualizarProductoSeleccionado(productoActualizado)
      setModo('lectura')
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : String(e))
    } finally {
      setGuardandoCambios(false)
    }
  }

  const onConfirmarEliminarFisico = async (): Promise<void> => {
    setGuardandoCambios(true)
    setErrorAccion(null)
    try {
      retirarHovsDeProducto(producto.id)
      await eliminarProductoComercialFisico(producto.id)
      setModo('lectura')
      onLimpiar()
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : String(e))
    } finally {
      setGuardandoCambios(false)
    }
  }

  const onReactivar = async (): Promise<void> => {
    setGuardandoCambios(true)
    setErrorAccion(null)
    try {
      reactivarHovsDeProducto(producto.id)
      await reactivarProductoComercial(producto.id)
      const productoActualizado: ProductoComercial = { ...producto, estado: 'ACTIVO' }
      onActualizarProductoSeleccionado(productoActualizado)
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : String(e))
    } finally {
      setGuardandoCambios(false)
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-4 px-5 py-4 overflow-auto flex-1">
        {errorAccion !== null && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--dv-color-danger-border)] bg-[var(--dv-color-danger-bg)] px-3 py-2 text-[12px] text-[var(--dv-color-danger)]">
            <span>{errorAccion}</span>
            <button type="button" onClick={() => setErrorAccion(null)}>X</button>
          </div>
        )}

        {modo === 'desactivando' && (
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--dv-color-danger-border)] bg-[var(--dv-color-danger-bg)] px-4 py-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h2 className="text-[15px] font-bold text-[var(--dv-text-primary)]">
                  {[producto.nombreComercial, producto.concentracion, producto.formaFarmaceutica].filter(Boolean).join(' · ')}
                </h2>
                <p className="text-[12px] font-semibold text-[var(--dv-text-secondary)]">{producto.nombreFabricante}</p>
                <p className="text-[10px] text-[var(--dv-text-muted)]">
                  Creado {formatearFecha(producto.creadoEn)} · Modificado {formatearFecha(producto.modificadoEn)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {producto.estado === 'ACTIVO' ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">ACTIVO</span>
                ) : (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">INACTIVO</span>
                )}
              </div>
            </div>
            {tieneHistorial ? (
              <p className="text-[13px] font-semibold text-[var(--dv-text-primary)]">
                Vas a dar de baja «{producto.nombreComercial}». El producto quedará INACTIVO y no aparecerá en
                búsquedas ni ventas. El historial se conserva.
              </p>
            ) : (
              <p className="text-[13px] font-semibold text-[var(--dv-text-primary)]">
                Vas a eliminar definitivamente «{producto.nombreComercial}». No tiene movimientos ni lotes
                registrados — se borra por completo y no se puede deshacer.
              </p>
            )}
          </div>
        )}

        {(modo === 'lectura' || modo === 'corrigiendo') && productoPreview === null && (
          <>
            {cargando && <p className="text-[13px] font-semibold text-[var(--dv-mod-abastecimiento)]">Cargando...</p>}
            {!cargando && vistaActiva === 'detalle' && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="text-[16px] font-bold text-[var(--dv-text-primary)]">
                      {[producto.nombreComercial, producto.concentracion, producto.formaFarmaceutica]
                        .filter(Boolean)
                        .join(' · ')}
                    </h2>
                    <p className="text-[12px] font-semibold text-[var(--dv-text-secondary)]">{producto.nombreFabricante}</p>
                    <p className="text-[10px] text-[var(--dv-text-muted)]">
                      Creado {formatearFecha(producto.creadoEn)} · Modificado {formatearFecha(producto.modificadoEn)}
                    </p>
                    {producto.estado === 'INACTIVO' && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                        INACTIVO
                      </span>
                    )}
                  </div>
                  {modo === 'lectura' ? (
                    <div className="flex flex-col items-end gap-1 overflow-visible"><div className="flex gap-2">{producto.estado === 'ACTIVO' && (<button type="button" onClick={onIniciarCorreccion} disabled={guardandoCambios || verificandoHistorial} className={indiceAccion === 0 ? 'group relative rounded-xl border border-[var(--dv-color-confirm)] bg-[var(--dv-mod-abastecimiento-bg)] px-4 py-2 text-[12px] font-bold text-[var(--dv-color-confirm)] flex items-center gap-3' : 'group relative rounded-xl border border-[var(--dv-mod-abastecimiento-border)] px-4 py-2 text-[12px] font-bold text-[var(--dv-color-confirm)] hover:bg-[var(--dv-mod-abastecimiento-bg)] flex items-center gap-3'}><span>CORREGIR</span><kbd className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#fef08a] bg-[#fefce8] px-2 py-1 text-[11px] font-bold leading-none text-[#713f12] opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">Ctrl+Enter</kbd></button>)}{producto.estado === 'ACTIVO' && (<button type="button" onClick={() => setModo('desactivando')} disabled={guardandoCambios} className={indiceAccion === 1 ? 'group relative rounded-xl border border-[var(--dv-color-danger)] bg-[var(--dv-color-danger-bg)] px-4 py-2 text-[12px] font-bold text-[var(--dv-color-danger)] flex items-center gap-3' : 'group relative rounded-xl border border-[var(--dv-color-danger-border)] px-4 py-2 text-[12px] font-bold text-[var(--dv-color-danger)] flex items-center gap-3'}><span>DESACTIVAR</span><kbd className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#fef08a] bg-[#fefce8] px-2 py-1 text-[11px] font-bold leading-none text-[#713f12] opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">Ctrl+Supr</kbd></button>)}{producto.estado === 'INACTIVO' && (esAdmin ? (<button type="button" onClick={() => void onReactivar()} disabled={guardandoCambios} className="w-fit rounded-xl bg-[var(--dv-color-confirm)] px-4 py-2 text-[12px] font-bold text-white hover:bg-[var(--dv-color-confirm)] disabled:opacity-50">REACTIVAR</button>) : (<p className="text-[11px] text-[var(--dv-text-muted)]">Solo un administrador puede reactivar este producto</p>))}</div><button type="button" onClick={onNavegaAIngresos} className="group relative self-end text-[11px] font-bold text-[var(--dv-mod-abastecimiento)] underline">Ir a INGRESOS para registrar un nuevo lote →<kbd className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#fef08a] bg-[#fefce8] px-2 py-1 text-[11px] font-bold leading-none text-[#713f12] opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">Ctrl+Insert</kbd></button></div>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      {producto.estado === 'ACTIVO' ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">ACTIVO</span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">INACTIVO</span>
                      )}
                      {tieneHistorial && (
                        <span className="text-[10px] text-amber-600 font-semibold text-right">Producto con movimientos registrados. Registro de cambios en historial.</span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">
                    PARA LA VENTA
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {modo === 'corrigiendo' && formularioCorreccion !== null && !tieneHistorial ? (
                      <div className="rounded-xl border border-[var(--dv-border)] bg-[var(--dv-input-bg)] px-3 py-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">{LABEL_CAMPO['condicionVenta'].catalogo}</span>
                        <ComboboxFiltrado
                          opciones={[
                            { valor: 'SIN_RECETA', etiqueta: 'Sin receta' },
                            { valor: 'CON_RECETA', etiqueta: 'Con receta' },
                            { valor: 'CONTROLADO', etiqueta: 'Controlado' },
                          ]}
                          valor={formularioOperacional?.condicionVenta ?? producto.condicionVenta}
                          onChange={(v) => setFormularioOperacional(prev => prev ? { ...prev, condicionVenta: v } : prev)}
                          disabled={guardandoCambios}
                          className="mt-1"
                        />
                      </div>
                    ) : (
                      <CampoLectura
                        label={LABEL_CAMPO['condicionVenta'].catalogo}
                        valor={LABEL_CONDICION_VENTA[producto.condicionVenta] ?? producto.condicionVenta}
                      />
                    )}
                    {modo === 'corrigiendo' && formularioCorreccion !== null && !tieneHistorial ? (
                      <div className="rounded-xl border border-[var(--dv-border)] bg-[var(--dv-input-bg)] px-3 py-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Refrigerar</span>
                        <ComboboxFiltrado
                          opciones={[
                            { valor: '0', etiqueta: 'No requiere' },
                            { valor: '1', etiqueta: 'Sí · requiere frío' },
                          ]}
                          valor={formularioOperacional?.requiereCadenaFrio ? '1' : '0'}
                          onChange={(v) => setFormularioOperacional(prev => prev ? { ...prev, requiereCadenaFrio: v === '1' } : prev)}
                          disabled={guardandoCambios}
                          className="mt-1"
                        />
                      </div>
                    ) : (
                      <CampoLectura
                        label="Refrigerar"
                        valor={producto.requiereCadenaFrio ? 'Sí · cadena de frío' : 'No requiere'}
                      />
                    )}
                    {modo === 'corrigiendo' && formularioCorreccion !== null && !tieneHistorial ? (
                      <div className="rounded-xl border border-[var(--dv-border)] bg-[var(--dv-input-bg)] px-3 py-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Con vencimiento</span>
                        <ComboboxFiltrado
                          opciones={[
                            { valor: '0', etiqueta: 'Sin trazabilidad' },
                            { valor: '1', etiqueta: 'Sí · requiere lote' },
                          ]}
                          valor={formularioOperacional?.requiereLote ? '1' : '0'}
                          onChange={(v) => setFormularioOperacional(prev => prev ? { ...prev, requiereLote: v === '1' } : prev)}
                          disabled={guardandoCambios}
                          className="mt-1"
                        />
                      </div>
                    ) : (
                      <CampoLectura
                        label="Con vencimiento"
                        valor={producto.requiereLote ? 'Sí · requiere lote' : 'Sin trazabilidad de lote'}
                      />
                    )}
                    <CampoLectura label="Categoría" valor={categoriaProducto(producto)} />
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">
                    IDENTIDAD DEL PRODUCTO
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {modo === 'corrigiendo' && formularioCorreccion !== null ? (
                      <>
                        <CampoLectura label="CODIGO INTERNO" valor={producto.codigoInterno} />
                        <label className="rounded-xl border border-[var(--dv-border)] bg-[var(--dv-input-bg)] px-3 py-2">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">NOMBRE COMERCIAL</span>
                          <input
                            value={formularioCorreccion.nombreComercial}
                            onChange={(e) => setFormularioCorreccion(prev => prev ? { ...prev, nombreComercial: e.target.value } : prev)}
                            className="mt-1 h-[28px] w-full rounded-lg border border-[var(--dv-input-border)] px-2 text-[11px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)] bg-[var(--dv-input-bg)]"
                          />
                        </label>
                        <CampoLectura
                          label={LABEL_CAMPO['concentracion'].catalogo}
                          valor={producto.concentracion}
                        />
                        <CampoLectura
                          label={LABEL_CAMPO['formaFarmaceutica'].catalogo}
                          valor={LABEL_FORMA_FARMACEUTICA[producto.formaFarmaceutica ?? ''] ?? producto.formaFarmaceutica}
                        />
                      </>
                    ) : (
                      <>
                        <CampoLectura label={LABEL_CAMPO['ifa'].catalogo} valor={producto.ifa} />
                        <CampoLectura
                          label={LABEL_CAMPO['concentracion'].catalogo}
                          valor={producto.concentracion}
                        />
                        <CampoLectura
                          label={LABEL_CAMPO['formaFarmaceutica'].catalogo}
                          valor={LABEL_FORMA_FARMACEUTICA[producto.formaFarmaceutica ?? ''] ?? producto.formaFarmaceutica}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">
                    REGISTRO Y PROCEDENCIA
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {modo === 'corrigiendo' && formularioCorreccion !== null ? (
                      <>
                        <label className="rounded-xl border border-[var(--dv-border)] bg-[var(--dv-input-bg)] px-3 py-2">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">{LABEL_CAMPO['nombreFabricante'].catalogo}</span>
                          <input
                            value={formularioCorreccion.nombreFabricante}
                            onChange={(e) => setFormularioCorreccion(prev => prev ? { ...prev, nombreFabricante: e.target.value } : prev)}
                            className="mt-1 h-[28px] w-full rounded-lg border border-[var(--dv-input-border)] px-2 text-[11px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)] bg-[var(--dv-input-bg)]"
                          />
                        </label>
                        <label className="rounded-xl border border-[var(--dv-border)] bg-[var(--dv-input-bg)] px-3 py-2">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Registro sanitario</span>
                          {esAdmin ? (
                            <input
                              value={formularioCorreccion.registroSanitario ?? ''}
                              onChange={(e) => setFormularioCorreccion(prev => prev ? { ...prev, registroSanitario: e.target.value } : prev)}
                              className="mt-1 h-[28px] w-full rounded-lg border border-[var(--dv-input-border)] px-2 text-[11px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)] bg-[var(--dv-input-bg)]"
                            />
                          ) : (
                            <input readOnly value={formularioCorreccion.registroSanitario ?? ''} className="mt-1 h-[28px] w-full cursor-not-allowed rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-surface-field)] px-2 text-[11px] font-semibold text-[var(--dv-text-muted)]" />
                          )}
                        </label>
                        <label className="rounded-xl border border-[var(--dv-border)] bg-[var(--dv-input-bg)] px-3 py-2">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Estado del registro</span>
                          {esAdmin ? (
                            <ComboboxFiltrado
                              opciones={[
                                { valor: 'VIGENTE', etiqueta: 'Vigente' },
                                { valor: 'SUSPENDIDO', etiqueta: 'Suspendido' },
                                { valor: 'CANCELADO', etiqueta: 'Cancelado' },
                                { valor: 'VENCIDO', etiqueta: 'Vencido' },
                              ]}
                              valor={formularioCorreccion.estadoRegistroSanitario ?? 'VIGENTE'}
                              onChange={(v) => setFormularioCorreccion(prev => prev ? { ...prev, estadoRegistroSanitario: v as EstadoRegistroSanitario } : prev)}
                              disabled={guardandoCambios}
                              className="mt-1"
                            />
                          ) : (
                            <input readOnly value={formularioCorreccion.estadoRegistroSanitario ?? ''} className="mt-1 h-[28px] w-full cursor-not-allowed rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-surface-field)] px-2 text-[11px] font-semibold text-[var(--dv-text-muted)]" />
                          )}
                        </label>
                        <label className="rounded-xl border border-[var(--dv-border)] bg-[var(--dv-input-bg)] px-3 py-2">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">Codigo DIGEMID</span>
                          {esAdmin ? (
                            <input
                              value={formularioCorreccion.codigoDIGEMID ?? ''}
                              onChange={(e) => setFormularioCorreccion(prev => prev ? { ...prev, codigoDIGEMID: e.target.value } : prev)}
                              maxLength={20}
                              className="mt-1 h-[28px] w-full rounded-lg border border-[var(--dv-input-border)] px-2 text-[11px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)] bg-[var(--dv-input-bg)]"
                            />
                          ) : (
                            <input readOnly value={formularioCorreccion.codigoDIGEMID ?? ''} className="mt-1 h-[28px] w-full cursor-not-allowed rounded-lg border border-[var(--dv-input-border)] bg-[var(--dv-surface-field)] px-2 text-[11px] font-semibold text-[var(--dv-text-muted)]" />
                          )}
                        </label>
                      </>
                    ) : (
                      <>
                        <CampoLectura label={LABEL_CAMPO['nombreFabricante'].catalogo} valor={producto.nombreFabricante} />
                        <CampoLectura label="Registro sanitario" valor={producto.registroSanitario} />
                        <CampoLectura
                          label="Estado del registro"
                          valor={
                            producto.estadoRegistroSanitario === 'VIGENTE'
                              ? 'Vigente'
                              : producto.estadoRegistroSanitario === 'SUSPENDIDO'
                                ? 'Suspendido'
                                : producto.estadoRegistroSanitario === 'CANCELADO'
                                  ? 'Cancelado'
                                  : producto.estadoRegistroSanitario === 'VENCIDO'
                                    ? 'Vencido'
                                    : producto.estadoRegistroSanitario
                          }
                        />
                        {esAdmin && <CampoLectura label="Codigo DIGEMID" valor={producto.codigoDIGEMID} />}
                      </>
                    )}
                  </div>
                </div>

                {modo === 'corrigiendo' && formularioCorreccion !== null && (
                  <>
                    {tieneHistorial ? (
                      <CampoLectura label={LABEL_CAMPO['ifa'].catalogo} valor={producto.ifa} />
                    ) : (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">IFA / PRINCIPIO ACTIVO</span>
                        <SelectorPrincipiosActivos
                          productoGenericoId={producto.productoGenericoId}
                          tieneHistorial={tieneHistorial}
                          operadorId={activeOperator?.id ?? ''}
                          onCambio={(ids) => setPrincipiosSeleccionadosIds(ids)}
                          motivo={motivoOperacional}
                          disabled={guardandoCambios}
                        />
                      </div>
                    )}
                    {formularioOperacional !== null && (formularioOperacional.condicionVenta !== producto.condicionVenta || formularioOperacional.requiereLote !== producto.requiereLote || formularioOperacional.requiereCadenaFrio !== producto.requiereCadenaFrio) && (
                      <label>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">MOTIVO DE CORRECCION</span>
                        <input
                          type="text"
                          value={motivoOperacional}
                          onChange={(e) => setMotivoOperacional(e.target.value)}
                          placeholder="Describe el motivo de esta correccion"
                          className="h-[34px] w-full rounded-lg border border-[var(--dv-input-border)] px-3 text-[13px] font-semibold text-[var(--dv-text-primary)] outline-none focus:border-[var(--dv-input-border-focus)] bg-[var(--dv-input-bg)]"
                        />
                      </label>
                    )}
                    {!esAdmin && (
                      <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">Solo administradores pueden modificar datos de registro sanitario</p>
                    )}
                  </>
                )}

                {modo === 'lectura' && (
                  <div>
                    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--dv-text-muted)]">
                      PRESENTACIONES COMERCIALES
                    </h3>
                    {presentaciones.length > 0 ? (
                      <div className="space-y-2">
                        {presentaciones.map((presentacion) => (
                          <div key={presentacion.id} className="rounded-xl border border-[var(--dv-border)] bg-[var(--dv-surface-panel)] px-4 py-3">
                            <div className="text-[13px] font-bold text-[var(--dv-text-primary)]">{presentacion.descripcion}</div>
                            {presentacion.codigoBarras && (
                              <div className="text-[11px] text-[var(--dv-text-secondary)]">Cód. barras {presentacion.codigoBarras}</div>
                            )}
                            <div className="text-[11px] text-[var(--dv-text-secondary)]">
                              Stock mínimo {presentacion.stockMinimo} {presentacion.unidadConteo}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[13px] text-[var(--dv-text-muted)]">Sin presentaciones registradas</p>
                    )}
                  </div>
                )}
              </div>
            )}
            {!cargando && vistaActiva === 'presentaciones' && <PresentacionesTab producto={producto} presentaciones={presentaciones} nodos={nodos} nombreProducto={[producto.nombreComercial, producto.concentracion, producto.formaFarmaceutica].filter(Boolean).join(' · ')} nombreFabricante={producto.nombreFabricante} />}
            {!cargando && vistaActiva === 'precios' && <PreciosTab nodos={nodos} nombreProducto={[producto.nombreComercial, producto.concentracion, producto.formaFarmaceutica].filter(Boolean).join(' · ')} nombreFabricante={producto.nombreFabricante} />}
          </>
        )}
      </div>
      {modo === 'corrigiendo' && (
        <div className="shrink-0 flex justify-end gap-2 px-5 pb-4">
          <button type="button" onClick={() => { onIrADetalle(); setModo('lectura'); setFormularioCorreccion(null); setFormularioOperacional(null); setMotivoOperacional('') }} className="group relative rounded-xl border border-[var(--dv-color-exit-border)] px-4 py-2 text-[12px] font-bold text-[var(--dv-color-exit)] hover:bg-[var(--dv-color-exit-bg)]">VOLVER<kbd className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#fef08a] bg-[#fefce8] px-2 py-1 text-[11px] font-bold leading-none text-[#713f12] opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">Esc</kbd></button>
          <button
            type="button"
            onClick={() => void onGuardarCorreccion()}
            disabled={guardandoCambios}
            className="group relative rounded-xl bg-[var(--dv-color-confirm)] px-4 py-2 text-[12px] font-bold text-white hover:bg-[var(--dv-color-confirm)] disabled:opacity-50"
          >
            GUARDAR CORRECCION<kbd className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#fef08a] bg-[#fefce8] px-2 py-1 text-[11px] font-bold leading-none text-[#713f12] opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">Ctrl+Enter</kbd>
          </button>
        </div>
      )}
      {modo === 'desactivando' && (
        <div className="shrink-0 flex justify-end gap-2 px-5 pb-4">
          <button type="button" onClick={() => { onIrADetalle(); setModo('lectura') }} className="group relative rounded-xl border border-[var(--dv-color-exit-border)] px-4 py-2 text-[12px] font-bold text-[var(--dv-color-exit)] hover:bg-[var(--dv-color-exit-bg)]">VOLVER<kbd className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#fef08a] bg-[#fefce8] px-2 py-1 text-[11px] font-bold leading-none text-[#713f12] opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">Esc</kbd></button>
          <button
            type="button"
            onClick={() => void (tieneHistorial ? onConfirmarDesactivar() : onConfirmarEliminarFisico())}
            disabled={guardandoCambios}
            className="group relative rounded-xl bg-[var(--dv-color-danger)] px-4 py-2 text-[12px] font-bold text-white hover:bg-[var(--dv-color-danger)] disabled:opacity-50"
          >
            {tieneHistorial ? 'CONFIRMAR BAJA' : 'ELIMINAR DEFINITIVAMENTE'}<kbd className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#fef08a] bg-[#fefce8] px-2 py-1 text-[11px] font-bold leading-none text-[#713f12] opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">Ctrl+Supr</kbd>
          </button>
        </div>
      )}
      {vistaActiva === 'detalle' && modo === 'lectura' && (
        <div className="shrink-0 flex justify-end gap-2 px-5 pb-4">
          <button type="button" onClick={onIrAPresentaciones} className="group relative px-5 rounded-xl border border-[var(--dv-mod-abastecimiento-border)] px-3 py-2 text-[12px] font-bold text-[var(--dv-mod-abastecimiento)] hover:bg-[var(--dv-mod-abastecimiento-bg)] flex items-center justify-center">PRESENTACIONES<kbd className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#fef08a] bg-[#fefce8] px-2 py-1 text-[11px] font-bold leading-none text-[#713f12] opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">Alt+E</kbd></button>
          <button type="button" onClick={onIrAPrecios} className="group relative px-5 rounded-xl border border-[var(--dv-mod-abastecimiento-border)] px-3 py-2 text-[12px] font-bold text-[var(--dv-mod-abastecimiento)] hover:bg-[var(--dv-mod-abastecimiento-bg)] flex items-center justify-center">PRECIOS<kbd className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#fef08a] bg-[#fefce8] px-2 py-1 text-[11px] font-bold leading-none text-[#713f12] opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">Alt+R</kbd></button>
          <button type="button" onClick={onLimpiar} className="group relative rounded-xl border border-[var(--dv-color-exit-border)] px-3 py-2 text-[12px] font-bold text-[var(--dv-color-exit)] hover:bg-[var(--dv-color-exit-bg)] flex items-center justify-center">LIMPIAR<kbd className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#fef08a] bg-[#fefce8] px-2 py-1 text-[11px] font-bold leading-none text-[#713f12] opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">Esc</kbd></button>
        </div>
      )}
    </section>
  )
}
