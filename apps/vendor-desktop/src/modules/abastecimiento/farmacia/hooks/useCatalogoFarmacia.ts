import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  crearNodo,
  crearPresentacion,
  obtenerNodosFraccionamiento,
  obtenerPresentaciones,
  obtenerProductosComerciales,
} from '../../../../domains/farmacia/farmacia.service'
import { useFarmaciaStore } from '../../../../domains/farmacia/farmacia.store'
import type {
  CrearNodoInput,
  CrearPresentacionInput,
  CrearProductoComercialInput,
  CrearProductoGenericoInput,
  NodoFraccionamiento,
  PresentacionComercial,
  ProductoComercial,
} from '../../../../domains/farmacia/types'

export type PanelIzquierdoCatalogo = 'busqueda' | 'detalle'
export type TabDetalleFarmacia = 'detalle' | 'presentaciones' | 'precios'

interface UseCatalogoFarmaciaResult {
  inputRef: RefObject<HTMLInputElement | null>
  panelIzquierdo: PanelIzquierdoCatalogo
  termino: string
  indiceSeleccionado: number
  resultados: ProductoComercial[]
  productoSeleccionado: ProductoComercial | null
  productoPreview: ProductoComercial | null
  tabDetalle: TabDetalleFarmacia
  presentaciones: PresentacionComercial[]
  nodos: NodoFraccionamiento[]
  pasoNuevo: number
  creandoAbierto: boolean
  cargando: boolean
  sinResultados: boolean
  error: string | null
  onTerminoChange(t: string): void
  onLimpiar(): void
  onLimpiarDetalle(): void
  onSeleccionar(p: ProductoComercial): void
  onPreview(p: ProductoComercial | null): void
  onNavegaTeclado(key: string): void
  onResetIndice(): void
  onActualizarProductoSeleccionado(p: ProductoComercial): void
  onVolverBusqueda(): void
  onNuevo(): void
  onCerrarCreacion(): void
  onTabChange(t: TabDetalleFarmacia): void
  onPasoSiguiente(): void
  onPasoAnterior(): void
  onGuardarProducto(
    generico: CrearProductoGenericoInput,
    comercial: Omit<CrearProductoComercialInput, 'productoGenericoId'>,
    presentacion: CrearPresentacionInput,
    nodosExtra: CrearNodoInput[],
  ): Promise<void>
  onLimpiarError(): void
}

function resolverMensajeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export function useCatalogoFarmacia(): UseCatalogoFarmaciaResult {
  const [panelIzquierdo, setPanelIzquierdo] = useState<PanelIzquierdoCatalogo>('busqueda')
  const [termino, setTermino] = useState<string>('')
  const [indiceSeleccionado, setIndiceSeleccionado] = useState<number>(-1)
  const [resultados, setResultados] = useState<ProductoComercial[]>([])
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoComercial | null>(null)
  const [productoPreview, setProductoPreview] = useState<ProductoComercial | null>(null)
  const [tabDetalle, setTabDetalle] = useState<TabDetalleFarmacia>('detalle')
  const [presentaciones, setPresentaciones] = useState<PresentacionComercial[]>([])
  const [nodos, setNodos] = useState<NodoFraccionamiento[]>([])
  const [pasoNuevo, setPasoNuevo] = useState<number>(1)
  const [creandoAbierto, setCreandoAbierto] = useState<boolean>(false)
  const [buscando, setBuscando] = useState<boolean>(false)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const sinResultados = termino.trim().length >= 2 && !buscando && resultados.length === 0
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<number | null>(null)

  const cargandoStore = useFarmaciaStore((state) => state.cargando)
  const errorStore = useFarmaciaStore((state) => state.error)
  const crearProductoCompleto = useFarmaciaStore((state) => state.crearProductoCompleto)
  const limpiarError = useFarmaciaStore((state) => state.limpiarError)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    setIndiceSeleccionado(-1)
  }, [termino])

  const onTerminoChange = useCallback((t: string): void => {
    setProductoSeleccionado(null)
    setPresentaciones([])
    setNodos([])
    setTermino(t)
    setErrorLocal(null)
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    const terminoLimpio = t.trim()
    if (terminoLimpio.length < 2) {
      setResultados([])
      setBuscando(false)
      return
    }
    setBuscando(true)
    timerRef.current = window.setTimeout(() => {
      obtenerProductosComerciales(terminoLimpio, true)
        .then((productos: ProductoComercial[]) => setResultados(productos))
        .catch((error: unknown) => setErrorLocal(resolverMensajeError(error)))
        .finally(() => setBuscando(false))
    }, 300)
  }, [])

  const onLimpiar = useCallback((): void => {
    setProductoSeleccionado(null)
    setProductoPreview(null)
    setTermino('')
    setResultados([])
    setBuscando(false)
    setErrorLocal(null)
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
  }, [])

  const onLimpiarDetalle = useCallback((): void => {
    setProductoSeleccionado(null)
    setProductoPreview(null)
    setIndiceSeleccionado(-1)
    inputRef.current?.focus()
  }, [])

  const onSeleccionar = useCallback((p: ProductoComercial): void => {
    setPanelIzquierdo('detalle')
    setProductoSeleccionado(p)
    setTabDetalle('detalle')
    setBuscando(true)
    setErrorLocal(null)
    obtenerPresentaciones(p.id)
      .then(async (items: PresentacionComercial[]) => {
        setPresentaciones(items)
        const nodosPorPresentacion = await Promise.all(
          items.map((presentacion: PresentacionComercial) => obtenerNodosFraccionamiento(presentacion.id)),
        )
        setNodos(nodosPorPresentacion.flat())
      })
      .catch((error: unknown) => setErrorLocal(resolverMensajeError(error)))
      .finally(() => setBuscando(false))
  }, [])

  const onPreview = useCallback((p: ProductoComercial | null): void => {
    setProductoPreview(p)
  }, [])

  const onNavegaTeclado = useCallback((key: string): void => {
    if (key === 'ArrowDown') {
      const siguiente = indiceSeleccionado + 1 >= resultados.length ? 0 : indiceSeleccionado + 1
      setIndiceSeleccionado(siguiente)
      onPreview(resultados[siguiente] ?? null)
    } else if (key === 'ArrowUp') {
      const anterior = indiceSeleccionado - 1 < 0 ? resultados.length - 1 : indiceSeleccionado - 1
      setIndiceSeleccionado(anterior)
      onPreview(resultados[anterior] ?? null)
    } else if (key === 'Enter') {
      const producto = indiceSeleccionado >= 0 ? resultados[indiceSeleccionado] : resultados[0]
      if (producto) {
        onPreview(null)
        onSeleccionar(producto)
      }
    } else if (key === 'Escape') {
      onPreview(null)
      onLimpiar()
    }
  }, [indiceSeleccionado, resultados, onPreview, onSeleccionar, onLimpiar])

  const onResetIndice = useCallback((): void => {
    setIndiceSeleccionado(-1)
  }, [])

  const onActualizarProductoSeleccionado = useCallback((p: ProductoComercial): void => {
    setProductoSeleccionado(p)
    setProductoPreview(null)
  }, [])

  const onVolverBusqueda = useCallback((): void => {
    setPanelIzquierdo('busqueda')
    setProductoSeleccionado(null)
    setPresentaciones([])
    setNodos([])
  }, [])

  const onNuevo = useCallback((): void => {
    setCreandoAbierto(true)
    setPasoNuevo(1)
  }, [])

  const onCerrarCreacion = useCallback((): void => {
    setCreandoAbierto(false)
    setPasoNuevo(1)
  }, [])

  const onTabChange = useCallback((t: TabDetalleFarmacia): void => setTabDetalle(t), [])
  const onPasoSiguiente = useCallback((): void => setPasoNuevo((actual: number) => Math.min(4, actual + 1)), [])
  const onPasoAnterior = useCallback((): void => setPasoNuevo((actual: number) => Math.max(1, actual - 1)), [])

  const onGuardarProducto = useCallback(
    async (
      generico: CrearProductoGenericoInput,
      comercial: Omit<CrearProductoComercialInput, 'productoGenericoId'>,
      presentacion: CrearPresentacionInput,
      nodosExtra: CrearNodoInput[],
    ): Promise<void> => {
      setBuscando(true)
      setErrorLocal(null)
      try {
        const productoComercialId = await crearProductoCompleto(generico, comercial)
        const presentacionId = await crearPresentacion({ ...presentacion, productoComercialId })
        const nodoRaizId = await crearNodo({
          presentacionId,
          nombreFormaVenta: presentacion.descripcion,
          tipoFormaVenta: 'PRESENTACION_ORIGINAL',
          unidadesBase: presentacion.factorConversionBase,
          esVendible: true,
          esComprable: true,
        })
        await Promise.all(
          nodosExtra.map((nodo: CrearNodoInput) =>
            crearNodo({ ...nodo, presentacionId, nodoPadreId: nodo.nodoPadreId ?? nodoRaizId }),
          ),
        )
        setCreandoAbierto(false)
        setPasoNuevo(1)
      } catch (error) {
        setErrorLocal(resolverMensajeError(error))
        throw error
      } finally {
        setBuscando(false)
      }
    },
    [crearProductoCompleto, onTerminoChange],
  )

  const onLimpiarError = useCallback((): void => {
    setErrorLocal(null)
    limpiarError()
  }, [limpiarError])

  return {
    inputRef,
    panelIzquierdo,
    termino,
    indiceSeleccionado,
    resultados,
    productoSeleccionado,
    productoPreview,
    tabDetalle,
    presentaciones,
    nodos,
    pasoNuevo,
    creandoAbierto,
    cargando: cargandoStore || buscando,
    sinResultados,
    error: errorStore ?? errorLocal,
    onTerminoChange,
    onLimpiar,
    onLimpiarDetalle,
    onSeleccionar,
    onPreview,
    onNavegaTeclado,
    onResetIndice,
    onActualizarProductoSeleccionado,
    onVolverBusqueda,
    onNuevo,
    onCerrarCreacion,
    onTabChange,
    onPasoSiguiente,
    onPasoAnterior,
    onGuardarProducto,
    onLimpiarError,
  }
}
