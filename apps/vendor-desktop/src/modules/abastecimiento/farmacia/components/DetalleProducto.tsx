import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import type {
  EstadoRegistroSanitario,
  ModificarProductoComercialInput,
  NodoFraccionamiento,
  PresentacionComercial,
  ProductoComercial,
} from '../../../../domains/farmacia/types'
import type { CrearValorOperacionalInput, EstadoValorOperacional, ModificarValorOperacionalInput, TipoValorOperacional, ValorOperacionalFarmacia } from '../../../../domains/farmacia/types'
import {
  crearValorOperacional,
  desactivarProductoComercial,
  modificarProductoComercial,
  modificarValorOperacional,
  obtenerValoresNodo,
  reactivarProductoComercial,
  verificarHistorialProducto,
} from '../../../../domains/farmacia/farmacia.service'
import { usePOS } from '../../../../context/POSContext'
import { LABEL_CAMPO, LABEL_CONDICION_VENTA, LABEL_FORMA_FARMACEUTICA } from '../../../../domains/catalog/etiquetas-ui'
import type { TabDetalleFarmacia } from '../hooks/useCatalogoFarmacia'

interface DetalleProductoProps {
  producto: ProductoComercial
  productoPreview: ProductoComercial | null
  productoConfirmado: boolean
  presentaciones: PresentacionComercial[]
  nodos: NodoFraccionamiento[]
  tabActiva: TabDetalleFarmacia
  cargando: boolean
  onTabChange: (t: TabDetalleFarmacia) => void
  onVolver: () => void
  onActualizarProductoSeleccionado: (p: ProductoComercial) => void
  onNavegaAIngresos: () => void
  onLimpiar: () => void
}

type ModoDetalle = 'lectura' | 'corrigiendo' | 'desactivando'

interface CampoLecturaProps {
  label: string
  valor?: string | number
}

interface HeaderProductoProps {
  producto: ProductoComercial
}

interface TabsProductoProps {
  tabActiva: TabDetalleFarmacia
  onTabChange: (t: TabDetalleFarmacia) => void
}

interface PresentacionesTabProps {
  presentaciones: PresentacionComercial[]
  nodos: NodoFraccionamiento[]
}

interface PreciosTabProps {
  nodos: NodoFraccionamiento[]
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
    <div className="rounded-xl border border-[#E0F2FE] bg-white px-3 py-2">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 min-h-5 text-[11px] font-semibold text-slate-800">{valor ?? '-'}</div>
    </div>
  )
}

function HeaderProducto({ producto }: HeaderProductoProps): ReactElement {
  return (
    <header className="rounded-2xl border border-[#E0F2FE] bg-white p-5">
      <h2 className="text-[20px] font-bold text-slate-900">
        {[producto.nombreComercial, producto.concentracion, producto.formaFarmaceutica].filter(Boolean).join(' · ')}
      </h2>
      <p className="mt-1 text-[13px] font-semibold text-slate-500">{producto.nombreFabricante}</p>
    </header>
  )
}

function TabsProducto({ tabActiva, onTabChange }: TabsProductoProps): ReactElement {
  const tabs: { id: TabDetalleFarmacia; label: string }[] = [
    { id: 'detalle', label: 'Detalle' },
    { id: 'presentaciones', label: 'Presentaciones' },
    { id: 'precios', label: 'Precios' },
  ]
  return (
    <nav className="flex gap-2 border-b border-[#E0F2FE]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 text-[12px] font-bold uppercase tracking-wide ${
            tabActiva === tab.id ? 'border-b-2 border-[#0284C7] text-[#0284C7]' : 'text-slate-500'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

function PresentacionesTab({ presentaciones, nodos }: PresentacionesTabProps): ReactElement {
  return (
    <div className="space-y-4">
      {presentaciones.map((presentacion) => (
        <article key={presentacion.id} className="rounded-2xl border border-[#E0F2FE] bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-900">{presentacion.descripcion}</h3>
              <p className="mt-1 text-[12px] font-semibold text-slate-500">
                Fracción DIGEMID: {presentacion.fraccionDIGEMID} {presentacion.unidadConteo}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.alert('Nueva forma de venta pendiente')}
              className="rounded-full border border-[#E0F2FE] px-3 py-1.5 text-[11px] font-bold text-[#0284C7]"
            >
              Agregar forma de venta
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {nodos
              .filter((nodo) => nodo.presentacionId === presentacion.id)
              .map((nodo) => (
                <div key={nodo.id} className={`rounded-xl bg-[#E0F2FE] px-3 py-2 ${nodo.nodoPadreId ? 'ml-6' : ''}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-bold text-slate-800">{nodo.nombreFormaVenta}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-[#0284C7]">
                      {nodo.tipoFormaVenta}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">Unidades base: {nodo.unidadesBase}</p>
                </div>
              ))}
          </div>
        </article>
      ))}
    </div>
  )
}

function PreciosTab({ nodos }: PreciosTabProps): ReactElement {
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
      setFormularioNuevo(null)
      const valores = await obtenerValoresNodo(formularioNuevo.nodoId)
      setValoresPorNodo((actuales) => ({ ...actuales, [formularioNuevo.nodoId]: valores }))
    } catch (guardarError) {
      setError(guardarError instanceof Error ? guardarError.message : String(guardarError))
    } finally {
      setGuardando(false)
    }
  }, [formularioNuevo])

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
      setFormularioEdicion(null)
      const valores = await obtenerValoresNodo(formularioEdicion.nodoId)
      setValoresPorNodo((actuales) => ({ ...actuales, [formularioEdicion.nodoId]: valores }))
    } catch (guardarError) {
      setError(guardarError instanceof Error ? guardarError.message : String(guardarError))
    } finally {
      setGuardando(false)
    }
  }, [formularioEdicion, valoresPorNodo])

  if (cargando) {
    return <div className="text-[13px] font-semibold text-[#0284C7]">Cargando precios...</div>
  }

  if (error) {
    return <div className="text-[13px] text-red-500">{error}</div>
  }

  if (nodosVendibles.length === 0) {
    return <div className="text-[13px] text-slate-400">Sin formas de venta configuradas</div>
  }

  return (
    <div className="space-y-4">
      {nodosVendibles.map((nodo) => {
        const valoresNodo = valoresPorNodo[nodo.id] ?? []
        const tiposNodoDisponibles = tiposDisponibles(nodo.id)
        const valorEnEdicion = valoresNodo.find((valor) => valor.id === formularioEdicion?.id)

        return (
          <article key={nodo.id} className="rounded-2xl border border-[#E0F2FE] bg-white p-4">
            <header className="flex justify-between items-center mb-3">
              <h3 className="text-[14px] font-bold text-slate-900">{nodo.nombreFormaVenta}</h3>
              {tiposNodoDisponibles.length > 0 &&
                formularioNuevo?.nodoId !== nodo.id &&
                formularioEdicion?.nodoId !== nodo.id && (
                  <button
                    type="button"
                    onClick={() => onAbrirFormularioNuevo(nodo.id)}
                    disabled={guardando}
                    className="rounded-full border border-[#0284C7] px-3 py-1 text-[11px] font-bold text-[#0284C7]"
                  >
                    + Precio
                  </button>
                )}
            </header>

            {valoresNodo.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-2 py-2 border-b border-[#E0F2FE] last:border-0">
                <div>
                  <div className="text-[12px] font-bold text-slate-700">{ETIQUETA_TIPO[v.tipo]}</div>
                  {v.tipo === 'VENTA_MAYOREO' && v.condicionCantidadMinima !== undefined && (
                    <div className="text-[11px] text-slate-400">Mín. {v.condicionCantidadMinima} unidades</div>
                  )}
                  {v.tipo === 'VENTA_FRECUENTE' && (
                    <div className="text-[11px] text-slate-400">Requiere cliente frecuente</div>
                  )}
                  {v.tipo === 'VENTA_PROMOCION' && v.vigenciaHasta && (
                    <div className="text-[11px] text-slate-400">
                      {v.vigenciaDesde} - {v.vigenciaHasta}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[#0284C7]">S/ {v.valor.toFixed(2)}</span>
                  {v.estado === 'INACTIVO' && (
                    <span className="text-[9px] bg-red-100 text-red-500 rounded px-1">INACTIVO</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onAbrirFormularioEdicion(v)}
                    disabled={guardando || formularioNuevo?.nodoId === nodo.id || formularioEdicion?.nodoId === nodo.id}
                    className="text-[11px] font-semibold text-slate-400 underline"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}

            {formularioNuevo?.nodoId === nodo.id && (
              <div className="mt-3 p-3 rounded-xl border border-[#0284C7]/30 bg-[#E0F2FE]/40 space-y-2">
                <select
                  value={formularioNuevo.tipo}
                  onChange={(event) => setFormularioNuevo({ ...formularioNuevo, tipo: event.target.value as TipoValorOperacional })}
                  className="w-full rounded-lg border border-[#E0F2FE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#0284C7]"
                >
                  {tiposNodoDisponibles.map((tipo) => (
                    <option key={tipo} value={tipo}>{ETIQUETA_TIPO[tipo]}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Precio S/"
                  value={formularioNuevo.valor}
                  onChange={(event) => setFormularioNuevo({ ...formularioNuevo, valor: event.target.value })}
                  className="w-full rounded-lg border border-[#E0F2FE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#0284C7]"
                />
                {formularioNuevo.tipo === 'VENTA_MAYOREO' && (
                  <input
                    type="number"
                    placeholder="Cantidad mínima"
                    value={formularioNuevo.condicionMinima}
                    onChange={(event) => setFormularioNuevo({ ...formularioNuevo, condicionMinima: event.target.value })}
                    className="w-full rounded-lg border border-[#E0F2FE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#0284C7]"
                  />
                )}
                {formularioNuevo.tipo === 'VENTA_PROMOCION' && (
                  <input
                    type="date"
                    placeholder="Vigente hasta"
                    value={formularioNuevo.vigenciaHasta}
                    onChange={(event) => setFormularioNuevo({ ...formularioNuevo, vigenciaHasta: event.target.value })}
                    className="w-full rounded-lg border border-[#E0F2FE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#0284C7]"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void onGuardarNuevo()}
                    disabled={guardando}
                    className="rounded-lg bg-[#0284C7] px-3 py-1.5 text-[12px] font-bold text-white"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={onCancelar}
                    className="rounded-lg border border-[#E0F2FE] px-3 py-1.5 text-[12px] font-bold text-slate-500"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {formularioEdicion?.nodoId === nodo.id && (
              <div className="mt-3 p-3 rounded-xl border border-[#0284C7]/30 bg-[#E0F2FE]/40 space-y-2">
                <input
                  type="number"
                  value={formularioEdicion.valor}
                  onChange={(event) => setFormularioEdicion({ ...formularioEdicion, valor: event.target.value })}
                  className="w-full rounded-lg border border-[#E0F2FE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#0284C7]"
                />
                {valorEnEdicion?.tipo === 'VENTA_MAYOREO' && (
                  <input
                    type="number"
                    placeholder="Cantidad mínima"
                    value={formularioEdicion.condicionMinima}
                    onChange={(event) => setFormularioEdicion({ ...formularioEdicion, condicionMinima: event.target.value })}
                    className="w-full rounded-lg border border-[#E0F2FE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#0284C7]"
                  />
                )}
                {valorEnEdicion?.tipo === 'VENTA_PROMOCION' && (
                  <input
                    type="date"
                    value={formularioEdicion.vigenciaHasta}
                    onChange={(event) => setFormularioEdicion({ ...formularioEdicion, vigenciaHasta: event.target.value })}
                    className="w-full rounded-lg border border-[#E0F2FE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#0284C7]"
                  />
                )}
                <select
                  value={formularioEdicion.estado}
                  onChange={(event) => setFormularioEdicion({ ...formularioEdicion, estado: event.target.value as EstadoValorOperacional })}
                  className="w-full rounded-lg border border-[#E0F2FE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#0284C7]"
                >
                  <option value="ACTIVO">Activa</option>
                  <option value="INACTIVO">Inactiva</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void onGuardarEdicion()}
                    disabled={guardando}
                    className="rounded-lg bg-[#0284C7] px-3 py-1.5 text-[12px] font-bold text-white"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={onCancelar}
                    className="rounded-lg border border-[#E0F2FE] px-3 py-1.5 text-[12px] font-bold text-slate-500"
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
  )
}

export function DetalleProducto({
  producto,
  productoPreview,
  productoConfirmado,
  presentaciones,
  nodos,
  tabActiva,
  cargando,
  onTabChange,
  onActualizarProductoSeleccionado,
  onNavegaAIngresos,
  onLimpiar,
}: DetalleProductoProps): ReactElement {
  const { activeOperator } = usePOS()
  const esAdmin = activeOperator?.codigoRol === 'ADMIN'
  const corregirRef = useRef<HTMLButtonElement>(null)
  const [modo, setModo] = useState<ModoDetalle>('lectura')
  const [tieneHistorial, setTieneHistorial] = useState<boolean>(false)
  const [verificandoHistorial, setVerificandoHistorial] = useState<boolean>(false)
  const [guardandoCambios, setGuardandoCambios] = useState<boolean>(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [formularioCorreccion, setFormularioCorreccion] = useState<ModificarProductoComercialInput | null>(null)
  const [indiceAccion, setIndiceAccion] = useState<number>(-1)

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
    })
    setModo('corrigiendo')
    setErrorAccion(null)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        if (modo === 'corrigiendo') {
          setModo('lectura')
          setFormularioCorreccion(null)
        } else if (modo === 'desactivando') {
          setModo('lectura')
        } else if (modo === 'lectura') {
          onLimpiar()
        }
      } else if (productoConfirmado && modo === 'lectura' && event.key === 'ArrowRight') {
        event.preventDefault()
        setIndiceAccion(prev => (prev + 1) % 3)
      } else if (productoConfirmado && modo === 'lectura' && event.key === 'ArrowLeft') {
        event.preventDefault()
        setIndiceAccion(prev => (prev - 1 + 3) % 3)
      } else if (productoConfirmado && event.ctrlKey && event.key === 'Enter' && producto.estado === 'ACTIVO' && modo === 'lectura') {
        event.preventDefault()
        onNavegaAIngresos()
      } else if (productoConfirmado && event.ctrlKey && event.key === 'Delete' && producto.estado === 'ACTIVO' && modo === 'lectura') {
        event.preventDefault()
        setModo('desactivando')
      } else if (productoConfirmado && modo === 'lectura' && indiceAccion >= 0 && event.key === 'Enter') {
        event.preventDefault()
        switch (indiceAccion) {
          case 0:
            if (producto.estado === 'ACTIVO') onIniciarCorreccion()
            break
          case 1:
            if (producto.estado === 'ACTIVO') setModo('desactivando')
            break
          case 2:
            onLimpiar()
            break
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [modo, onLimpiar, productoConfirmado, onIniciarCorreccion, onNavegaAIngresos, indiceAccion, producto.estado])

  const onGuardarCorreccion = async (): Promise<void> => {
    if (!formularioCorreccion) return
    setGuardandoCambios(true)
    setErrorAccion(null)
    try {
      await modificarProductoComercial(formularioCorreccion)
      const productoActualizado: ProductoComercial = { ...producto, ...formularioCorreccion }
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

  const onReactivar = async (): Promise<void> => {
    setGuardandoCambios(true)
    setErrorAccion(null)
    try {
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
    <section className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="flex flex-col gap-4 px-5 py-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">
              {[producto.nombreComercial, producto.concentracion, producto.formaFarmaceutica]
                .filter(Boolean)
                .join(' · ')}
            </h2>
            <p className="mt-0.5 text-[12px] font-semibold text-slate-500">{producto.nombreFabricante}</p>
            <p className="text-[10px] text-slate-400">
              Creado {formatearFecha(producto.creadoEn)} · Modificado {formatearFecha(producto.modificadoEn)}
            </p>
            {producto.estado === 'INACTIVO' && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                INACTIVO
              </span>
            )}
          </div>
          {modo === 'lectura' && (
            <div className="flex flex-col gap-2">
              {producto.estado === 'ACTIVO' && (
                <div className="flex gap-2">
                  <button
                    ref={corregirRef}
                    type="button"
                    onClick={onIniciarCorreccion}
                    disabled={guardandoCambios || verificandoHistorial}
                    className={indiceAccion === 0
                      ? 'group relative rounded-xl border border-[#45b356] bg-[#F2F7F3] px-4 py-2 text-[12px] font-bold text-[#45b356] flex items-center gap-3'
                      : 'group relative rounded-xl border border-[#45b356]/40 px-4 py-2 text-[12px] font-bold text-[#45b356] hover:bg-[#F2F7F3] flex items-center gap-3'}
                  >
                    <span>CORREGIR</span>
                    <kbd className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#fef08a] bg-[#fefce8] px-1.5 py-0.5 text-[9px] font-bold leading-none text-[#713f12] opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">Ctrl+Enter</kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModo('desactivando')}
                    disabled={guardandoCambios}
                    className={indiceAccion === 1
                      ? 'group relative rounded-xl border border-red-400 bg-red-50 px-4 py-2 text-[12px] font-bold text-red-500 flex items-center gap-3'
                      : 'group relative rounded-xl border border-red-200 px-4 py-2 text-[12px] font-bold text-red-500 flex items-center gap-3'}
                  >
                    <span>DESACTIVAR</span>
                    <kbd className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#fef08a] bg-[#fefce8] px-1.5 py-0.5 text-[9px] font-bold leading-none text-[#713f12] opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">Ctrl+Supr</kbd>
                  </button>
                  <button
                    type="button"
                    onClick={onLimpiar}
                    className={indiceAccion === 2
                      ? 'group relative rounded-xl border border-[#f97316] bg-[#fff7ed] px-4 py-2 text-[12px] font-bold text-[#f97316] flex items-center gap-3'
                      : 'group relative rounded-xl border border-[#f97316]/40 px-4 py-2 text-[12px] font-bold text-[#f97316] hover:bg-[#fff7ed] flex items-center gap-3'}
                  >
                    <span>LIMPIAR</span>
                    <kbd className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#fef08a] bg-[#fefce8] px-1.5 py-0.5 text-[9px] font-bold leading-none text-[#713f12] opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">Esc</kbd>
                  </button>
                </div>
              )}
              {producto.estado === 'ACTIVO' && (
                <button
                  type="button"
                  onClick={onNavegaAIngresos}
                  className="text-[11px] font-bold text-[#0284C7] underline"
                >
                  Ir a INGRESOS para registrar un nuevo lote →
                </button>
              )}
              {producto.estado === 'INACTIVO' && (
                esAdmin ? (
                  <button
                    type="button"
                    onClick={() => void onReactivar()}
                    disabled={guardandoCambios}
                    className="w-fit rounded-xl bg-[#45b356] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#3a9e4a] disabled:opacity-50"
                  >
                    REACTIVAR
                  </button>
                ) : (
                  <p className="text-[11px] text-slate-400">Solo un administrador puede reactivar este producto</p>
                )
              )}
            </div>
          )}
        </header>

        {errorAccion !== null && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
            <span>{errorAccion}</span>
            <button type="button" onClick={() => setErrorAccion(null)}>X</button>
          </div>
        )}

        {modo === 'corrigiendo' && formularioCorreccion !== null && (
          <div className="flex flex-col gap-3">
            {tieneHistorial && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-600">
                Este producto tiene movimientos registrados. Los cambios quedarán registrados en el historial.
              </p>
            )}

            <label>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nombre comercial</span>
              <input
                value={formularioCorreccion.nombreComercial}
                onChange={(e) => setFormularioCorreccion(prev => prev ? { ...prev, nombreComercial: e.target.value } : prev)}
                className="h-[34px] w-full rounded-lg border border-[#E0F2FE] px-3 text-[13px] font-semibold text-slate-800 outline-none focus:border-[#0284C7]"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fabricante</span>
                <input
                  value={formularioCorreccion.nombreFabricante}
                  onChange={(e) => setFormularioCorreccion(prev => prev ? { ...prev, nombreFabricante: e.target.value } : prev)}
                  className="h-[34px] w-full rounded-lg border border-[#E0F2FE] px-3 text-[13px] font-semibold text-slate-800 outline-none focus:border-[#0284C7]"
                />
              </label>
              <label>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Titular</span>
                <input
                  value={formularioCorreccion.nombreTitular}
                  onChange={(e) => setFormularioCorreccion(prev => prev ? { ...prev, nombreTitular: e.target.value } : prev)}
                  className="h-[34px] w-full rounded-lg border border-[#E0F2FE] px-3 text-[13px] font-semibold text-slate-800 outline-none focus:border-[#0284C7]"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">País origen</span>
                <input
                  value={formularioCorreccion.paisOrigen}
                  onChange={(e) => setFormularioCorreccion(prev => prev ? { ...prev, paisOrigen: e.target.value } : prev)}
                  className="h-[34px] w-full rounded-lg border border-[#E0F2FE] px-3 text-[13px] font-semibold text-slate-800 outline-none focus:border-[#0284C7]"
                />
              </label>
              <label>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Registro sanitario</span>
                <input
                  value={formularioCorreccion.registroSanitario}
                  onChange={(e) => setFormularioCorreccion(prev => prev ? { ...prev, registroSanitario: e.target.value } : prev)}
                  className="h-[34px] w-full rounded-lg border border-[#E0F2FE] px-3 text-[13px] font-semibold text-slate-800 outline-none focus:border-[#0284C7]"
                />
              </label>
            </div>
            <label>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado del registro</span>
              <select
                value={formularioCorreccion.estadoRegistroSanitario ?? 'VIGENTE'}
                onChange={(e) => setFormularioCorreccion(prev => prev ? { ...prev, estadoRegistroSanitario: e.target.value as EstadoRegistroSanitario } : prev)}
                className="h-[34px] w-full rounded-lg border border-[#E0F2FE] px-3 text-[13px] font-semibold text-slate-800 outline-none focus:border-[#0284C7]"
              >
                <option value="VIGENTE">Vigente</option>
                <option value="SUSPENDIDO">Suspendido</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="VENCIDO">Vencido</option>
              </select>
            </label>
            <label>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Código DIGEMID</span>
              <input
                value={formularioCorreccion.codigoDIGEMID}
                onChange={(e) => setFormularioCorreccion(prev => prev ? { ...prev, codigoDIGEMID: e.target.value } : prev)}
                className="h-[34px] w-full rounded-lg border border-[#E0F2FE] px-3 text-[13px] font-semibold text-slate-800 outline-none focus:border-[#0284C7]"
              />
            </label>

            <div className="mt-1 border-t border-[#E0F2FE] pt-3 flex flex-col gap-3">
              <label>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">IFA (no editable)</span>
                <input readOnly value={producto.ifa} className="h-[34px] w-full cursor-not-allowed rounded-lg border border-[#E0F2FE] bg-slate-50 px-3 text-[13px] font-semibold text-slate-400" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Concentración (no editable)</span>
                  <input readOnly value={producto.concentracion} className="h-[34px] w-full cursor-not-allowed rounded-lg border border-[#E0F2FE] bg-slate-50 px-3 text-[13px] font-semibold text-slate-400" />
                </label>
                <label>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Forma farmacéutica (no editable)</span>
                  <input readOnly value={producto.formaFarmaceutica} className="h-[34px] w-full cursor-not-allowed rounded-lg border border-[#E0F2FE] bg-slate-50 px-3 text-[13px] font-semibold text-slate-400" />
                </label>
              </div>
              <label>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Condición de venta (no editable)</span>
                <input readOnly value={producto.condicionVenta} className="h-[34px] w-full cursor-not-allowed rounded-lg border border-[#E0F2FE] bg-slate-50 px-3 text-[13px] font-semibold text-slate-400" />
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModo('lectura')}
                className="rounded-xl border border-[#dc2626]/40 px-4 py-2 text-[12px] font-bold text-[#dc2626] hover:bg-[#fef2f2]"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={() => void onGuardarCorreccion()}
                disabled={guardandoCambios}
                className="rounded-xl bg-[#45b356] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#3a9e4a] disabled:opacity-50"
              >
                GUARDAR CORRECCIÓN
              </button>
            </div>
          </div>
        )}

        {modo === 'desactivando' && (
          <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-4">
            <p className="text-[13px] font-semibold text-slate-700">
              Vas a dar de baja «{producto.nombreComercial}». El producto quedará INACTIVO y no aparecerá en
              búsquedas ni ventas. El historial se conserva.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModo('lectura')}
                className="rounded-xl border border-[#dc2626]/40 px-4 py-2 text-[12px] font-bold text-[#dc2626] hover:bg-[#fef2f2]"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={() => void onConfirmarDesactivar()}
                disabled={guardandoCambios}
                className="rounded-xl bg-red-500 px-4 py-2 text-[12px] font-bold text-white"
              >
                CONFIRMAR BAJA
              </button>
            </div>
          </div>
        )}

        {modo === 'lectura' && productoPreview === null && (
          <>
            <TabsProducto tabActiva={tabActiva} onTabChange={onTabChange} />
            {cargando && <p className="text-[13px] font-semibold text-[#0284C7]">Cargando...</p>}
            {!cargando && tabActiva === 'detalle' && (
              <div className="space-y-3">
                <div>
                  <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    PARA LA VENTA
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <CampoLectura
                      label={LABEL_CAMPO['condicionVenta'].catalogo}
                      valor={LABEL_CONDICION_VENTA[producto.condicionVenta] ?? producto.condicionVenta}
                    />
                    <CampoLectura
                      label="Refrigerar"
                      valor={producto.requiereCadenaFrio ? 'Sí · cadena de frío' : 'No requiere'}
                    />
                    <CampoLectura
                      label="Con vencimiento"
                      valor={producto.requiereLote ? 'Sí · requiere lote' : 'Sin trazabilidad de lote'}
                    />
                    <CampoLectura label="Categoría" valor={categoriaProducto(producto)} />
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    IDENTIDAD DEL PRODUCTO
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <CampoLectura label={LABEL_CAMPO['ifa'].catalogo} valor={producto.ifa} />
                    <CampoLectura
                      label={LABEL_CAMPO['concentracion'].catalogo}
                      valor={producto.concentracion}
                    />
                    <CampoLectura
                      label={LABEL_CAMPO['formaFarmaceutica'].catalogo}
                      valor={LABEL_FORMA_FARMACEUTICA[producto.formaFarmaceutica ?? ''] ?? producto.formaFarmaceutica}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    REGISTRO Y PROCEDENCIA
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
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
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    PRESENTACIONES COMERCIALES
                  </h3>
                  {presentaciones.length > 0 ? (
                    <div className="space-y-2">
                      {presentaciones.map((presentacion) => (
                        <div key={presentacion.id} className="rounded-xl border border-[#E0F2FE] bg-white px-4 py-3">
                          <div className="text-[13px] font-bold text-slate-800">{presentacion.descripcion}</div>
                          {presentacion.codigoBarras && (
                            <div className="text-[11px] text-slate-500">Cód. barras {presentacion.codigoBarras}</div>
                          )}
                          <div className="text-[11px] text-slate-500">
                            Stock mínimo {presentacion.stockMinimo} {presentacion.unidadConteo}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-slate-400">Sin presentaciones registradas</p>
                  )}
                </div>

              </div>
            )}
            {!cargando && tabActiva === 'presentaciones' && <PresentacionesTab presentaciones={presentaciones} nodos={nodos} />}
            {!cargando && tabActiva === 'precios' && <PreciosTab nodos={nodos} />}
          </>
        )}
      </div>
    </section>
  )
}
