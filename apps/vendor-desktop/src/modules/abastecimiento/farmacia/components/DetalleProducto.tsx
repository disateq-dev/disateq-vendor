import { useCallback, useEffect, useState, type ReactElement } from 'react'
import type {
  NodoFraccionamiento,
  PresentacionComercial,
  ProductoComercial,
} from '../../../../domains/farmacia/types'
import type { CrearValorOperacionalInput, EstadoValorOperacional, ModificarValorOperacionalInput, TipoValorOperacional, ValorOperacionalFarmacia } from '../../../../domains/farmacia/types'
import { crearValorOperacional, modificarValorOperacional, obtenerValoresNodo } from '../../../../domains/farmacia/farmacia.service'
import type { TabDetalleFarmacia } from '../hooks/useCatalogoFarmacia'

interface DetalleProductoProps {
  producto: ProductoComercial
  presentaciones: PresentacionComercial[]
  nodos: NodoFraccionamiento[]
  tabActiva: TabDetalleFarmacia
  cargando: boolean
  onTabChange: (t: TabDetalleFarmacia) => void
  onVolver: () => void
}

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

function CampoLectura({ label, valor }: CampoLecturaProps): ReactElement {
  return (
    <div className="rounded-xl border border-[#EAF3DE] bg-white px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 min-h-5 text-[13px] font-semibold text-slate-800">{valor ?? '-'}</div>
    </div>
  )
}

function HeaderProducto({ producto }: HeaderProductoProps): ReactElement {
  return (
    <header className="rounded-2xl border border-[#EAF3DE] bg-white p-5">
      <h2 className="text-[20px] font-bold text-slate-900">
        {[producto.nombreComercial, producto.concentracion, producto.formaFarmaceutica].filter(Boolean).join(' · ')}
      </h2>
      <p className="mt-1 text-[13px] font-semibold text-slate-500">{producto.nombreFabricante}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {[producto.condicionVenta, categoriaProducto(producto)].map((chip) => (
          <span key={chip} className="rounded-full bg-[#EAF3DE] px-3 py-1 text-[10px] font-bold uppercase text-[#639922]">
            {chip}
          </span>
        ))}
        {producto.requiereLote && (
          <span className="rounded-full bg-[#EAF3DE] px-3 py-1 text-[10px] font-bold uppercase text-[#639922]">Lote</span>
        )}
        {producto.requiereCadenaFrio && (
          <span className="rounded-full bg-[#EAF3DE] px-3 py-1 text-[10px] font-bold uppercase text-[#639922]">
            Cadena de frío
          </span>
        )}
      </div>
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
    <nav className="flex gap-2 border-b border-[#EAF3DE]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 text-[12px] font-bold uppercase tracking-wide ${
            tabActiva === tab.id ? 'border-b-2 border-[#639922] text-[#639922]' : 'text-slate-500'
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
        <article key={presentacion.id} className="rounded-2xl border border-[#EAF3DE] bg-white p-4">
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
              className="rounded-full border border-[#EAF3DE] px-3 py-1.5 text-[11px] font-bold text-[#639922]"
            >
              Agregar forma de venta
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {nodos
              .filter((nodo) => nodo.presentacionId === presentacion.id)
              .map((nodo) => (
                <div key={nodo.id} className={`rounded-xl bg-[#EAF3DE] px-3 py-2 ${nodo.nodoPadreId ? 'ml-6' : ''}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-bold text-slate-800">{nodo.nombreFormaVenta}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-[#639922]">
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
    return <div className="text-[13px] font-semibold text-[#639922]">Cargando precios...</div>
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
          <article key={nodo.id} className="rounded-2xl border border-[#EAF3DE] bg-white p-4">
            <header className="flex justify-between items-center mb-3">
              <h3 className="text-[14px] font-bold text-slate-900">{nodo.nombreFormaVenta}</h3>
              {tiposNodoDisponibles.length > 0 &&
                formularioNuevo?.nodoId !== nodo.id &&
                formularioEdicion?.nodoId !== nodo.id && (
                  <button
                    type="button"
                    onClick={() => onAbrirFormularioNuevo(nodo.id)}
                    disabled={guardando}
                    className="rounded-full border border-[#639922] px-3 py-1 text-[11px] font-bold text-[#639922]"
                  >
                    + Precio
                  </button>
                )}
            </header>

            {valoresNodo.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-2 py-2 border-b border-[#EAF3DE] last:border-0">
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
                  <span className="text-[13px] font-bold text-[#639922]">S/ {v.valor.toFixed(2)}</span>
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
              <div className="mt-3 p-3 rounded-xl border border-[#639922]/30 bg-[#EAF3DE]/40 space-y-2">
                <select
                  value={formularioNuevo.tipo}
                  onChange={(event) => setFormularioNuevo({ ...formularioNuevo, tipo: event.target.value as TipoValorOperacional })}
                  className="w-full rounded-lg border border-[#EAF3DE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#639922]"
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
                  className="w-full rounded-lg border border-[#EAF3DE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#639922]"
                />
                {formularioNuevo.tipo === 'VENTA_MAYOREO' && (
                  <input
                    type="number"
                    placeholder="Cantidad mínima"
                    value={formularioNuevo.condicionMinima}
                    onChange={(event) => setFormularioNuevo({ ...formularioNuevo, condicionMinima: event.target.value })}
                    className="w-full rounded-lg border border-[#EAF3DE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#639922]"
                  />
                )}
                {formularioNuevo.tipo === 'VENTA_PROMOCION' && (
                  <input
                    type="date"
                    placeholder="Vigente hasta"
                    value={formularioNuevo.vigenciaHasta}
                    onChange={(event) => setFormularioNuevo({ ...formularioNuevo, vigenciaHasta: event.target.value })}
                    className="w-full rounded-lg border border-[#EAF3DE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#639922]"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void onGuardarNuevo()}
                    disabled={guardando}
                    className="rounded-lg bg-[#639922] px-3 py-1.5 text-[12px] font-bold text-white"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={onCancelar}
                    className="rounded-lg border border-[#EAF3DE] px-3 py-1.5 text-[12px] font-bold text-slate-500"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {formularioEdicion?.nodoId === nodo.id && (
              <div className="mt-3 p-3 rounded-xl border border-[#639922]/30 bg-[#EAF3DE]/40 space-y-2">
                <input
                  type="number"
                  value={formularioEdicion.valor}
                  onChange={(event) => setFormularioEdicion({ ...formularioEdicion, valor: event.target.value })}
                  className="w-full rounded-lg border border-[#EAF3DE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#639922]"
                />
                {valorEnEdicion?.tipo === 'VENTA_MAYOREO' && (
                  <input
                    type="number"
                    placeholder="Cantidad mínima"
                    value={formularioEdicion.condicionMinima}
                    onChange={(event) => setFormularioEdicion({ ...formularioEdicion, condicionMinima: event.target.value })}
                    className="w-full rounded-lg border border-[#EAF3DE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#639922]"
                  />
                )}
                {valorEnEdicion?.tipo === 'VENTA_PROMOCION' && (
                  <input
                    type="date"
                    value={formularioEdicion.vigenciaHasta}
                    onChange={(event) => setFormularioEdicion({ ...formularioEdicion, vigenciaHasta: event.target.value })}
                    className="w-full rounded-lg border border-[#EAF3DE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#639922]"
                  />
                )}
                <select
                  value={formularioEdicion.estado}
                  onChange={(event) => setFormularioEdicion({ ...formularioEdicion, estado: event.target.value as EstadoValorOperacional })}
                  className="w-full rounded-lg border border-[#EAF3DE] px-2 py-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#639922]"
                >
                  <option value="ACTIVO">Activa</option>
                  <option value="INACTIVO">Inactiva</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void onGuardarEdicion()}
                    disabled={guardando}
                    className="rounded-lg bg-[#639922] px-3 py-1.5 text-[12px] font-bold text-white"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={onCancelar}
                    className="rounded-lg border border-[#EAF3DE] px-3 py-1.5 text-[12px] font-bold text-slate-500"
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
  presentaciones,
  nodos,
  tabActiva,
  cargando,
  onTabChange,
  onVolver,
}: DetalleProductoProps): ReactElement {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-6 py-5">
      <button type="button" onClick={onVolver} className="w-fit text-[12px] font-bold text-[#639922]">
        ← Volver a búsqueda
      </button>
      <HeaderProducto producto={producto} />
      <TabsProducto tabActiva={tabActiva} onTabChange={onTabChange} />
      {cargando && <p className="text-[13px] font-semibold text-[#639922]">Cargando...</p>}
      {!cargando && tabActiva === 'detalle' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <CampoLectura label="IFA" valor={producto.ifa} />
          <CampoLectura label="Concentración" valor={producto.concentracion} />
          <CampoLectura label="Forma farmacéutica" valor={producto.formaFarmaceutica} />
          <CampoLectura label="Categoría" valor={categoriaProducto(producto)} />
          <CampoLectura label="Fabricante" valor={producto.nombreFabricante} />
          <CampoLectura label="Registro sanitario" valor={producto.registroSanitario} />
          <CampoLectura label="Código DIGEMID" valor={producto.codigoDIGEMID} />
        </div>
      )}
      {!cargando && tabActiva === 'presentaciones' && <PresentacionesTab presentaciones={presentaciones} nodos={nodos} />}
      {!cargando && tabActiva === 'precios' && <PreciosTab nodos={nodos} />}
    </section>
  )
}
