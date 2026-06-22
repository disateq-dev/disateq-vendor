import { Boxes, Package } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactElement } from 'react'
import type { Lote, ResumenInventarioFarmacia } from '../../../domains/farmacia/types'
import { modificarStockMinimo, obtenerInventarioFarmacia, obtenerLotesVigentes } from '../../../domains/farmacia/farmacia.service'

function estadoDisponibilidad(total: number, stockMinimo: number): 'DISPONIBLE' | 'BAJO_STOCK' | 'AGOTADO' {
  if (total <= 0) return 'AGOTADO'
  if (total <= stockMinimo) return 'BAJO_STOCK'
  return 'DISPONIBLE'
}

export function InventarioFarmaciaWorkspace(): ReactElement {
  const [inventario, setInventario] = useState<ResumenInventarioFarmacia[]>([])
  const [cargando, setCargando] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState<string>('')
  const [seleccionado, setSeleccionado] = useState<ResumenInventarioFarmacia | null>(null)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [cargandoLotes, setCargandoLotes] = useState<boolean>(false)
  const [umbralEdicion, setUmbralEdicion] = useState<string>('')
  const [guardandoUmbral, setGuardandoUmbral] = useState<boolean>(false)

  const inventarioFiltrado = busqueda === ''
    ? inventario
    : inventario.filter((item) => item.nombreComercial.toLowerCase().includes(busqueda.toLowerCase()))

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const resultado = await obtenerInventarioFarmacia()
      setInventario(resultado)
    } catch (cargaError) {
      setError(cargaError instanceof Error ? cargaError.message : String(cargaError))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const onSeleccionar = useCallback(async (item: ResumenInventarioFarmacia): Promise<void> => {
    setSeleccionado(item)
    setUmbralEdicion(item.stockMinimo.toString())
    if (!item.requiereLote) {
      setLotes([])
      return
    }
    setCargandoLotes(true)
    try {
      const resultado = await obtenerLotesVigentes(item.presentacionId)
      setLotes(resultado)
    } catch {
      setLotes([])
    } finally {
      setCargandoLotes(false)
    }
  }, [])

  const onGuardarUmbral = useCallback(async (): Promise<void> => {
    if (seleccionado === null) return
    const stockMinimo = parseFloat(umbralEdicion)
    if (Number.isNaN(stockMinimo) || stockMinimo < 0) return
    setGuardandoUmbral(true)
    try {
      await modificarStockMinimo(seleccionado.presentacionId, stockMinimo)
      const resultado = await obtenerInventarioFarmacia()
      setInventario(resultado)
      const actualizado = resultado.find((item) => item.presentacionId === seleccionado.presentacionId)
      if (actualizado) setSeleccionado(actualizado)
    } catch {
    } finally {
      setGuardandoUmbral(false)
    }
  }, [seleccionado, umbralEdicion])

  function diasHastaVencimiento(fecha: string): number {
    return Math.floor((new Date(fecha).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <section className="flex min-h-0 flex-1 gap-2">
      <div className="flex flex-[35] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#639922]/50 bg-[#FDFCF9]">
        <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 border-b bg-[#EAF3DE]/60 border-[#639922]/15">
          <Boxes size={13} strokeWidth={2} className="shrink-0 text-[#639922]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight leading-none text-[#121416]">INVENTARIO</span>
        </div>
        <div className="px-3 pt-3 pb-2 shrink-0">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            className="w-full h-9 rounded-xl border border-[#EAF3DE] bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#639922]"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {cargando && <div className="px-4 py-6 text-[13px] font-semibold text-[#639922]">Cargando...</div>}
          {error && <div className="px-4 py-6 text-[13px] text-red-500">{error}</div>}
          {!cargando && !error && inventarioFiltrado.map((item) => {
            const estado = estadoDisponibilidad(item.totalDisponible, item.stockMinimo)
            return (
              <button
                key={item.presentacionId}
                type="button"
                onClick={() => void onSeleccionar(item)}
                className={`w-full text-left px-4 py-3 border-b border-[#EAF3DE] transition ${
                  item.presentacionId === seleccionado?.presentacionId ? 'bg-[#EAF3DE]/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[12px] font-bold text-slate-900">{item.nombreComercial}</p>
                    <p className="text-[11px] font-semibold text-slate-500">{item.descripcion}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                      estado === 'DISPONIBLE'
                        ? 'bg-[#EAF3DE] text-[#639922]'
                        : estado === 'BAJO_STOCK'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-red-100 text-red-500'
                    }`}
                  >
                    {estado === 'DISPONIBLE' ? 'Disponible' : estado === 'BAJO_STOCK' ? 'Bajo stock' : 'Agotado'}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">
                  {item.totalDisponible.toFixed(0)} unidades disponibles
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-[65] flex-col overflow-hidden rounded-[28px] border border-[#639922]/30 bg-[#FDFCF9]">
        <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 border-b bg-[#EAF3DE]/60 border-[#639922]/15">
          <Package size={13} strokeWidth={2} className="shrink-0 text-[#639922]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight leading-none text-[#121416]">DETALLE</span>
        </div>
        <div className="min-h-0 flex-1 flex flex-col overflow-auto">
          {seleccionado === null && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3DE] text-[#639922]">
                <Package size={28} />
              </span>
              <p className="text-[13px] font-semibold text-slate-400">
                Selecciona un producto para ver su disponibilidad
              </p>
            </div>
          )}

          {seleccionado !== null && (
            <div className="px-6 py-5 space-y-5">
              <div className="rounded-2xl border border-[#EAF3DE] bg-white p-5">
                <h2 className="text-[18px] font-bold text-slate-900">{seleccionado.nombreComercial}</h2>
                <p className="text-[13px] font-semibold text-slate-500">{seleccionado.descripcion}</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-[22px] font-bold text-[#639922]">{seleccionado.totalDisponible.toFixed(0)}</span>
                  <span className="text-[13px] font-semibold text-slate-500">
                    unidades disponibles · {seleccionado.unidadConteo}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-[#EAF3DE] bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">ALERTA DE STOCK MÍNIMO</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={umbralEdicion}
                    onChange={(event) => setUmbralEdicion(event.target.value)}
                    className="h-9 w-24 rounded-lg border border-[#EAF3DE] px-3 text-[13px] font-semibold text-slate-700 outline-none focus:border-[#639922]"
                  />
                  <span className="text-[12px] font-semibold text-slate-500">unidades</span>
                  <button
                    type="button"
                    onClick={() => void onGuardarUmbral()}
                    disabled={guardandoUmbral}
                    className="rounded-lg bg-[#639922] px-3 py-1.5 text-[12px] font-bold text-white"
                  >
                    Guardar
                  </button>
                </div>
              </div>

              {!seleccionado.requiereLote && (
                <div className="rounded-xl border border-[#EAF3DE] bg-white p-4">
                  <p className="text-[12px] font-semibold text-slate-400">Este producto no requiere control por lote</p>
                </div>
              )}

              {seleccionado.requiereLote && (
                <div className="rounded-2xl border border-[#EAF3DE] bg-white p-4">
                  <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-3">LOTES VIGENTES</h3>
                  {cargandoLotes && <p className="text-[12px] font-semibold text-[#639922]">Cargando lotes...</p>}
                  {!cargandoLotes && lotes.length === 0 && (
                    <p className="text-[12px] font-semibold text-slate-400">Sin lotes vigentes registrados</p>
                  )}
                  {!cargandoLotes && lotes.length > 0 && lotes.map((lote) => {
                    const dias = diasHastaVencimiento(lote.fechaVencimiento)
                    return (
                      <div key={lote.id} className="py-2 border-b border-[#EAF3DE] last:border-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[12px] font-bold text-slate-800">{lote.numeroLote}</p>
                            {lote.fechaVencimiento && dias < 30 && dias >= 0 && (
                              <p className="text-[10px] font-bold text-orange-500">Vence pronto</p>
                            )}
                            {lote.fechaVencimiento && dias < 0 && (
                              <p className="text-[10px] font-bold text-red-500">Vencido</p>
                            )}
                            {lote.fechaVencimiento && dias >= 30 && (
                              <p className="text-[11px] text-slate-400">{lote.fechaVencimiento}</p>
                            )}
                          </div>
                          <span className="text-[13px] font-bold text-[#639922]">
                            {lote.cantidadDisponible.toFixed(0)} unid
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
