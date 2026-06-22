import { useCallback, useEffect, useRef, useState } from 'react'
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
  panelIzquierdo: PanelIzquierdoCatalogo
  termino: string
  resultados: ProductoComercial[]
  productoSeleccionado: ProductoComercial | null
  tabDetalle: TabDetalleFarmacia
  presentaciones: PresentacionComercial[]
  nodos: NodoFraccionamiento[]
  pasoNuevo: number
  creandoAbierto: boolean
  cargando: boolean
  sinResultados: boolean
  error: string | null
  onTerminoChange(t: string): void
  onSeleccionar(p: ProductoComercial): void
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
  const [resultados, setResultados] = useState<ProductoComercial[]>([])
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoComercial | null>(null)
  const [tabDetalle, setTabDetalle] = useState<TabDetalleFarmacia>('detalle')
  const [presentaciones, setPresentaciones] = useState<PresentacionComercial[]>([])
  const [nodos, setNodos] = useState<NodoFraccionamiento[]>([])
  const [pasoNuevo, setPasoNuevo] = useState<number>(1)
  const [creandoAbierto, setCreandoAbierto] = useState<boolean>(false)
  const [buscando, setBuscando] = useState<boolean>(false)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const sinResultados = termino.trim().length >= 2 && !buscando && resultados.length === 0
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

  const onTerminoChange = useCallback((t: string): void => {
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
        .then((productos: ProductoComercial[]) => setResultados(productos.slice(0, 8)))
        .catch((error: unknown) => setErrorLocal(resolverMensajeError(error)))
        .finally(() => setBuscando(false))
    }, 300)
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
    panelIzquierdo,
    termino,
    resultados,
    productoSeleccionado,
    tabDetalle,
    presentaciones,
    nodos,
    pasoNuevo,
    creandoAbierto,
    cargando: cargandoStore || buscando,
    sinResultados,
    error: errorStore ?? errorLocal,
    onTerminoChange,
    onSeleccionar,
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
