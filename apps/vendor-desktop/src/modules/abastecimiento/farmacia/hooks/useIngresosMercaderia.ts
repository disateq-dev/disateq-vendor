import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buscarPresentacionesParaIngreso, buscarProveedores, crearNodo, crearPresentacion, registrarIngreso } from '../../../../domains/farmacia/farmacia.service'
import { useFarmaciaStore } from '../../../../domains/farmacia/farmacia.store'
import type {
  CrearNodoInput,
  CrearPresentacionInput,
  CrearProductoComercialInput,
  CrearProductoGenericoInput,
  LineaIngreso,
  Proveedor,
  RegistrarIngresoInput,
  ResultadoBusquedaPresentacion,
} from '../../../../domains/farmacia/types'

export interface LineaIngresoDraft extends LineaIngreso {
  id: string
}

interface UseIngresosMercaderiaResult {
  proveedorSeleccionado: Proveedor | null
  lineas: LineaIngresoDraft[]
  buscandoProveedor: boolean
  resultadosProveedor: Proveedor[]
  terminoProveedor: string
  buscadorProductoAbierto: boolean
  terminoProducto: string
  resultadosProducto: ResultadoBusquedaPresentacion[]
  creandoProductoAbierto: boolean
  pasoNuevoProducto: number
  cargando: boolean
  error: string | null
  historialReciente: unknown[]
  ingresoValido: boolean
  onTerminoProveedorChange(t: string): void
  onSeleccionarProveedor(p: Proveedor): void
  onAbrirBuscadorProducto(): void
  onCerrarBuscadorProducto(): void
  onAbrirCreacionProducto(): void
  onCerrarCreacionProducto(): void
  onTerminoProductoChange(t: string): void
  onAgregarLinea(r: ResultadoBusquedaPresentacion): void
  onPasoSiguienteProducto(): void
  onPasoAnteriorProducto(): void
  onGuardarProductoYAgregarLinea(
    generico: CrearProductoGenericoInput,
    comercial: Omit<CrearProductoComercialInput, 'productoGenericoId'>,
    presentacion: CrearPresentacionInput,
    nodosExtra: CrearNodoInput[],
  ): Promise<void>
  onEliminarLinea(id: string): void
  onActualizarLinea(id: string, cambios: Partial<LineaIngresoDraft>): void
  onUsarLoteGenerico(id: string): void
  onUsarLoteReal(id: string): void
  onConfirmarIngreso(): Promise<void>
  onCancelar(): void
  onLimpiarError(): void
}

function resolverMensajeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function lineaValida(linea: LineaIngresoDraft): boolean {
  if (linea.cantidad <= 0) return false
  if (!linea.requiereLote) return true
  return linea.esLoteGenerico || (!!linea.numeroLote?.trim() && !!linea.fechaVencimiento?.trim())
}

export function useIngresosMercaderia(): UseIngresosMercaderiaResult {
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null)
  const [lineas, setLineas] = useState<LineaIngresoDraft[]>([])
  const [buscandoProveedor, setBuscandoProveedor] = useState<boolean>(false)
  const [resultadosProveedor, setResultadosProveedor] = useState<Proveedor[]>([])
  const [terminoProveedor, setTerminoProveedor] = useState<string>('')
  const [buscadorProductoAbierto, setBuscadorProductoAbierto] = useState<boolean>(false)
  const [terminoProducto, setTerminoProducto] = useState<string>('')
  const [resultadosProducto, setResultadosProducto] = useState<ResultadoBusquedaPresentacion[]>([])
  const [creandoProductoAbierto, setCreandoProductoAbierto] = useState<boolean>(false)
  const [pasoNuevoProducto, setPasoNuevoProducto] = useState<number>(1)
  const [cargando, setCargando] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const crearProductoCompleto = useFarmaciaStore((state) => state.crearProductoCompleto)
  const timerProveedorRef = useRef<number | null>(null)
  const timerProductoRef = useRef<number | null>(null)
  const historialReciente: unknown[] = [] // TODO: cargar historial cuando exista comando de listado.

  const ingresoValido = useMemo(
    (): boolean => proveedorSeleccionado !== null && lineas.length > 0 && lineas.every(lineaValida),
    [lineas, proveedorSeleccionado],
  )

  const limpiarEstado = useCallback((): void => {
    setProveedorSeleccionado(null)
    setLineas([])
    setResultadosProveedor([])
    setTerminoProveedor('')
    setBuscadorProductoAbierto(false)
    setTerminoProducto('')
    setResultadosProducto([])
    setError(null)
  }, [])

  useEffect(() => () => {
    if (timerProveedorRef.current !== null) window.clearTimeout(timerProveedorRef.current)
    if (timerProductoRef.current !== null) window.clearTimeout(timerProductoRef.current)
  }, [])

  const onTerminoProveedorChange = useCallback((t: string): void => {
    setTerminoProveedor(t)
    setProveedorSeleccionado(null)
    setError(null)
    if (timerProveedorRef.current !== null) window.clearTimeout(timerProveedorRef.current)
    const valor = t.trim()
    if (valor.length < 2) {
      setResultadosProveedor([])
      setBuscandoProveedor(false)
      return
    }
    setBuscandoProveedor(true)
    timerProveedorRef.current = window.setTimeout(() => {
      buscarProveedores(valor, true)
        .then(setResultadosProveedor)
        .catch((busquedaError: unknown) => setError(resolverMensajeError(busquedaError)))
        .finally(() => setBuscandoProveedor(false))
    }, 300)
  }, [])

  const onSeleccionarProveedor = useCallback((p: Proveedor): void => {
    setProveedorSeleccionado(p)
    setTerminoProveedor(p.razonSocial)
    setResultadosProveedor([])
  }, [])

  const onAbrirBuscadorProducto = useCallback((): void => setBuscadorProductoAbierto(true), [])
  const onCerrarBuscadorProducto = useCallback((): void => setBuscadorProductoAbierto(false), [])
  const onAbrirCreacionProducto = useCallback((): void => {
    setBuscadorProductoAbierto(false)
    setPasoNuevoProducto(1)
    setCreandoProductoAbierto(true)
  }, [])
  const onCerrarCreacionProducto = useCallback((): void => setCreandoProductoAbierto(false), [])
  const onPasoSiguienteProducto = useCallback((): void => {
    setPasoNuevoProducto((actual) => Math.min(4, actual + 1))
  }, [])
  const onPasoAnteriorProducto = useCallback((): void => {
    setPasoNuevoProducto((actual) => Math.max(1, actual - 1))
  }, [])

  const onTerminoProductoChange = useCallback((t: string): void => {
    setTerminoProducto(t)
    setError(null)
    if (timerProductoRef.current !== null) window.clearTimeout(timerProductoRef.current)
    const valor = t.trim()
    if (valor.length < 2) {
      setResultadosProducto([])
      return
    }
    timerProductoRef.current = window.setTimeout(() => {
      buscarPresentacionesParaIngreso(valor)
        .then(setResultadosProducto)
        .catch((busquedaError: unknown) => setError(resolverMensajeError(busquedaError)))
    }, 300)
  }, [])

  const onAgregarLinea = useCallback((r: ResultadoBusquedaPresentacion): void => {
    setLineas((actuales) => [
      ...actuales,
      {
        id: crypto.randomUUID(),
        presentacionId: r.presentacionId,
        productoNombre: r.productoNombre,
        presentacionDescripcion: r.descripcion,
        cantidad: 1,
        costoUnitario: undefined,
        requiereLote: r.requiereLote,
        numeroLote: '',
        fechaVencimiento: '',
        esLoteGenerico: false,
      },
    ])
    setBuscadorProductoAbierto(false)
    setTerminoProducto('')
    setResultadosProducto([])
  }, [])

  const onGuardarProductoYAgregarLinea = useCallback(async (
    generico: CrearProductoGenericoInput,
    comercial: Omit<CrearProductoComercialInput, 'productoGenericoId'>,
    presentacion: CrearPresentacionInput,
    nodosExtra: CrearNodoInput[],
  ): Promise<void> => {
    setCargando(true)
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
      await Promise.all(nodosExtra.map((nodo) => crearNodo({
        ...nodo,
        presentacionId,
        nodoPadreId: nodo.nodoPadreId ?? nodoRaizId,
      })))
      onAgregarLinea({
        presentacionId,
        productoComercialId,
        productoNombre: comercial.nombreComercial,
        descripcion: presentacion.descripcion,
        requiereLote: comercial.requiereLote,
        fabricante: comercial.nombreFabricante,
      })
      setCreandoProductoAbierto(false)
    } catch (guardarError) {
      setError(resolverMensajeError(guardarError))
      throw guardarError
    } finally {
      setCargando(false)
    }
  }, [crearProductoCompleto, onAgregarLinea])

  const onEliminarLinea = useCallback((id: string): void => {
    setLineas((actuales) => actuales.filter((linea) => linea.id !== id))
  }, [])

  const onActualizarLinea = useCallback((id: string, cambios: Partial<LineaIngresoDraft>): void => {
    setLineas((actuales) => actuales.map((linea) => (linea.id === id ? { ...linea, ...cambios } : linea)))
  }, [])

  const onUsarLoteGenerico = useCallback((id: string): void => {
    onActualizarLinea(id, { esLoteGenerico: true, numeroLote: '', fechaVencimiento: '' })
  }, [onActualizarLinea])

  const onUsarLoteReal = useCallback((id: string): void => {
    onActualizarLinea(id, { esLoteGenerico: false })
  }, [onActualizarLinea])

  const onConfirmarIngreso = useCallback(async (): Promise<void> => {
    if (!ingresoValido || proveedorSeleccionado === null) {
      setError('Selecciona proveedor y completa cantidad/lote de cada línea.')
      return
    }
    setCargando(true)
    setError(null)
    try {
      const input: RegistrarIngresoInput = {
        proveedorId: proveedorSeleccionado.id,
        operadorId: 'operador-actual',
        runtimeId: crypto.randomUUID(),
        lineas: lineas.map((linea) => ({
          presentacionId: linea.presentacionId,
          cantidad: linea.cantidad,
          costoUnitario: linea.costoUnitario,
          requiereLote: linea.requiereLote,
          numeroLote: linea.numeroLote || undefined,
          fechaVencimiento: linea.fechaVencimiento || undefined,
          esLoteGenerico: linea.esLoteGenerico,
        })),
      }
      await registrarIngreso(input)
      limpiarEstado()
    } catch (confirmarError) {
      setError(resolverMensajeError(confirmarError))
    } finally {
      setCargando(false)
    }
  }, [ingresoValido, lineas, limpiarEstado, proveedorSeleccionado])

  const onCancelar = useCallback((): void => limpiarEstado(), [limpiarEstado])
  const onLimpiarError = useCallback((): void => setError(null), [])

  return {
    proveedorSeleccionado, lineas, buscandoProveedor, resultadosProveedor, terminoProveedor,
    buscadorProductoAbierto, terminoProducto, resultadosProducto, creandoProductoAbierto, pasoNuevoProducto,
    cargando, error, historialReciente, ingresoValido,
    onTerminoProveedorChange, onSeleccionarProveedor, onAbrirBuscadorProducto, onCerrarBuscadorProducto,
    onAbrirCreacionProducto, onCerrarCreacionProducto, onTerminoProductoChange, onAgregarLinea,
    onPasoSiguienteProducto, onPasoAnteriorProducto, onGuardarProductoYAgregarLinea,
    onEliminarLinea, onActualizarLinea, onUsarLoteGenerico,
    onUsarLoteReal, onConfirmarIngreso, onCancelar, onLimpiarError,
  }
}
