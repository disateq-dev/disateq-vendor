import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buscarPrincipiosActivos,
  crearPrincipioActivo,
  listarPrincipiosActivos,
  modificarPrincipioActivo,
  obtenerPrincipioActivo,
} from '../../../../domains/farmacia/farmacia.service'
import type {
  CrearPrincipioActivoInput,
  ModificarPrincipioActivoInput,
  PrincipioActivo,
  PrincipioActivoDetalle,
} from '../../../../domains/farmacia/types'

export type ModoPrincipios = 'busqueda' | 'resumen' | 'editar' | 'nuevo'

interface UsePrincipiosActivosResult {
  modo: ModoPrincipios
  termino: string
  resultados: PrincipioActivo[]
  principioSeleccionado: PrincipioActivoDetalle | null
  cargando: boolean
  error: string | null
  onTerminoChange(t: string): void
  onSeleccionar(p: PrincipioActivo): void
  onVolverBusqueda(): void
  onIrEditar(): void
  onIrNuevo(): void
  onGuardarNuevo(datos: CrearPrincipioActivoInput): Promise<void>
  onGuardarEdicion(datos: ModificarPrincipioActivoInput): Promise<void>
  onLimpiar(): void
  onLimpiarError(): void
  onRecargarDetalle(): Promise<void>
}

function resolverMensajeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export function usePrincipiosActivos(): UsePrincipiosActivosResult {
  const [modo, setModo] = useState<ModoPrincipios>('busqueda')
  const [termino, setTermino] = useState<string>('')
  const [resultados, setResultados] = useState<PrincipioActivo[]>([])
  const [principioSeleccionado, setPrincipioSeleccionado] = useState<PrincipioActivoDetalle | null>(null)
  const [cargando, setCargando] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
  }, [])

  const ejecutarBusqueda = useCallback(async (valor: string): Promise<void> => {
    setCargando(true)
    setError(null)
    try {
      const items = valor.trim().length === 0
        ? await listarPrincipiosActivos()
        : await buscarPrincipiosActivos(valor)
      setResultados(items)
    } catch (busquedaError) {
      setError(resolverMensajeError(busquedaError))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void ejecutarBusqueda('')
  }, [ejecutarBusqueda])

  const onTerminoChange = useCallback(
    (t: string): void => {
      setTermino(t)
      setError(null)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      setCargando(true)
      timerRef.current = window.setTimeout(() => {
        void ejecutarBusqueda(t.trim())
      }, 300)
    },
    [ejecutarBusqueda],
  )

  const onSeleccionar = useCallback(
    async (p: PrincipioActivo): Promise<void> => {
      setCargando(true)
      setError(null)
      try {
        const detalle = await obtenerPrincipioActivo(p.id)
        setPrincipioSeleccionado(detalle)
        setModo('resumen')
      } catch (detalleError) {
        setError(resolverMensajeError(detalleError))
      } finally {
        setCargando(false)
      }
    },
    [],
  )

  const onVolverBusqueda = useCallback((): void => {
    setModo('busqueda')
    setPrincipioSeleccionado(null)
    setError(null)
  }, [])

  const onIrEditar = useCallback((): void => {
    setModo('editar')
    setError(null)
  }, [])

  const onIrNuevo = useCallback((): void => {
    setModo('nuevo')
    setPrincipioSeleccionado(null)
    setError(null)
  }, [])

  const onGuardarNuevo = useCallback(
    async (datos: CrearPrincipioActivoInput): Promise<void> => {
      setCargando(true)
      setError(null)
      try {
        const id = await crearPrincipioActivo(datos)
        const detalle = await obtenerPrincipioActivo(id)
        setPrincipioSeleccionado(detalle)
        setModo('resumen')
        await ejecutarBusqueda(termino.trim())
      } catch (guardarError) {
        const mensaje = resolverMensajeError(guardarError)
        setError(mensaje === 'NOMBRE_DUPLICADO' ? 'Ya existe un principio activo con ese nombre DCI' : mensaje)
      } finally {
        setCargando(false)
      }
    },
    [ejecutarBusqueda, termino],
  )

  const onGuardarEdicion = useCallback(
    async (datos: ModificarPrincipioActivoInput): Promise<void> => {
      setCargando(true)
      setError(null)
      try {
        await modificarPrincipioActivo(datos)
        const detalle = await obtenerPrincipioActivo(datos.id)
        setPrincipioSeleccionado(detalle)
        setModo('resumen')
        await ejecutarBusqueda(termino.trim())
      } catch (editarError) {
        setError(resolverMensajeError(editarError))
      } finally {
        setCargando(false)
      }
    },
    [ejecutarBusqueda, termino],
  )

  const onLimpiar = useCallback((): void => {
    setTermino('')
    setError(null)
    setPrincipioSeleccionado(null)
    setModo('busqueda')
    void ejecutarBusqueda('')
  }, [ejecutarBusqueda])

  const onRecargarDetalle = useCallback(async (): Promise<void> => {
    if (principioSeleccionado === null) return
    setCargando(true)
    try {
      const detalle = await obtenerPrincipioActivo(principioSeleccionado.id)
      setPrincipioSeleccionado(detalle)
    } catch (recargarError) {
      setError(resolverMensajeError(recargarError))
    } finally {
      setCargando(false)
    }
  }, [principioSeleccionado])

  const onLimpiarError = useCallback((): void => setError(null), [])

  return {
    modo,
    termino,
    resultados,
    principioSeleccionado,
    cargando,
    error,
    onTerminoChange,
    onSeleccionar,
    onVolverBusqueda,
    onIrEditar,
    onIrNuevo,
    onGuardarNuevo,
    onGuardarEdicion,
    onLimpiar,
    onLimpiarError,
    onRecargarDetalle,
  }
}
