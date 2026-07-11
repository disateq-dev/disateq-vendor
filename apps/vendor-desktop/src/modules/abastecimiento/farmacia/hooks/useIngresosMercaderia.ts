import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buscarPresentacionesParaIngreso, buscarProveedores, consultarRuc, crearNodo, crearPresentacion, crearProveedor, obtenerNodosFraccionamiento, registrarIngreso } from '../../../../domains/farmacia/farmacia.service'
import { proyectarAHov, proyectarServicioAHov, sincronizarValorHov } from '../../../../domains/farmacia/hov-projector.service'
import { crearServicioCatalogo } from '../../../../domains/catalog/servicio.service'
import { getAllHOVs } from '../../../../domains/catalog/hov.store'
import type { HOV } from '../../../../domains/catalog/hov.types'
import { getValoresActivosPorHOV } from '../../../../domains/catalog/valor-operacional.store'
import { crearValor, suspenderValor } from '../../../../domains/catalog/valor-operacional.service'
import type { ValorOperacional } from '../../../../domains/catalog/valor-operacional.types'
import type { CrearServicioCatalogoInput, ServicioCatalogo } from '../../../../domains/catalog/servicio.types'
import { useFarmaciaStore } from '../../../../domains/farmacia/farmacia.store'
import type {
  CrearNodoInput,
  CrearPresentacionInput,
  CrearProveedorInput,
  CrearProductoComercialInput,
  CrearProductoGenericoInput,
  DatosRuc,
  LineaIngreso,
  NodoFraccionamiento,
  PresentacionComercial,
  ProductoComercial,
  Proveedor,
  RegistrarIngresoInput,
  ResultadoBusquedaPresentacion,
  TipoRecursoOperacional,
} from '../../../../domains/farmacia/types'
import { usePOS } from '../../../../context/POSContext'

export interface LineaIngresoDraft extends LineaIngreso {
  id: string
  productoComercialId?: string
  precioVenta?: number
}

interface UseIngresosMercaderiaResult {
  proveedorSeleccionado: Proveedor | null
  lineas: LineaIngresoDraft[]
  buscandoProveedor: boolean
  resultadosProveedor: Proveedor[]
  terminoProveedor: string
  creandoProveedorAbierto: boolean
  modoCreacionProveedor: 'sunat' | 'manual'
  rucConsultaProveedor: string
  datosRucProveedor: DatosRuc | null
  consultandoSunatProveedor: boolean
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
  onAbrirCreacionProveedorSunat(): void
  onAbrirCreacionProveedorManual(): void
  onCerrarCreacionProveedor(): void
  onRucProveedorChange(r: string): void
  onConsultarRucProveedor(): Promise<void>
  onGuardarProveedorSunatYSeleccionar(extras: { nombreContacto?: string; telefono?: string; condicionesPago?: string }): Promise<void>
  onGuardarProveedorManualYSeleccionar(datos: CrearProveedorInput): Promise<void>
  onAbrirBuscadorProducto(): void
  onCerrarBuscadorProducto(): void
  onAbrirCreacionProducto(): void
  onCerrarCreacionProducto(): void
  onTerminoProductoChange(t: string): void
  onAgregarLinea(r: ResultadoBusquedaPresentacion): void
  onPasoSiguienteProducto(): void
  onPasoAnteriorProducto(): void
  onGuardarProductoYAgregarLinea(
    tipoRecurso: TipoRecursoOperacional,
    generico: CrearProductoGenericoInput,
    comercial: Omit<CrearProductoComercialInput, 'productoGenericoId' | 'tipoRecurso'>,
    presentacion: CrearPresentacionInput,
    nodosExtra: CrearNodoInput[],
    ubicacionFisica?: string,
    precioVenta?: number,
  ): Promise<void>
  onGuardarServicio(input: CrearServicioCatalogoInput, precioVenta?: number): Promise<void>
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
  const [creandoProveedorAbierto, setCreandoProveedorAbierto] = useState<boolean>(false)
  const [modoCreacionProveedor, setModoCreacionProveedor] = useState<'sunat' | 'manual'>('sunat')
  const [rucConsultaProveedor, setRucConsultaProveedor] = useState<string>('')
  const [datosRucProveedor, setDatosRucProveedor] = useState<DatosRuc | null>(null)
  const [consultandoSunatProveedor, setConsultandoSunatProveedor] = useState<boolean>(false)
  const [buscadorProductoAbierto, setBuscadorProductoAbierto] = useState<boolean>(false)
  const [terminoProducto, setTerminoProducto] = useState<string>('')
  const [resultadosProducto, setResultadosProducto] = useState<ResultadoBusquedaPresentacion[]>([])
  const [creandoProductoAbierto, setCreandoProductoAbierto] = useState<boolean>(false)
  const [pasoNuevoProducto, setPasoNuevoProducto] = useState<number>(1)
  const [cargando, setCargando] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const crearProductoCompleto = useFarmaciaStore((state) => state.crearProductoCompleto)
  const { activeOperator, cashSession } = usePOS()
  const runtimeIdSesion = activeOperator ? `${activeOperator.id}-${cashSession.openedAt?.toISOString() ?? 'sin-turno'}` : 'sin-operador'
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

  const onAbrirCreacionProveedorSunat = useCallback((): void => {
    const termino = terminoProveedor.trim()
    setModoCreacionProveedor('sunat')
    setRucConsultaProveedor(/^\d{11}$/.test(termino) ? termino : '')
    setDatosRucProveedor(null)
    setCreandoProveedorAbierto(true)
  }, [terminoProveedor])

  const onAbrirCreacionProveedorManual = useCallback((): void => {
    setModoCreacionProveedor('manual')
    setCreandoProveedorAbierto(true)
  }, [])

  const onCerrarCreacionProveedor = useCallback((): void => {
    setCreandoProveedorAbierto(false)
    setDatosRucProveedor(null)
    setRucConsultaProveedor('')
  }, [])

  const onRucProveedorChange = useCallback((r: string): void => {
    setRucConsultaProveedor(r)
    setError(null)
  }, [])

  const onConsultarRucProveedor = useCallback(async (): Promise<void> => {
    if (rucConsultaProveedor.length !== 11 || !/^\d+$/.test(rucConsultaProveedor)) {
      setError('RUC inválido: debe tener exactamente 11 dígitos numéricos')
      return
    }
    setConsultandoSunatProveedor(true)
    setError(null)
    try {
      const datosRuc = await consultarRuc(rucConsultaProveedor)
      setDatosRucProveedor(datosRuc)
    } catch (consultaError) {
      setError(resolverMensajeError(consultaError))
    } finally {
      setConsultandoSunatProveedor(false)
    }
  }, [rucConsultaProveedor])

  const onGuardarProveedorSunatYSeleccionar = useCallback(async (extras: {
    nombreContacto?: string
    telefono?: string
    condicionesPago?: string
  }): Promise<void> => {
    if (datosRucProveedor === null) {
      setError('Consulta SUNAT requerida antes de guardar.')
      return
    }
    setCargando(true)
    setError(null)
    try {
      const id = await crearProveedor({
        razonSocial: datosRucProveedor.razonSocial,
        ruc: rucConsultaProveedor,
        ...extras,
      })
      onSeleccionarProveedor({
        id,
        razonSocial: datosRucProveedor.razonSocial,
        ruc: rucConsultaProveedor,
        nombreContacto: extras.nombreContacto,
        telefono: extras.telefono,
        condicionesPago: extras.condicionesPago,
        estado: 'ACTIVO',
        creadoEn: new Date().toISOString(),
      })
      onCerrarCreacionProveedor()
    } catch (guardarError) {
      setError(resolverMensajeError(guardarError))
    } finally {
      setCargando(false)
    }
  }, [datosRucProveedor, onCerrarCreacionProveedor, onSeleccionarProveedor, rucConsultaProveedor])

  const onGuardarProveedorManualYSeleccionar = useCallback(async (datos: CrearProveedorInput): Promise<void> => {
    setCargando(true)
    setError(null)
    try {
      const id = await crearProveedor(datos)
      onSeleccionarProveedor({
        id,
        razonSocial: datos.razonSocial,
        ruc: datos.ruc,
        nombreContacto: datos.nombreContacto,
        telefono: datos.telefono,
        condicionesPago: datos.condicionesPago,
        estado: 'ACTIVO',
        creadoEn: new Date().toISOString(),
      })
      onCerrarCreacionProveedor()
    } catch (guardarError) {
      setError(resolverMensajeError(guardarError))
    } finally {
      setCargando(false)
    }
  }, [onCerrarCreacionProveedor, onSeleccionarProveedor])

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
        productoComercialId: r.productoComercialId,
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
    tipoRecurso: TipoRecursoOperacional,
    generico: CrearProductoGenericoInput,
    comercial: Omit<CrearProductoComercialInput, 'productoGenericoId' | 'tipoRecurso'>,
    presentacion: CrearPresentacionInput,
    nodosExtra: CrearNodoInput[],
    ubicacionFisica?: string,
    precioVenta?: number,
  ): Promise<void> => {
    setCargando(true)
    try {
      const productoComercialId = await crearProductoCompleto(generico, comercial, tipoRecurso)
      const presentacionId = await crearPresentacion({ ...presentacion, productoComercialId })
      const nodoRaizId = await crearNodo({
        presentacionId,
        nombreFormaVenta: presentacion.descripcion,
        tipoFormaVenta: 'PRESENTACION_ORIGINAL',
        unidadesBase: presentacion.factorConversionBase,
        esVendible: true,
        esComprable: true,
      })
      const nodosCreadosPorLocalId = new Map<string, string>()
      for (const [indice, nodo] of nodosExtra.entries()) {
        let nodoPadreId = nodo.nodoPadreId ?? nodoRaizId
        if (nodo.nodoPadreLocalId !== undefined) {
          const nodoPadreRealId = nodosCreadosPorLocalId.get(nodo.nodoPadreLocalId)
          if (nodoPadreRealId === undefined) throw new Error('Nodo padre local no resuelto')
          nodoPadreId = nodoPadreRealId
        }
        const nodoId = await crearNodo({ ...nodo, presentacionId, nodoPadreId })
        nodosCreadosPorLocalId.set(nodo.idTemporal ?? String(indice), nodoId)
      }
      try {
        const nodosCreados = await obtenerNodosFraccionamiento(presentacionId)
        const productoComercialAssembled: ProductoComercial = {
          id: productoComercialId,
          productoGenericoId: '',
          nombreComercial: comercial.nombreComercial,
          nombreFabricante: comercial.nombreFabricante,
          nombreTitular: comercial.nombreTitular,
          paisOrigen: comercial.paisOrigen ?? '',
          registroSanitario: comercial.registroSanitario,
          estadoRegistroSanitario: 'VIGENTE',
          codigoDIGEMID: comercial.codigoDIGEMID,
          condicionVenta: comercial.condicionVenta,
          tipoRecurso,
          requiereLote: comercial.requiereLote,
          requiereCadenaFrio: comercial.requiereCadenaFrio,
          estado: 'ACTIVO',
          creadoEn: new Date().toISOString(),
          modificadoEn: new Date().toISOString(),
          ifa: generico.ifa,
          concentracion: generico.concentracion,
          formaFarmaceutica: generico.formaFarmaceutica,
          categoriaFarmacia: generico.categoriaFarmacia,
        }
        const presentacionAssembled: PresentacionComercial = {
          id: presentacionId,
          productoComercialId,
          descripcion: presentacion.descripcion,
          fraccionDIGEMID: presentacion.fraccionDIGEMID,
          unidadConteo: presentacion.unidadConteo,
          factorConversionBase: presentacion.factorConversionBase,
          codigoBarras: presentacion.codigoBarras,
          proveedorHabitualId: presentacion.proveedorHabitualId,
          costoCompra: presentacion.costoCompra,
          stockMinimo: 0,
          creadoEn: new Date().toISOString(),
        }
        nodosCreados
          .filter((nodo: NodoFraccionamiento) => nodo.esVendible)
          .forEach((nodo: NodoFraccionamiento) => {
            proyectarAHov(nodo, presentacionAssembled, productoComercialAssembled, null, 'default', tipoRecurso, ubicacionFisica)
          })
        if (precioVenta !== undefined && precioVenta > 0) {
          nodosCreados
            .filter((nodo: NodoFraccionamiento) => nodo.esVendible)
            .forEach((nodo: NodoFraccionamiento) => {
              sincronizarValorHov(nodo, precioVenta)
            })
        }
      } catch (errorProyeccion) {
        console.error('No se pudo proyectar el producto a la capa de venta (HOV):', errorProyeccion)
      }
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

  const onGuardarServicio = useCallback(async (
    input: CrearServicioCatalogoInput,
    precioVenta?: number,
  ): Promise<void> => {
    setCargando(true)
    setError(null)
    try {
      const servicioId = await crearServicioCatalogo(input)
      const servicio: ServicioCatalogo = {
        id: servicioId,
        rubro: input.rubro,
        tipoServicio: input.tipoServicio,
        nombre: input.nombre,
        descripcion: input.descripcion,
        duracionMinutos: input.duracionMinutos,
        estado: 'ACTIVO',
        creadoEn: new Date().toISOString(),
      }
      proyectarServicioAHov(servicio, 'default', precioVenta)
      setCreandoProductoAbierto(false)
    } catch (guardarError) {
      setError(resolverMensajeError(guardarError))
      throw guardarError
    } finally {
      setCargando(false)
    }
  }, [])

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
        operadorId: activeOperator?.id ?? 'sin-operador',
        runtimeId: runtimeIdSesion,
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
      const hovsTodos = getAllHOVs()
      for (const linea of lineas) {
        if ((linea.precioVenta ?? 0) > 0 && linea.productoComercialId !== undefined) {
          const hovsDelProducto = hovsTodos.filter(
            (h: HOV) =>
              h.productoId === linea.productoComercialId && h.estado === 'ACTIVA',
          )
          for (const hov of hovsDelProducto) {
            const valoresActivos = getValoresActivosPorHOV(hov.id).filter(
              (v: ValorOperacional) =>
                v.tipo === 'NORMAL' && v.estado === 'ACTIVO',
            )
            for (const valor of valoresActivos) {
              suspenderValor(valor.id)
            }
            crearValor({
              hovId: hov.id,
              tipo: 'NORMAL',
              valor: linea.precioVenta!,
              moneda: 'PEN',
              condiciones: { cantidadMinima: null, contextoOperacionalId: 'default', identidadOperacionalId: null },
              vigencia: { desde: new Date().toISOString(), hasta: null },
            })
          }
        }
      }
      await registrarIngreso(input)
      limpiarEstado()
    } catch (confirmarError) {
      setError(resolverMensajeError(confirmarError))
    } finally {
      setCargando(false)
    }
  }, [activeOperator, ingresoValido, lineas, limpiarEstado, proveedorSeleccionado, runtimeIdSesion])

  const onCancelar = useCallback((): void => limpiarEstado(), [limpiarEstado])
  const onLimpiarError = useCallback((): void => setError(null), [])

  return {
    proveedorSeleccionado, lineas, buscandoProveedor, resultadosProveedor, terminoProveedor,
    creandoProveedorAbierto, modoCreacionProveedor, rucConsultaProveedor, datosRucProveedor, consultandoSunatProveedor,
    buscadorProductoAbierto, terminoProducto, resultadosProducto, creandoProductoAbierto, pasoNuevoProducto,
    cargando, error, historialReciente, ingresoValido,
    onTerminoProveedorChange, onSeleccionarProveedor, onAbrirCreacionProveedorSunat,
    onAbrirCreacionProveedorManual, onCerrarCreacionProveedor, onRucProveedorChange,
    onConsultarRucProveedor, onGuardarProveedorSunatYSeleccionar, onGuardarProveedorManualYSeleccionar,
    onAbrirBuscadorProducto, onCerrarBuscadorProducto,
    onAbrirCreacionProducto, onCerrarCreacionProducto, onTerminoProductoChange, onAgregarLinea,
    onPasoSiguienteProducto, onPasoAnteriorProducto, onGuardarProductoYAgregarLinea,
    onEliminarLinea, onActualizarLinea, onUsarLoteGenerico,
    onUsarLoteReal, onConfirmarIngreso, onCancelar, onLimpiarError, onGuardarServicio,
  }
}
