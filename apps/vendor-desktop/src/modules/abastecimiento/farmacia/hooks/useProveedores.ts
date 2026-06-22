import { useCallback, useEffect, useRef, useState } from 'react'
import { actualizarProveedor, buscarProveedores, consultarRuc, crearProveedor } from '../../../../domains/farmacia/farmacia.service'
import type { ModificarProveedorInput, CrearProveedorInput, DatosRuc, Proveedor } from '../../../../domains/farmacia/types'

export type ModoProveedores = 'busqueda' | 'detalle' | 'sunat' | 'manual'

interface ExtrasProveedor {
  nombreContacto?: string
  telefono?: string
  condicionesPago?: string
}

interface UseProveedoresResult {
  modo: ModoProveedores; termino: string; resultados: Proveedor[]; proveedorSeleccionado: Proveedor | null
  rucConsulta: string; datosRuc: DatosRuc | null; cargando: boolean; error: string | null; consultandoSunat: boolean
  onTerminoChange(t: string): void; onSeleccionar(p: Proveedor): void; onVolverBusqueda(): void
  onIrSunat(): void; onIrManual(): void; onRucChange(r: string): void; onConsultarRuc(): Promise<void>
  onGuardarDesdeSunat(extras: ExtrasProveedor): Promise<void>; onGuardarManual(datos: CrearProveedorInput): Promise<void>
  onActualizar(datos: ModificarProveedorInput): Promise<void>; onLimpiarError(): void
}

function resolverMensajeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function esRucValido(ruc: string): boolean { return ruc.length === 11 && /^\d+$/.test(ruc) }

export function useProveedores(): UseProveedoresResult {
  const [modo, setModo] = useState<ModoProveedores>('busqueda')
  const [termino, setTermino] = useState<string>('')
  const [resultados, setResultados] = useState<Proveedor[]>([])
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null)
  const [rucConsulta, setRucConsulta] = useState<string>('')
  const [datosRuc, setDatosRuc] = useState<DatosRuc | null>(null)
  const [cargando, setCargando] = useState<boolean>(false)
  const [consultandoSunat, setConsultandoSunat] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  const limpiarBusqueda = useCallback((): void => { setTermino(''); setResultados([]) }, [])

  const ejecutarBusqueda = useCallback(async (valor: string): Promise<void> => {
    setCargando(true)
    setError(null)
    try {
      const proveedores = await buscarProveedores(valor, true)
      setResultados(proveedores)
    } catch (busquedaError) {
      setError(resolverMensajeError(busquedaError))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => () => { if (timerRef.current !== null) window.clearTimeout(timerRef.current) }, [])

  const onTerminoChange = useCallback(
    (t: string): void => {
      setTermino(t)
      setError(null)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      const valor = t.trim()
      if (valor.length < 2) {
        setResultados([])
        setCargando(false)
        return
      }
      setCargando(true)
      timerRef.current = window.setTimeout(() => {
        void ejecutarBusqueda(valor)
      }, 300)
    },
    [ejecutarBusqueda],
  )

  const onSeleccionar = useCallback((p: Proveedor): void => {
    setProveedorSeleccionado(p)
    setModo('detalle')
    setError(null)
  }, [])

  const onVolverBusqueda = useCallback((): void => {
    setModo('busqueda')
    setProveedorSeleccionado(null)
    setDatosRuc(null)
    setError(null)
  }, [])

  const onIrSunat = useCallback((): void => {
    setModo('sunat')
    setRucConsulta(/^\d{11}$/.test(termino.trim()) ? termino.trim() : '')
    setDatosRuc(null)
    setError(null)
  }, [termino])

  const onIrManual = useCallback((): void => { setModo('manual'); setError(null) }, [])

  const onRucChange = useCallback((r: string): void => { setRucConsulta(r); setError(null) }, [])

  const onConsultarRuc = useCallback(async (): Promise<void> => {
    if (!esRucValido(rucConsulta)) {
      setError('RUC inválido: debe tener exactamente 11 dígitos numéricos')
      return
    }
    setConsultandoSunat(true)
    setError(null)
    try {
      const respuesta = await consultarRuc(rucConsulta)
      setDatosRuc(respuesta)
    } catch (consultaError) {
      setError(resolverMensajeError(consultaError))
    } finally {
      setConsultandoSunat(false)
    }
  }, [rucConsulta])

  const onGuardarDesdeSunat = useCallback(
    async (extras: ExtrasProveedor): Promise<void> => {
      if (datosRuc === null) {
        setError('Consulta SUNAT requerida antes de guardar.')
        return
      }
      setCargando(true)
      setError(null)
      try {
        await crearProveedor({ razonSocial: datosRuc.razonSocial, ruc: rucConsulta, ...extras })
        limpiarBusqueda()
        setDatosRuc(null)
        setModo('busqueda')
      } catch (guardarError) {
        setError(resolverMensajeError(guardarError))
      } finally {
        setCargando(false)
      }
    },
    [datosRuc, limpiarBusqueda, rucConsulta],
  )

  const onGuardarManual = useCallback(
    async (datos: CrearProveedorInput): Promise<void> => {
      setCargando(true)
      setError(null)
      try {
        await crearProveedor(datos)
        limpiarBusqueda()
        setModo('busqueda')
      } catch (guardarError) {
        setError(resolverMensajeError(guardarError))
      } finally {
        setCargando(false)
      }
    },
    [limpiarBusqueda],
  )

  const onActualizar = useCallback(
    async (datos: ModificarProveedorInput): Promise<void> => {
      setCargando(true)
      setError(null)
      try {
        await actualizarProveedor(datos)
        setProveedorSeleccionado((actual) => (actual ? { ...actual, ...datos } : actual))
        if (termino.trim().length >= 2) await ejecutarBusqueda(termino.trim())
      } catch (actualizarError) {
        setError(resolverMensajeError(actualizarError))
      } finally {
        setCargando(false)
      }
    },
    [ejecutarBusqueda, termino],
  )

  const onLimpiarError = useCallback((): void => setError(null), [])

  return { modo, termino, resultados, proveedorSeleccionado, rucConsulta, datosRuc, cargando, error, consultandoSunat,
    onTerminoChange, onSeleccionar, onVolverBusqueda, onIrSunat, onIrManual, onRucChange, onConsultarRuc,
    onGuardarDesdeSunat, onGuardarManual, onActualizar, onLimpiarError }
}
