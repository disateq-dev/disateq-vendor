import { useEffect, useState, type ReactElement } from 'react'
import { PackagePlus, Truck } from 'lucide-react'
import { usePedidoProveedorStore } from '../../../domains/farmacia/pedido-proveedor'
import type { PedidoProveedor, LineaPedidoProveedor, EstadoPedidoProveedor, CrearPedidoProveedorInput, RecepcionLineaInput } from '../../../domains/farmacia/pedido-proveedor'
import { buscarPresentacionesParaIngreso, buscarProveedores } from '../../../domains/farmacia/farmacia.service'
import type { ResultadoBusquedaPresentacion, Proveedor } from '../../../domains/farmacia/types'
import { usePOS } from '../../../context/POSContext'

type ModoPanel = 'nuevo' | 'detalle' | 'recibiendo'

interface LineaNueva {
  presentacionId: string
  productoNombre: string
  presentacionDescripcion: string
  cantidadPedida: number
  costoUnitarioAcordado?: number
  requiereLote: boolean
}

export function PedidoProveedorWorkspace(): ReactElement {
  const store = usePedidoProveedorStore()
  const { activeOperator } = usePOS()
  const [modo, setModo] = useState<ModoPanel>('nuevo')
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoProveedor | null>(null)
  const [lineasDetalle, setLineasDetalle] = useState<LineaPedidoProveedor[]>([])
  const [filtroEstado, setFiltroEstado] = useState<EstadoPedidoProveedor | 'TODOS'>('TODOS')
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null)
  const [busquedaProveedor, setBusquedaProveedor] = useState<string>('')
  const [resultadosProveedor, setResultadosProveedor] = useState<Proveedor[]>([])
  const [referencia, setReferencia] = useState<string>('')
  const [fechaEsperada, setFechaEsperada] = useState<string>('')
  const [lineasNuevas, setLineasNuevas] = useState<LineaNueva[]>([])
  const [busquedaPresentacion, setBusquedaPresentacion] = useState<string>('')
  const [resultadosPresentacion, setResultadosPresentacion] = useState<ResultadoBusquedaPresentacion[]>([])
  const [cantidadesRecepcion, setCantidadesRecepcion] = useState<Record<string, string>>({})
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  useEffect(() => { void store.cargarPedidos() }, [])
  useEffect(() => { void store.cargarPendientesPorPresentacion() }, [])

  useEffect(() => {
    if (busquedaProveedor.trim().length < 2) { setResultadosProveedor([]); return }
    const timer = setTimeout(() => {
      void buscarProveedores(busquedaProveedor, true).then(setResultadosProveedor)
    }, 300)
    return () => clearTimeout(timer)
  }, [busquedaProveedor])

  useEffect(() => {
    if (busquedaPresentacion.trim().length < 2) { setResultadosPresentacion([]); return }
    const timer = setTimeout(() => {
      void buscarPresentacionesParaIngreso(busquedaPresentacion).then(setResultadosPresentacion)
    }, 300)
    return () => clearTimeout(timer)
  }, [busquedaPresentacion])

  async function onSeleccionarPedidoAsync(pedido: PedidoProveedor): Promise<void> {
    setPedidoSeleccionado(pedido)
    setModo('detalle')
    setErrorLocal(null)
    await store.cargarLineas(pedido.id)
    setLineasDetalle(usePedidoProveedorStore.getState().lineasPorPedido[pedido.id] ?? [])
  }

  function onNuevoPedido(): void {
    setPedidoSeleccionado(null)
    setModo('nuevo')
    setProveedorSeleccionado(null)
    setBusquedaProveedor('')
    setResultadosProveedor([])
    setReferencia('')
    setFechaEsperada('')
    setLineasNuevas([])
    setBusquedaPresentacion('')
    setResultadosPresentacion([])
    setErrorLocal(null)
  }

  function onAgregarLinea(resultado: ResultadoBusquedaPresentacion): void {
    if (lineasNuevas.some(l => l.presentacionId === resultado.presentacionId)) return
    setLineasNuevas(prev => [...prev, {
      presentacionId: resultado.presentacionId,
      productoNombre: resultado.productoNombre,
      presentacionDescripcion: resultado.descripcion,
      cantidadPedida: 1,
      requiereLote: resultado.requiereLote,
    }])
    setBusquedaPresentacion('')
    setResultadosPresentacion([])
  }

  function onEliminarLinea(presentacionId: string): void {
    setLineasNuevas(prev => prev.filter(l => l.presentacionId !== presentacionId))
  }

  function onCantidadLineaChange(presentacionId: string, valor: string): void {
    const n = parseFloat(valor)
    setLineasNuevas(prev => prev.map(l =>
      l.presentacionId === presentacionId
        ? { ...l, cantidadPedida: Number.isFinite(n) && n > 0 ? n : l.cantidadPedida }
        : l
    ))
  }

  async function onGuardarPedido(): Promise<void> {
    if (!proveedorSeleccionado) { setErrorLocal('Selecciona un proveedor'); return }
    if (lineasNuevas.length === 0) { setErrorLocal('Agrega al menos una línea'); return }
    setErrorLocal(null)
    const input: CrearPedidoProveedorInput = {
      proveedorId: proveedorSeleccionado.id,
      operadorId: activeOperator?.id ?? '',
      referencia: referencia.trim() || undefined,
      fechaEsperada: fechaEsperada || undefined,
      lineas: lineasNuevas.map(l => ({
        presentacionId: l.presentacionId,
        productoNombre: l.productoNombre,
        presentacionDescripcion: l.presentacionDescripcion,
        cantidadPedida: l.cantidadPedida,
        costoUnitarioAcordado: l.costoUnitarioAcordado,
        requiereLote: l.requiereLote,
      })),
    }
    try {
      await store.crearPedido(input)
      onNuevoPedido()
    } catch (e) {
      setErrorLocal(e instanceof Error ? e.message : String(e))
    }
  }

  async function onConfirmar(): Promise<void> {
    if (!pedidoSeleccionado) return
    try {
      await store.confirmar(pedidoSeleccionado.id)
      const actualizado = usePedidoProveedorStore.getState().pedidos.find(p => p.id === pedidoSeleccionado.id)
      if (actualizado) setPedidoSeleccionado(actualizado)
    } catch (e) { setErrorLocal(e instanceof Error ? e.message : String(e)) }
  }

  async function onMarcarTransito(): Promise<void> {
    if (!pedidoSeleccionado) return
    try {
      await store.marcarTransito(pedidoSeleccionado.id)
      const actualizado = usePedidoProveedorStore.getState().pedidos.find(p => p.id === pedidoSeleccionado.id)
      if (actualizado) setPedidoSeleccionado(actualizado)
    } catch (e) { setErrorLocal(e instanceof Error ? e.message : String(e)) }
  }

  async function onCancelarPedido(): Promise<void> {
    if (!pedidoSeleccionado) return
    try {
      await store.cancelar(pedidoSeleccionado.id)
      const actualizado = usePedidoProveedorStore.getState().pedidos.find(p => p.id === pedidoSeleccionado.id)
      if (actualizado) setPedidoSeleccionado(actualizado)
    } catch (e) { setErrorLocal(e instanceof Error ? e.message : String(e)) }
  }

  function onIniciarRecepcion(): void {
    const init: Record<string, string> = {}
    lineasDetalle.forEach(l => { init[l.id] = '' })
    setCantidadesRecepcion(init)
    setModo('recibiendo')
    setErrorLocal(null)
  }

  async function onConfirmarRecepcion(): Promise<void> {
    if (!pedidoSeleccionado) return
    const recepciones: RecepcionLineaInput[] = Object.entries(cantidadesRecepcion)
      .map(([lineaId, val]) => ({ lineaId, cantidadRecibidaAhora: parseFloat(val) || 0 }))
      .filter(r => r.cantidadRecibidaAhora > 0)
    if (recepciones.length === 0) { setErrorLocal('Ingresa al menos una cantidad'); return }
    try {
      await store.recibirLineas(pedidoSeleccionado.id, recepciones)
      const actualizado = usePedidoProveedorStore.getState().pedidos.find(p => p.id === pedidoSeleccionado.id)
      if (actualizado) setPedidoSeleccionado(actualizado)
      setLineasDetalle(usePedidoProveedorStore.getState().lineasPorPedido[pedidoSeleccionado.id] ?? [])
      setModo('detalle')
      setErrorLocal(null)
    } catch (e) { setErrorLocal(e instanceof Error ? e.message : String(e)) }
  }

  const pedidosFiltrados = filtroEstado === 'TODOS'
    ? store.pedidos
    : store.pedidos.filter(p => p.estado === filtroEstado)

  function colorEstado(estado: EstadoPedidoProveedor): string {
    switch (estado) {
      case 'BORRADOR': return 'bg-[#e4e4e7] text-[#52525b]'
      case 'CONFIRMADO': return 'bg-[#dbeafe] text-[#1d4ed8]'
      case 'EN_TRANSITO': return 'bg-[#fef9c3] text-[#854d0e]'
      case 'RECIBIDO_PARCIAL': return 'bg-[#ffedd5] text-[#9a3412]'
      case 'RECIBIDO': return 'bg-[#dcfce7] text-[#166534]'
      case 'CANCELADO': return 'bg-[#fee2e2] text-[#991b1b]'
    }
  }

  function etiquetaEstado(estado: EstadoPedidoProveedor): string {
    switch (estado) {
      case 'BORRADOR': return 'Borrador'
      case 'CONFIRMADO': return 'Confirmado'
      case 'EN_TRANSITO': return 'En tránsito'
      case 'RECIBIDO_PARCIAL': return 'Recibido parcial'
      case 'RECIBIDO': return 'Recibido'
      case 'CANCELADO': return 'Cancelado'
    }
  }

  return (
    <div className="flex min-h-0 flex-1 gap-2">
      <div className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#1E88C7]/50 bg-[#FDFCF9]">
        <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#1E88C7]/15 bg-[#E3F1FA]/60 px-4">
          <PackagePlus size={13} strokeWidth={2} className="text-[#1E88C7]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416]">PEDIDOS</span>
        </div>
        <div className="shrink-0 px-3 pt-2 pb-1">
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value as EstadoPedidoProveedor | 'TODOS')} className="w-full rounded-lg border border-[#e4eaea] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#374151] focus:outline-none focus:border-[#1E88C7]/60">
            <option value="TODOS">Todos los estados</option><option value="BORRADOR">Borrador</option><option value="CONFIRMADO">Confirmado</option><option value="EN_TRANSITO">En tránsito</option><option value="RECIBIDO_PARCIAL">Recibido parcial</option><option value="RECIBIDO">Recibido</option><option value="CANCELADO">Cancelado</option>
          </select>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {store.cargando && <p className="px-3 py-8 text-center text-[11px] text-[#9ca3af]">Cargando...</p>}
          {!store.cargando && pedidosFiltrados.length === 0 && <p className="px-3 py-8 text-center text-[11px] text-[#9ca3af]">Sin pedidos</p>}
          {pedidosFiltrados.map(pedido => (
            <button key={pedido.id} type="button" onClick={() => void onSeleccionarPedidoAsync(pedido)} className={`mb-1 w-full rounded-xl px-3 py-2.5 text-left transition ${pedidoSeleccionado?.id === pedido.id ? 'bg-[#1E88C7]/10 ring-1 ring-inset ring-[#1E88C7]/25' : 'hover:bg-[#1E88C7]/5'}`}>
              <div className="mb-1 flex items-center justify-between gap-2"><span className="truncate text-[12px] font-bold text-[#1f2937]">{pedido.proveedorNombre}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${colorEstado(pedido.estado)}`}>{etiquetaEstado(pedido.estado)}</span></div>
              {pedido.referencia && <p className="truncate text-[10px] text-[#6b7280]">Ref: {pedido.referencia}</p>}
              {pedido.fechaEsperada && <p className="text-[10px] text-[#6b7280]">Llega: {pedido.fechaEsperada}</p>}
              <p className="mt-0.5 text-[10px] text-[#b0bac8]">{pedido.creadoEn.slice(0, 10)}</p>
            </button>
          ))}
        </div>
        <div className="shrink-0 border-t border-[#1E88C7]/10 p-2"><button type="button" onClick={onNuevoPedido} className="w-full rounded-xl border border-[#45b356]/40 px-3 py-2 text-[11px] font-bold text-[#45b356] transition hover:bg-[#F2F7F3]">+ NUEVO PEDIDO</button></div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#1E88C7]/50 bg-[#FDFCF9]">
        <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#1E88C7]/15 bg-[#E3F1FA]/60 px-4"><Truck size={13} strokeWidth={2} className="text-[#1E88C7]" /><span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416]">{modo === 'nuevo' && 'NUEVO PEDIDO'}{modo === 'detalle' && pedidoSeleccionado?.proveedorNombre}{modo === 'recibiendo' && 'RECIBIR MERCADERÍA'}</span></div>
        {(errorLocal ?? store.error) && <div className="shrink-0 mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600">{errorLocal ?? store.error}</div>}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {modo === 'nuevo' && <div className="flex flex-col gap-4">
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">PROVEEDOR</p>
              {proveedorSeleccionado ? (
                <div className="flex items-center justify-between rounded-xl border border-[#e4eaea] bg-white px-3 py-2">
                  <div><p className="text-[12px] font-bold text-[#1f2937]">{proveedorSeleccionado.razonSocial}</p>{proveedorSeleccionado.ruc && <p className="text-[10px] text-[#9ca3af]">RUC {proveedorSeleccionado.ruc}</p>}</div>
                  <button type="button" onClick={() => setProveedorSeleccionado(null)} className="text-[11px] text-[#9ca3af]">✕</button>
                </div>
              ) : (
                <div className="relative">
                  <input type="text" value={busquedaProveedor} onChange={e => setBusquedaProveedor(e.target.value)} placeholder="Buscar proveedor por nombre o RUC..." className="h-9 w-full rounded-xl border border-[#e4eaea] bg-white px-3 text-[12px] focus:outline-none focus:border-[#1E88C7]/60" />
                  {resultadosProveedor.length > 0 && (
                    <div className="absolute left-0 right-0 top-10 z-10 rounded-xl border border-[#e4eaea] bg-white shadow-lg">
                      {resultadosProveedor.map(p => (
                        <button key={p.id} type="button" onClick={() => { setProveedorSeleccionado(p); setBusquedaProveedor(''); setResultadosProveedor([]) }} className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#E3F1FA]/60">
                          <span className="font-semibold text-[#1f2937]">{p.razonSocial}</span>{p.ruc && <span className="ml-2 text-[10px] text-[#9ca3af]">{p.ruc}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3"><label><span className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">REFERENCIA</span><input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Nº orden, nota..." className="mt-1 h-9 w-full rounded-xl border border-[#e4eaea] bg-white px-3 text-[12px] focus:outline-none focus:border-[#1E88C7]/60" /></label><label><span className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">FECHA ESPERADA</span><input type="date" value={fechaEsperada} onChange={e => setFechaEsperada(e.target.value)} className="mt-1 h-9 w-full rounded-xl border border-[#e4eaea] bg-white px-3 text-[12px] focus:outline-none focus:border-[#1E88C7]/60" /></label></div>
            <div><p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">AGREGAR PRODUCTOS</p><div className="relative"><input type="text" value={busquedaPresentacion} onChange={e => setBusquedaPresentacion(e.target.value)} placeholder="Buscar producto por nombre..." className="h-9 w-full rounded-xl border border-[#e4eaea] bg-white px-3 text-[12px] focus:outline-none focus:border-[#1E88C7]/60" />{resultadosPresentacion.length > 0 && <div className="absolute left-0 right-0 top-10 z-10 rounded-xl border border-[#e4eaea] bg-white shadow-lg">{resultadosPresentacion.map(r => <button key={r.presentacionId} type="button" onClick={() => onAgregarLinea(r)} className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#E3F1FA]/60"><p className="font-semibold text-[#1f2937]">{r.productoNombre}</p><p className="text-[10px] text-[#9ca3af]">{r.descripcion} · {r.fabricante}</p></button>)}</div>}</div></div>
            {lineasNuevas.length > 0 && <div className="flex flex-col gap-1.5"><p className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">LÍNEAS DEL PEDIDO</p>{lineasNuevas.map(linea => <div key={linea.presentacionId} className="flex items-center gap-3 rounded-xl border border-[#e4eaea] bg-white px-3 py-2"><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold text-[#1f2937]">{linea.productoNombre}</p><p className="truncate text-[10px] text-[#9ca3af]">{linea.presentacionDescripcion}</p></div><input type="number" value={linea.cantidadPedida} onChange={e => onCantidadLineaChange(linea.presentacionId, e.target.value)} min="1" className="w-20 rounded-lg border border-[#e4eaea] bg-white px-2 py-1 text-center text-[12px]" /><button type="button" onClick={() => onEliminarLinea(linea.presentacionId)} className="text-[#d1d5db] hover:text-red-400">✕</button></div>)}</div>}
          </div>}
          {modo === 'detalle' && pedidoSeleccionado && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#e4eaea] bg-white px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]">ESTADO</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${colorEstado(pedidoSeleccionado.estado)}`}>{etiquetaEstado(pedidoSeleccionado.estado)}</span></div>
                <div className="rounded-xl border border-[#e4eaea] bg-white px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]">REFERENCIA</p><p className="mt-1 text-[11px] font-semibold text-[#1f2937]">{pedidoSeleccionado.referencia ?? '—'}</p></div>
                <div className="rounded-xl border border-[#e4eaea] bg-white px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]">FECHA ESPERADA</p><p className="mt-1 text-[11px] font-semibold text-[#1f2937]">{pedidoSeleccionado.fechaEsperada ?? '—'}</p></div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">LÍNEAS</p>
                {store.cargando ? <p className="text-[11px] text-[#9ca3af]">Cargando líneas...</p> : lineasDetalle.length === 0 ? <p className="text-[11px] text-[#9ca3af]">Sin líneas</p> : (
                  <div className="flex flex-col gap-1.5">
                    {lineasDetalle.map(linea => {
                      const pendiente = linea.cantidadPedida - linea.cantidadRecibida
                      return (
                        <div key={linea.id} className="flex items-center gap-3 rounded-xl border border-[#e4eaea] bg-white px-3 py-2">
                          <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold text-[#1f2937]">{linea.productoNombre}</p><p className="truncate text-[10px] text-[#9ca3af]">{linea.presentacionDescripcion}</p></div>
                          <div className="shrink-0 text-right"><p className="text-[12px] font-bold tabular-nums text-[#1f2937]">{linea.cantidadRecibida}/{linea.cantidadPedida}</p>{pendiente > 0 && <p className="text-[10px] tabular-nums text-amber-600">faltan {pendiente}</p>}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          {modo === 'recibiendo' && pedidoSeleccionado && <div className="flex flex-col gap-3"><p className="text-[11px] text-[#6b7280]">Ingresa las cantidades recibidas. Deja en 0 las líneas que no llegaron.</p>{lineasDetalle.filter(l => l.cantidadPedida > l.cantidadRecibida).map(linea => { const pendiente = linea.cantidadPedida - linea.cantidadRecibida; return <div key={linea.id} className="flex items-center gap-3 rounded-xl border border-[#e4eaea] bg-white px-3 py-2"><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold text-[#1f2937]">{linea.productoNombre}</p><p className="truncate text-[10px] text-[#9ca3af]">{linea.presentacionDescripcion}</p><p className="text-[10px] text-amber-600">Faltan {pendiente}</p></div><input type="number" value={cantidadesRecepcion[linea.id] ?? ''} onChange={e => setCantidadesRecepcion(prev => ({ ...prev, [linea.id]: e.target.value }))} placeholder="0" min="0" max={pendiente} className="w-24 rounded-lg border border-[#e4eaea] bg-white px-2 py-1.5 text-center text-[12px]" /></div> })}</div>}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-[#1E88C7]/10 px-5 py-3">
          {modo === 'nuevo' && <><button type="button" onClick={onNuevoPedido} className="rounded-xl border border-[#f97316]/40 px-4 py-2 text-[12px] font-bold text-[#f97316] hover:bg-[#fff7ed]">CANCELAR</button><button type="button" onClick={() => void onGuardarPedido()} disabled={store.cargando} className="rounded-xl bg-[#45b356] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50">GUARDAR PEDIDO</button></>}
          {modo === 'detalle' && pedidoSeleccionado && <>{pedidoSeleccionado.estado === 'BORRADOR' && <><button type="button" onClick={() => void onCancelarPedido()} className="rounded-xl border border-[#dc2626]/40 px-4 py-2 text-[12px] font-bold text-[#dc2626]">CANCELAR PEDIDO</button><button type="button" onClick={() => void onConfirmar()} disabled={store.cargando} className="rounded-xl bg-[#45b356] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50">CONFIRMAR</button></>}{pedidoSeleccionado.estado === 'CONFIRMADO' && <><button type="button" onClick={() => void onCancelarPedido()} className="rounded-xl border border-[#dc2626]/40 px-4 py-2 text-[12px] font-bold text-[#dc2626]">CANCELAR PEDIDO</button><button type="button" onClick={() => void onMarcarTransito()} disabled={store.cargando} className="rounded-xl border border-[#45b356]/40 px-4 py-2 text-[12px] font-bold text-[#45b356] disabled:opacity-50">MARCAR EN TRÁNSITO</button><button type="button" onClick={onIniciarRecepcion} className="rounded-xl bg-[#45b356] px-4 py-2 text-[12px] font-bold text-white">RECIBIR MERCADERÍA</button></>}{(pedidoSeleccionado.estado === 'EN_TRANSITO' || pedidoSeleccionado.estado === 'RECIBIDO_PARCIAL') && <>{pedidoSeleccionado.estado === 'EN_TRANSITO' && <button type="button" onClick={() => void onCancelarPedido()} className="rounded-xl border border-[#dc2626]/40 px-4 py-2 text-[12px] font-bold text-[#dc2626]">CANCELAR PEDIDO</button>}<button type="button" onClick={onIniciarRecepcion} className="rounded-xl bg-[#45b356] px-4 py-2 text-[12px] font-bold text-white">RECIBIR MERCADERÍA</button></>}</>}
          {modo === 'recibiendo' && <><button type="button" onClick={() => { setModo('detalle'); setErrorLocal(null) }} className="rounded-xl border border-[#f97316]/40 px-4 py-2 text-[12px] font-bold text-[#f97316]">CANCELAR</button><button type="button" onClick={() => void onConfirmarRecepcion()} disabled={store.cargando} className="rounded-xl bg-[#45b356] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50">CONFIRMAR RECEPCIÓN</button></>}
        </div>
      </div>
    </div>
  )
}
