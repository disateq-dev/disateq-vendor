import { useState } from "react"
import { BookOpen, Plus, Tag, Package, Check, AlertCircle, Pencil, Trash2 } from "lucide-react"
import { getAllHOVs, guardarHOV, existeHOVActiva } from "../../domains/catalog/hov.store"
import { crearHOV, suspenderHOV, actualizarCostoBase } from "../../domains/catalog/hov.service"
import { crearValor, suspenderValor } from "../../domains/catalog/valor-operacional.service"
import { getValoresPorHOV } from "../../domains/catalog/valor-operacional.store"
import { inventoryService } from "../../domains/inventory/service"
import { useInventoryStore } from "../../domains/inventory/store"
import { loadBusinessConfig } from "../../config/business"
import { RUBROS } from "../../data/catalogs"
import type { HOV } from "../../domains/catalog/hov.types"

type PanelDerecho =
  | "vacio"
  | "nuevo-recurso"
  | "presentaciones"
  | "nueva-presentacion"
  | "editar-presentacion"
  | "editar-recurso"
  | "retirar-recurso"

interface RecursoAgrupado {
  productoId: string
  nombre: string
  hovsActivas: HOV[]
  hovsTotales: HOV[]
  estadoItem: 'ACTIVO' | 'RETIRADO'
}

function agruparRecursos(): RecursoAgrupado[] {
  const todas = getAllHOVs()
  const todosItems = useInventoryStore.getState().items.filter(i => !i.eliminado)

  const mapa = new Map<string, HOV[]>()
  for (const hov of todas) {
    const grupo = mapa.get(hov.productoId) ?? []
    grupo.push(hov)
    mapa.set(hov.productoId, grupo)
  }

  const resultado: RecursoAgrupado[] = []

  for (const item of todosItems) {
    const hovs = mapa.get(item.itemId) ?? []
    const hovsActivas = hovs.filter(h => h.estado === 'ACTIVA')
    resultado.push({
      productoId: item.itemId,
      nombre: item.nombre,
      hovsActivas,
      hovsTotales: hovs,
      estadoItem: item.estado ?? 'ACTIVO',
    })
  }

  return resultado.sort((a, b) => {
    if (a.estadoItem === 'RETIRADO' && b.estadoItem !== 'RETIRADO') return 1
    if (a.estadoItem !== 'RETIRADO' && b.estadoItem === 'RETIRADO') return -1
    return a.nombre.localeCompare(b.nombre)
  })
}

export function CatalogoWorkspace() {
  const [selectedProductoId, setSelectedProductoId] = useState<string | null>(null)
  const [panel, setPanel] = useState<PanelDerecho>("vacio")
  const [editingHovId, setEditingHovId] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const refresh = () => setTick(t => t + 1)

  void tick

  const recursos = agruparRecursos()
  const recursoSeleccionado = recursos.find(r => r.productoId === selectedProductoId) ?? null

  return (
    <section className="flex min-h-0 flex-1 gap-2">
      <PanelIzquierdo
        recursos={recursos}
        selectedProductoId={selectedProductoId}
        onSelect={(id) => { setSelectedProductoId(id); setPanel("presentaciones") }}
        onNuevo={() => { setSelectedProductoId(null); setPanel("nuevo-recurso") }}
      />
      <PanelDerechoContainer
        panel={panel}
        setPanel={setPanel}
        selectedProductoId={selectedProductoId}
        setSelectedProductoId={setSelectedProductoId}
        editingHovId={editingHovId}
        setEditingHovId={setEditingHovId}
        recursoSeleccionado={recursoSeleccionado}
        refresh={refresh}
      />
    </section>
  )
}

function PanelIzquierdo({
  recursos, selectedProductoId, onSelect, onNuevo,
}: {
  recursos: RecursoAgrupado[]
  selectedProductoId: string | null
  onSelect: (id: string) => void
  onNuevo: () => void
}) {
  const [busqueda, setBusqueda] = useState("")

  const recursosFiltrados = busqueda.trim()
    ? recursos.filter(r =>
        r.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .includes(busqueda.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
      )
    : recursos

  return (
    <div className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/30 bg-[#F8FDFF]">

      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#2A7CA8]/15 bg-[#EEF6FB] px-4">
        <BookOpen size={13} strokeWidth={2} className="text-[#2A7CA8]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">
          GESTOR DE CATÁLOGO
        </span>
        {recursos.length > 0 && (
          <span className="ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold tabular-nums bg-[#2A7CA8]/10 text-[#2A7CA8]">
            {recursos.length}
          </span>
        )}
      </div>

      <button
        onClick={onNuevo}
        className="shrink-0 flex w-full items-center gap-1.5 border-b border-[#2A7CA8]/10
                   bg-[#EEF6FB] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide
                   text-[#2A7CA8] hover:bg-[#ddeef7] transition"
      >
        <Plus size={11} strokeWidth={2.5} />
        Nuevo recurso
      </button>

      <div className="shrink-0 px-3 py-2 border-b border-[#2A7CA8]/10">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full rounded-xl border border-[#dde8f0] bg-white px-3 py-1.5 text-[12px] text-[#2F3E46] placeholder:text-[#b8c4cf] outline-none focus:border-[#2A7CA8]/50 focus:ring-1 focus:ring-[#2A7CA8]/15 transition"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {recursos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center px-4">
            <Package size={22} strokeWidth={1.5} className="text-[#2A7CA8]/20" />
            <p className="text-[12px] font-semibold text-[#9ca3af]">Sin productos en el catálogo</p>
            <p className="text-[10px] text-[#b0bac8]">Crea el primero con el botón de arriba</p>
          </div>
        ) : recursosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center px-4">
            <p className="text-[12px] font-semibold text-[#9ca3af]">Sin resultados para «{busqueda}»</p>
          </div>
        ) : (
          recursosFiltrados.map(r => {
            const isSel = r.productoId === selectedProductoId
            const tieneValor = r.hovsActivas.some(h =>
              getValoresPorHOV(h.id).some(v => v.tipo === 'NORMAL' && v.estado === 'ACTIVO')
            )
            const dotColor = r.hovsActivas.length === 0
              ? "#d1d5db"
              : tieneValor ? "#45b356" : "#fbbf24"

            return (
              <button
                key={r.productoId}
                onClick={() => onSelect(r.productoId)}
                className={`flex w-full items-center gap-2.5 border-l-2 px-3.5 py-2.5 text-left transition ${
                  isSel
                    ? "border-[#2A7CA8] bg-[#EEF6FB]"
                    : "border-transparent hover:bg-[#f0f8fd]"
                }`}
              >
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className={`truncate text-[12px] font-semibold ${
                      r.estadoItem === 'RETIRADO'
                        ? "text-[#9ca3af] line-through"
                        : isSel ? "text-[#121416]" : "text-[#2F3E46]"
                    }`}>
                      {r.nombre}
                    </p>
                    {r.estadoItem === 'RETIRADO' && (
                      <span className="shrink-0 rounded bg-[#f0f0f0] px-1 py-0.5 text-[8px] font-bold text-[#9ca3af]">
                        RETIRADO
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] ${
                    r.estadoItem === 'RETIRADO'
                      ? "text-[#c4cdd8]"
                      : r.hovsActivas.length === 0
                        ? "font-semibold text-amber-500"
                        : "text-[#9ca3af]"
                  }`}>
                    {r.estadoItem === 'RETIRADO'
                      ? "Retirado · no aparece en ventas"
                      : r.hovsActivas.length === 0
                        ? "Sin presentaciones · no aparece en venta"
                        : `${r.hovsActivas.length} presentación${r.hovsActivas.length !== 1 ? "es" : ""}`
                    }
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

function PanelDerechoContainer({
  panel, setPanel,
  selectedProductoId, setSelectedProductoId,
  editingHovId, setEditingHovId,
  recursoSeleccionado, refresh,
}: {
  panel: PanelDerecho
  setPanel: (p: PanelDerecho) => void
  selectedProductoId: string | null
  setSelectedProductoId: (id: string) => void
  editingHovId: string | null
  setEditingHovId: (id: string | null) => void
  recursoSeleccionado: RecursoAgrupado | null
  refresh: () => void
}) {
  const headerIcon = () => {
    if (panel === "nuevo-recurso")      return <Plus    size={13} strokeWidth={2} className="text-[#2A7CA8]" />
    if (panel === "nueva-presentacion") return <Plus    size={13} strokeWidth={2} className="text-[#2A7CA8]" />
    if (panel === "editar-recurso")     return <Pencil  size={13} strokeWidth={2} className="text-[#2A7CA8]" />
    if (panel === "editar-presentacion")return <Tag     size={13} strokeWidth={2} className="text-[#2A7CA8]" />
    if (panel === "presentaciones")     return <Tag     size={13} strokeWidth={2} className="text-[#2A7CA8]" />
    return <BookOpen size={13} strokeWidth={2} className="text-[#2A7CA8]" />
  }
  const headerTitle = () => {
    if (panel === "nuevo-recurso")       return "NUEVO RECURSO"
    if (panel === "nueva-presentacion")  return "NUEVA PRESENTACIÓN"
    if (panel === "editar-recurso")      return "EDITAR PRODUCTO"
    if (panel === "retirar-recurso")     return "RETIRAR PRODUCTO"
    if (panel === "editar-presentacion") return "EDITAR PRESENTACIÓN"
    if (panel === "presentaciones" && recursoSeleccionado)
      return recursoSeleccionado.nombre.toUpperCase()
    return "CATÁLOGO"
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/30 bg-[#F8FDFF]">

      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#2A7CA8]/15 bg-[#EEF6FB] px-4">
        {headerIcon()}
        <span className="truncate text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">
          {headerTitle()}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {panel === "vacio" && <ContenidoVacio />}
        {panel === "nuevo-recurso" && (
          <FormNuevoRecurso
            onCreado={(itemId) => { setSelectedProductoId(itemId); setPanel("presentaciones"); refresh() }}
            onCancelar={() => setPanel("vacio")}
          />
        )}
        {panel === "presentaciones" && selectedProductoId && (
          <ContenidoPresentaciones
            productoId={selectedProductoId}
            estadoItem={recursoSeleccionado?.estadoItem ?? 'ACTIVO'}
            onNuevaPresentacion={() => setPanel("nueva-presentacion")}
            onEditarPresentacion={(hovId) => { setEditingHovId(hovId); setPanel("editar-presentacion") }}
            onEditarRecurso={() => setPanel("editar-recurso")}
            onRetirarEliminar={() => setPanel("retirar-recurso")}
            refresh={refresh}
          />
        )}
        {panel === "nueva-presentacion" && selectedProductoId && (
          <FormNuevaPresentacion
            productoId={selectedProductoId}
            onCreada={() => { setPanel("presentaciones"); refresh() }}
            onCancelar={() => setPanel("presentaciones")}
          />
        )}
        {panel === "editar-presentacion" && editingHovId && (
          <FormEditarPresentacion
            hovId={editingHovId}
            onGuardado={() => { setPanel("presentaciones"); refresh() }}
            onCancelar={() => setPanel("presentaciones")}
          />
        )}
        {panel === "editar-recurso" && selectedProductoId && (
          <FormEditarRecurso
            productoId={selectedProductoId}
            onGuardado={() => { setPanel("presentaciones"); refresh() }}
            onCancelar={() => setPanel("presentaciones")}
          />
        )}
        {panel === "retirar-recurso" && selectedProductoId && recursoSeleccionado && (
          <FormRetirarRecurso
            productoId={selectedProductoId}
            recurso={recursoSeleccionado}
            onCompletado={() => { setPanel("vacio"); setSelectedProductoId(""); refresh() }}
            onCancelar={() => setPanel("presentaciones")}
          />
        )}
      </div>
    </div>
  )
}

function ContenidoVacio() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-20 text-center px-6">
      <BookOpen size={28} strokeWidth={1.2} className="text-[#2A7CA8]/20" />
      <p className="text-[13px] font-semibold text-[#9ca3af]">
        Selecciona un producto o crea uno nuevo
      </p>
      <p className="text-[11px] text-[#b0bac8]">
        El catálogo define qué existe, cómo se vende y a qué precio.
      </p>
    </div>
  )
}

function FormNuevoRecurso({
  onCreado, onCancelar,
}: {
  onCreado: (itemId: string) => void
  onCancelar: () => void
}) {
  const [nombre,     setNombre]     = useState("")
  const [unidadBase, setUnidadBase] = useState("unidad")
  const [categoria,  setCategoria]  = useState("")
  const [error,      setError]      = useState("")

  const rubro    = loadBusinessConfig().rubro
  const cats     = RUBROS[rubro]?.categories.filter(c => c.id !== "all") ?? []

  function handleCrear() {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return }
    setError("")
    const itemId = "IT-" + crypto.randomUUID().slice(0, 8).toUpperCase()
    inventoryService.registrarItem({
      itemId,
      nombre: nombre.trim(),
      unidadBase: unidadBase.trim() || "unidad",
    })
    onCreado(itemId)
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-4 pb-5 max-w-md">
      <p className="text-[11px] text-[#9ca3af]">
        Define el producto base. Las presentaciones y precios se agregan en el siguiente paso.
      </p>

      <Field label="¿Cómo se llama este producto?">
        <input
          autoFocus
          type="text"
          value={nombre}
          onChange={e => { setNombre(e.target.value); setError("") }}
          onKeyDown={e => e.key === "Enter" && handleCrear()}
          placeholder="Ej: Paracetamol 500mg, Arroz Extra 1kg..."
          className={inputCls}
        />
        {error && <p className="text-[11px] text-red-500">{error}</p>}
      </Field>

      <Field label="Unidad de medida base"
             hint="La unidad mínima en la que existe físicamente este producto en tu almacén.">
        <input
          type="text"
          value={unidadBase}
          onChange={e => setUnidadBase(e.target.value)}
          placeholder="unidad, kg, litro, docena..."
          className={inputCls}
        />
      </Field>

      {cats.length > 0 && (
        <Field label="Categoría">
          <select
            value={categoria || cats[0]?.id}
            onChange={e => setCategoria(e.target.value)}
            className={inputCls}
          >
            {cats.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </Field>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleCrear}
          disabled={!nombre.trim()}
          className={`${btnPrimario} disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Check size={12} strokeWidth={2.5} />
          Crear producto
        </button>
        <button onClick={onCancelar} className={btnSecundario}>
          Cancelar
        </button>
      </div>

      <p className="text-[10px] text-[#b0bac8]">
        El producto aparecerá en ventas cuando agregues al menos una presentación con precio.
      </p>
    </div>
  )
}

function ContenidoPresentaciones({
  productoId, estadoItem, onNuevaPresentacion, onEditarPresentacion, onEditarRecurso, onRetirarEliminar, refresh,
}: {
  productoId: string
  estadoItem: 'ACTIVO' | 'RETIRADO'
  onNuevaPresentacion: () => void
  onEditarPresentacion: (hovId: string) => void
  onEditarRecurso: () => void
  onRetirarEliminar: () => void
  refresh: () => void
}) {
  const [confirmandoSuspender, setConfirmandoSuspender] = useState<string | null>(null)

  const todasHovs   = getAllHOVs().filter(h => h.productoId === productoId)
  const hovsActivas = todasHovs.filter(h => h.estado === 'ACTIVA')
  const hovsSusp    = todasHovs.filter(h => h.estado !== 'ACTIVA')
  const ordenadas   = [...hovsActivas, ...hovsSusp]

  if (todasHovs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
        <Tag size={22} strokeWidth={1.2} className="text-[#2A7CA8]/20" />
        <p className="text-[13px] font-semibold text-[#9ca3af]">
          Este producto aún no tiene presentaciones
        </p>
        <p className="text-[11px] text-[#b0bac8]">Define cómo se vende y a qué precio.</p>
        <button onClick={onNuevaPresentacion} className={btnPrimario}>
          <Plus size={11} strokeWidth={2.5} />
          Agregar primera presentación
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 px-4 pt-4 pb-4">
      {ordenadas.map(hov => {
        const valorNormal = getValoresPorHOV(hov.id).find(
          v => v.tipo === 'NORMAL' && v.estado === 'ACTIVO'
        ) ?? null
        const activa     = hov.estado === 'ACTIVA'
        const confirmando = confirmandoSuspender === hov.id

        const dotColor = !activa
          ? "#d1d5db"
          : valorNormal ? "#45b356" : "#fbbf24"

        return (
          <div
            key={hov.id}
            className={`flex flex-col gap-1.5 rounded-2xl border px-4 py-3 transition ${
              !activa
                ? "border-[#f0f0f0] bg-[#fafafa] opacity-50"
                : valorNormal
                  ? "border-[#e4edf5] bg-white"
                  : "border-amber-200 bg-amber-50/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
                <span className="text-[13px] font-bold text-[#2F3E46] uppercase truncate">
                  {hov.unidadDespacho}
                </span>
                {!activa && (
                  <span className="rounded bg-[#f0f0f0] px-1.5 py-0.5 text-[9px] font-bold text-[#9ca3af]">
                    SUSPENDIDA
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {valorNormal
                  ? <span className="text-[15px] font-bold tabular-nums text-[#2A7CA8]">
                      S/ {valorNormal.valor.toFixed(2)}
                    </span>
                  : <span className="text-[12px] font-semibold text-amber-500">Sin precio</span>
                }
                {activa && (
                  <button
                    onClick={() => onEditarPresentacion(hov.id)}
                    className="text-[10px] font-semibold text-[#2A7CA8] hover:underline"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-[#9ca3af]">
              <span>×{hov.factorConversion} unidades base</span>
              <span>·</span>
              <span>costo S/ {hov.costoBase.toFixed(2)}</span>
              {hov.codigoBarras && (
                <>
                  <span>·</span>
                  <span className="font-mono">{hov.codigoBarras}</span>
                </>
              )}
              {activa && (
                <>
                  <span className="flex-1" />
                  {confirmando ? (
                    <button
                      onClick={() => {
                        suspenderHOV(hov.id, "suspendida-operador")
                        setConfirmandoSuspender(null)
                        refresh()
                      }}
                      className="font-semibold text-red-400 hover:text-red-600 transition"
                    >
                      ¿Confirmar?
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmandoSuspender(hov.id)}
                      className="text-[#d1d5db] hover:text-red-400 transition"
                    >
                      Suspender
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}

      <div className="mt-1 flex gap-2">
        <button
          onClick={onNuevaPresentacion}
          disabled={estadoItem === 'RETIRADO'}
          className="flex items-center gap-1.5 self-start rounded-xl border border-[#2A7CA8]/30
                     px-4 py-2 text-[12px] font-semibold text-[#2A7CA8] hover:bg-[#2A7CA8]/5
                     transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={11} strokeWidth={2.5} />
          Agregar presentación
        </button>
        <button
          onClick={onEditarRecurso}
          disabled={estadoItem === 'RETIRADO'}
          className="flex items-center gap-1.5 self-start rounded-xl border border-[#e9e4dc]
                     px-4 py-2 text-[12px] font-semibold text-[#6b7280] hover:bg-[#f4f7fb]
                     transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Pencil size={11} strokeWidth={2} />
          Editar producto
        </button>
        {estadoItem !== 'RETIRADO' && (
          <button
            onClick={onRetirarEliminar}
            className="flex items-center gap-1.5 self-start rounded-xl border border-red-100
                       px-4 py-2 text-[12px] font-semibold text-red-400 hover:bg-red-50
                       hover:text-red-600 transition"
          >
            <Trash2 size={11} strokeWidth={2} />
            Retirar
          </button>
        )}
      </div>
    </div>
  )
}

function FormNuevaPresentacion({
  productoId, onCreada, onCancelar,
}: {
  productoId: string
  onCreada: () => void
  onCancelar: () => void
}) {
  const [unidadDespacho,   setUnidadDespacho]   = useState("")
  const [factorConversion, setFactorConversion] = useState("1")
  const [costoBase,        setCostoBase]        = useState("")
  const [precioVenta,      setPrecioVenta]      = useState("")
  const [codigoBarras,     setCodigoBarras]     = useState("")
  const [errores,          setErrores]          = useState<Record<string, string>>({})

  function validar(): boolean {
    const e: Record<string, string> = {}
    if (!unidadDespacho.trim())
      e.unidadDespacho = "Define cómo se vende esta presentación"
    const fc = parseInt(factorConversion)
    if (!Number.isInteger(fc) || fc < 1)
      e.factorConversion = "Debe ser un número entero mayor a cero"
    if (!costoBase || parseFloat(costoBase) <= 0)
      e.costoBase = "El costo debe ser mayor a cero"
    if (!precioVenta || parseFloat(precioVenta) <= 0)
      e.precioVenta = "El precio debe ser mayor a cero"
    if (costoBase && precioVenta && parseFloat(precioVenta) < parseFloat(costoBase))
      e.precioVenta = "El precio de venta no puede ser menor al costo de compra"
    if (unidadDespacho.trim() && existeHOVActiva(productoId, unidadDespacho.trim()))
      e.unidadDespacho = "Ya existe una presentación activa con esta unidad de venta"
    setErrores(e)
    return Object.keys(e).length === 0
  }

  function handleAgregar() {
    if (!validar()) return
    const hovsExistentes = getAllHOVs().filter(h => h.productoId === productoId)
    const categoriaRecurso = hovsExistentes[0]?.category ?? ""
    const nombreBase = useInventoryStore.getState().items
      .find(i => i.itemId === productoId)?.nombre ?? ""
    const nombreHOV = nombreBase
      ? nombreBase + " · " + unidadDespacho.trim()
      : unidadDespacho.trim()

    const hov = crearHOV({
      nombre: nombreHOV,
      productoId,
      unidadDespacho: unidadDespacho.trim(),
      factorConversion: parseInt(factorConversion),
      costoBase: parseFloat(costoBase),
      contextoOperacionalId: "default",
      category: categoriaRecurso,
      codigoBarras: codigoBarras.trim() || undefined,
    })

    crearValor({
      hovId: hov.id,
      tipo: 'NORMAL',
      valor: parseFloat(precioVenta),
      moneda: 'PEN',
      condiciones: {
        cantidadMinima: null,
        contextoOperacionalId: null,
        identidadOperacionalId: null,
      },
      vigencia: { desde: new Date().toISOString(), hasta: null },
    })

    onCreada()
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-4 pb-5 max-w-md">
      <p className="text-[11px] text-[#9ca3af]">
        Define cómo se vende esta presentación y su precio de venta.
      </p>

      <Field label="¿Cómo se vende?">
        <input
          autoFocus
          type="text"
          value={unidadDespacho}
          onChange={e => { setUnidadDespacho(e.target.value); setErrores(p => ({ ...p, unidadDespacho: "" })) }}
          placeholder="Unidad, Caja x12, Blíster x10, Kg..."
          className={inputCls}
        />
        {errores.unidadDespacho && <Err>{errores.unidadDespacho}</Err>}
      </Field>

      <Field label="Equivalencia en unidades base"
             hint="¿Cuántas unidades base contiene esta presentación? Ej: Caja x12 = 12">
        <input
          type="number"
          min={1}
          step={1}
          value={factorConversion}
          onChange={e => { setFactorConversion(e.target.value); setErrores(p => ({ ...p, factorConversion: "" })) }}
          className={inputCls}
        />
        {errores.factorConversion && <Err>{errores.factorConversion}</Err>}
      </Field>

      <Field label="Costo de compra (S/)"
             hint="Lo que te cuesta a ti. El sistema evita vender por debajo de este valor.">
        <input
          type="number"
          min={0.01}
          step={0.01}
          value={costoBase}
          onChange={e => { setCostoBase(e.target.value); setErrores(p => ({ ...p, costoBase: "" })) }}
          placeholder="0.00"
          className={inputCls}
        />
        {errores.costoBase && <Err>{errores.costoBase}</Err>}
      </Field>

      <Field label="Precio de venta (S/)">
        <input
          type="number"
          min={0.01}
          step={0.01}
          value={precioVenta}
          onChange={e => { setPrecioVenta(e.target.value); setErrores(p => ({ ...p, precioVenta: "" })) }}
          placeholder="0.00"
          className={inputCls}
        />
        {errores.precioVenta && <Err>{errores.precioVenta}</Err>}
      </Field>

      <Field label="Código de barras de esta presentación (opcional)">
        <input
          type="text"
          value={codigoBarras}
          onChange={e => setCodigoBarras(e.target.value)}
          placeholder="Escanea con la pistola o escribe manualmente"
          className={inputCls}
        />
      </Field>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleAgregar}
          disabled={!unidadDespacho.trim() || !costoBase || !precioVenta}
          className={`${btnPrimario} disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Check size={12} strokeWidth={2.5} />
          Agregar presentación
        </button>
        <button onClick={onCancelar} className={btnSecundario}>Cancelar</button>
      </div>
    </div>
  )
}

function FormEditarPresentacion({
  hovId, onGuardado, onCancelar,
}: {
  hovId: string
  onGuardado: () => void
  onCancelar: () => void
}) {
  const hov = getAllHOVs().find(h => h.id === hovId) ?? null
  const valorActual = hov
    ? getValoresPorHOV(hov.id).find(v => v.tipo === 'NORMAL' && v.estado === 'ACTIVO') ?? null
    : null

  const [nuevoPrecio,       setNuevoPrecio]       = useState(valorActual?.valor.toFixed(2) ?? "")
  const [nuevoCosto,        setNuevoCosto]        = useState(hov?.costoBase.toFixed(2) ?? "")
  const [nuevoCodigoBarras, setNuevoCodigoBarras] = useState(hov?.codigoBarras ?? "")
  const [error,             setError]             = useState("")

  if (!hov) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
        <AlertCircle size={22} className="text-red-300" />
        <p className="text-[12px] text-[#9ca3af]">No se encontró la presentación.</p>
        <button onClick={onCancelar} className={btnSecundario}>Volver</button>
      </div>
    )
  }

  function handleGuardar() {
    if (!hov) return
    const precio = parseFloat(nuevoPrecio)
    const costo  = parseFloat(nuevoCosto)
    if (isNaN(precio) || precio <= 0) { setError("El precio debe ser mayor a cero"); return }
    if (nuevoCosto && !isNaN(costo) && precio < costo) {
      setError("El precio de venta no puede ser menor al costo de compra"); return
    }
    setError("")

    if (valorActual && precio !== valorActual.valor) {
      suspenderValor(valorActual.id)
      crearValor({
        hovId: hov.id,
        tipo: 'NORMAL',
        valor: precio,
        moneda: 'PEN',
        condiciones: {
          cantidadMinima: null,
          contextoOperacionalId: null,
          identidadOperacionalId: null,
        },
        vigencia: { desde: new Date().toISOString(), hasta: null },
      })
    }

    if (nuevoCosto && !isNaN(costo) && costo !== hov.costoBase) {
      actualizarCostoBase(hov.id, costo)
    }

    if (nuevoCodigoBarras.trim() !== (hov.codigoBarras ?? "")) {
      guardarHOV({
        ...hov,
        codigoBarras: nuevoCodigoBarras.trim() || undefined,
        modificadoEn: new Date().toISOString(),
      })
    }

    onGuardado()
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-4 pb-5 max-w-md">
      <p className="text-[11px] text-[#9ca3af]">
        Presentación: <span className="font-semibold text-[#2F3E46]">{hov.unidadDespacho}</span>
        {" · "}×{hov.factorConversion} unidades base
      </p>

      <Field label="Precio de venta (S/)">
        <input
          autoFocus
          type="number"
          min={0.01}
          step={0.01}
          value={nuevoPrecio}
          onChange={e => { setNuevoPrecio(e.target.value); setError("") }}
          className={inputCls}
        />
      </Field>

      <Field label="Costo de compra (S/)"
             hint="Solo si cambió el costo con tu proveedor. Deja igual si no cambió.">
        <input
          type="number"
          min={0.01}
          step={0.01}
          value={nuevoCosto}
          onChange={e => { setNuevoCosto(e.target.value); setError("") }}
          className={inputCls}
        />
      </Field>

      <Field label="Código de barras (opcional)">
        <input
          type="text"
          value={nuevoCodigoBarras}
          onChange={e => setNuevoCodigoBarras(e.target.value)}
          placeholder="Escanea con la pistola o escribe manualmente"
          className={inputCls}
        />
      </Field>

      {error && <Err>{error}</Err>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleGuardar}
          disabled={!nuevoPrecio || parseFloat(nuevoPrecio) <= 0}
          className={`${btnPrimario} disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Check size={12} strokeWidth={2.5} />
          Guardar cambios
        </button>
        <button onClick={onCancelar} className={btnSecundario}>Cancelar</button>
      </div>
    </div>
  )
}

function FormEditarRecurso({
  productoId, onGuardado, onCancelar,
}: {
  productoId: string
  onGuardado: () => void
  onCancelar: () => void
}) {
  const item = useInventoryStore.getState().items.find(i => i.itemId === productoId) ?? null
  const todasHovs = getAllHOVs().filter(h => h.productoId === productoId)
  const tieneMovimientos = useInventoryStore.getState().movimientos.some(m => m.itemId === productoId)

  const rubro = loadBusinessConfig().rubro
  const cats  = RUBROS[rubro]?.categories.filter(c => c.id !== "all") ?? []
  const categoriaActual = todasHovs[0]?.category ?? ""

  const [nombre,    setNombre]    = useState(item?.nombre ?? "")
  const [unidadBase, setUnidadBase] = useState(item?.unidadBase ?? "")
  const [categoria, setCategoria] = useState(categoriaActual)
  const [error,     setError]     = useState("")

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
        <AlertCircle size={22} className="text-red-300" />
        <p className="text-[12px] text-[#9ca3af]">No se encontró el producto.</p>
        <button onClick={onCancelar} className={btnSecundario}>Volver</button>
      </div>
    )
  }

  function handleGuardar() {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return }
    setError("")

    const nombreCambia   = nombre.trim() !== item!.nombre
    const unidadCambia   = unidadBase.trim() !== item!.unidadBase
    const categoriaCambia = categoria !== categoriaActual

    if (nombreCambia || unidadCambia) {
      inventoryService.actualizarItem(productoId, {
        ...(nombreCambia   ? { nombre: nombre.trim() }         : {}),
        ...(unidadCambia   ? { unidadBase: unidadBase.trim() } : {}),
      })
    }

    if (nombreCambia || categoriaCambia) {
      for (const hov of todasHovs) {
        const nombreHOV = nombreCambia
          ? nombre.trim() + " · " + hov.unidadDespacho
          : hov.nombre
        guardarHOV({
          ...hov,
          nombre:    nombreHOV,
          category:  categoriaCambia ? categoria : hov.category,
          modificadoEn: new Date().toISOString(),
        })
      }
    }

    onGuardado()
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-4 pb-5 max-w-md">
      <p className="text-[11px] text-[#9ca3af]">
        Modifica los datos base del producto. Los cambios se propagan a todas sus presentaciones.
      </p>

      <Field label="Nombre del producto">
        <input
          autoFocus
          type="text"
          value={nombre}
          onChange={e => { setNombre(e.target.value); setError("") }}
          onKeyDown={e => e.key === "Enter" && handleGuardar()}
          className={inputCls}
        />
        {error && <Err>{error}</Err>}
      </Field>

      <Field
        label="Unidad de medida base"
        hint={tieneMovimientos
          ? "Este producto tiene movimientos registrados. La unidad base no puede modificarse."
          : "La unidad mínima en la que existe físicamente en tu almacén."}
      >
        <input
          type="text"
          value={unidadBase}
          onChange={e => setUnidadBase(e.target.value)}
          disabled={tieneMovimientos}
          className={`${inputCls} ${tieneMovimientos ? "cursor-not-allowed opacity-50 bg-[#f4f4f4]" : ""}`}
        />
      </Field>

      {cats.length > 0 && (
        <Field label="Categoría">
          <select
            value={categoria || cats[0]?.id}
            onChange={e => setCategoria(e.target.value)}
            className={inputCls}
          >
            {cats.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </Field>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleGuardar}
          disabled={!nombre.trim()}
          className={`${btnPrimario} disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Check size={12} strokeWidth={2.5} />
          Guardar cambios
        </button>
        <button onClick={onCancelar} className={btnSecundario}>Cancelar</button>
      </div>
    </div>
  )
}

function FormRetirarRecurso({
  productoId, recurso, onCompletado, onCancelar,
}: {
  productoId: string
  recurso: RecursoAgrupado
  onCompletado: () => void
  onCancelar: () => void
}) {
  const tieneMovimientos = useInventoryStore.getState().movimientos.some(m => m.itemId === productoId)
  const tieneHovsActivas = recurso.hovsActivas.length > 0
  const sinHovs          = recurso.hovsTotales.length === 0
  const puedeEliminar    = !tieneMovimientos && sinHovs

  if (tieneHovsActivas) {
    return (
      <div className="flex flex-col gap-3 px-5 pt-4 pb-5 max-w-md">
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="text-[12px] font-semibold text-amber-700">
              Suspende todas las presentaciones primero
            </p>
            <p className="mt-0.5 text-[11px] text-amber-600">
              Este producto tiene {recurso.hovsActivas.length} presentación
              {recurso.hovsActivas.length !== 1 ? "es" : ""} activa
              {recurso.hovsActivas.length !== 1 ? "s" : ""}.
              Para retirarlo, suspéndelas primero desde la lista de presentaciones.
            </p>
          </div>
        </div>
        <button onClick={onCancelar} className={btnSecundario}>Volver</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-4 pb-5 max-w-md">
      <p className="text-[11px] text-[#9ca3af]">
        Producto: <span className="font-semibold text-[#2F3E46]">{recurso.nombre}</span>
      </p>

      {puedeEliminar ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50/60 px-4 py-3">
            <Trash2 size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="text-[12px] font-semibold text-red-600">
                Eliminar permanentemente
              </p>
              <p className="mt-0.5 text-[11px] text-red-400">
                Este producto no tiene presentaciones ni movimientos.
                Se eliminará de forma permanente y no podrá recuperarse.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { inventoryService.eliminarItemFisico(productoId); onCompletado() }}
              className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-[12px]
                         font-bold text-white hover:bg-red-600 transition active:scale-[0.98]"
            >
              <Trash2 size={12} strokeWidth={2.5} />
              Eliminar definitivamente
            </button>
            <button onClick={onCancelar} className={btnSecundario}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 rounded-2xl border border-[#e4edf5] bg-[#f4f8fb] px-4 py-3">
            <AlertCircle size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-[#2A7CA8]" />
            <div>
              <p className="text-[12px] font-semibold text-[#2F3E46]">
                Se marcará como RETIRADO
              </p>
              <p className="mt-0.5 text-[11px] text-[#9ca3af]">
                Este producto tiene historial de movimientos y no puede eliminarse.
                Al retirarlo dejará de aparecer en ventas y quedará visible solo en el Gestor de Catálogo.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { inventoryService.retirarItem(productoId); onCompletado() }}
              className="flex items-center gap-1.5 rounded-xl bg-[#6b7280] px-4 py-2 text-[12px]
                         font-bold text-white hover:bg-[#4b5563] transition active:scale-[0.98]"
            >
              <Trash2 size={12} strokeWidth={2.5} />
              Marcar como retirado
            </button>
            <button onClick={onCancelar} className={btnSecundario}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls = [
  "w-full rounded-xl border border-[#E9E4DC] bg-white px-3 py-2 text-[13px]",
  "focus:border-[#2A7CA8]/50 focus:ring-1 focus:ring-[#2A7CA8]/15 outline-none",
  "placeholder:text-[#c4cdd8]",
].join(" ")

const btnPrimario =
  "flex items-center gap-1.5 rounded-xl bg-[#2A7CA8] px-4 py-2 text-[12px] " +
  "font-bold text-white hover:bg-[#1e6a92] transition active:scale-[0.98]"

const btnSecundario =
  "flex items-center gap-1.5 rounded-xl border border-[#E9E4DC] px-4 py-2 " +
  "text-[12px] font-semibold text-[#6b7280] hover:bg-[#f4f7fb] transition"

function Field({
  label, hint, children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-[#b0bac8]">{hint}</p>}
    </div>
  )
}

function Err({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
      <AlertCircle size={10} strokeWidth={2} />
      {children}
    </p>
  )
}
