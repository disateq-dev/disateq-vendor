import { useState } from "react";
import { Archive, Trash2 } from "lucide-react";
import { useInventoryStore, deriveDisponibilidad, deriveEstado, deriveReservado } from "../../domains/inventory/store";
import { inventoryService } from "../../domains/inventory/service";
import type { TipoMovimiento, EstadoDisponibilidad, Reserva } from "../../domains/inventory/types";
import { usePurchasesStore } from "../../domains/purchases/store";
import type { CompraOperacional } from "../../domains/purchases/types";

type InventoryTab = "stock" | "productos" | "movimientos" | "separados" | "corregir" | "reset";

const TABS: { key: InventoryTab; label: string; devOnly?: boolean }[] = [
  { key: "stock",       label: "STOCK"         },
  { key: "productos",   label: "PRODUCTOS"     },
  { key: "movimientos", label: "ENTRADAS/SAL."  },
  { key: "separados",   label: "SEPARADOS"     },
  { key: "corregir",    label: "CORREGIR"      },
  { key: "reset",       label: "DEV·RESET",    devOnly: true },
];

export function InventoryWorkspace() {
  const { runtimeId, items: todosItems, movimientos, contexto, reservas } = useInventoryStore();
  const { compras } = usePurchasesStore();
  const items = todosItems.filter(i => !i.eliminado);

  const [activeTab,      setActiveTab]      = useState<InventoryTab>("stock");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const visibleTabs = TABS.filter(t => !t.devOnly || import.meta.env.DEV);

  const selectedItem = selectedItemId ? items.find(i => i.itemId === selectedItemId) : null;

  return (
    <div className="flex min-h-0 flex-1 gap-3">

      {/* ── Left SheetWork — lista de productos ───────────────────── */}
      <div className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#3D8A8A]/30 bg-white">

        <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#3D8A8A]/15 bg-[#EDF7F6] px-4">
          <Archive size={13} strokeWidth={2} className="text-[#3D8A8A]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">PRODUCTOS</span>
          {items.length > 0 && (
            <span className="ml-1 rounded px-1.5 py-0.5 text-[9px] font-bold tabular-nums bg-[#3D8A8A]/10 text-[#3D8A8A]">
              {items.length}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-[11px] text-[#b0bac8]">Sin productos registrados</p>
          ) : (
            items.map(item => {
              const existencia = deriveDisponibilidad(movimientos, item.itemId);
              const reservado  = deriveReservado(reservas, item.itemId);
              const paraOperar = existencia - reservado;
              const umbral     = contexto.find(c => c.itemId === item.itemId)?.umbralMinimo ?? 0;
              const estado     = deriveEstado(paraOperar, umbral);
              const isSelected = selectedItemId === item.itemId;

              const dotColor = estado === "disponible"
                ? "bg-[#45b356]"
                : estado === "bajo_stock"
                ? "bg-amber-400"
                : "bg-red-400";
              const qtyColor = estado === "disponible"
                ? "text-[#45b356]"
                : estado === "bajo_stock"
                ? "text-amber-500"
                : "text-red-500";

              return (
                <button
                  key={item.itemId}
                  onClick={() => setSelectedItemId(isSelected ? null : item.itemId)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition ${
                    isSelected
                      ? "bg-[#3D8A8A]/10 ring-inset ring-1 ring-[#3D8A8A]/25"
                      : "hover:bg-[#3D8A8A]/5"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
                  <span className="flex-1 min-w-0 truncate text-[12px] font-semibold text-[#1f2937]">
                    {item.nombre}
                  </span>
                  <span className={`shrink-0 tabular-nums text-[13px] font-bold ${qtyColor}`}>
                    {paraOperar}
                  </span>
                  <span className="shrink-0 text-[9px] text-[#b0bac8]">{item.unidadBase}</span>
                </button>
              );
            })
          )}
        </div>

        {import.meta.env.DEV && (
          <div className="shrink-0 border-t border-[#3D8A8A]/10 px-3 py-1.5">
            <span className="font-mono text-[9px] text-[#b0bac8]">{runtimeId.slice(0, 8)}…</span>
          </div>
        )}
      </div>

      {/* ── Right SheetWork — contenido tabulado ──────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#3D8A8A]/30 bg-white">

        <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#3D8A8A]/15 bg-[#EDF7F6] px-4">
          <Archive size={13} strokeWidth={2} className="text-[#3D8A8A]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">INVENTARIO</span>
          {selectedItem && (
            <>
              <span className="text-[#3D8A8A]/40 mx-0.5">·</span>
              <span className="truncate max-w-[200px] text-[12px] text-[#3D8A8A]/70">{selectedItem.nombre}</span>
            </>
          )}
        </div>

        {/* SheetNav */}
        <div className="shrink-0 flex h-[34px] items-center gap-0.5 border-b border-[#3D8A8A]/10 bg-[#EDF7F6]/50 px-3">
          {visibleTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                activeTab === key
                  ? "bg-[#3D8A8A] text-white shadow-sm"
                  : "text-[#276565]/70 hover:bg-[#3D8A8A]/10 hover:text-[#1a4545]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3">
          {activeTab === "stock"       && <ViewDisponibilidad items={items} movimientos={movimientos} contexto={contexto} reservas={reservas} compras={compras} />}
          {activeTab === "productos"   && <ViewItems items={items} contexto={contexto} />}
          {activeTab === "movimientos" && <ViewMovimientos key={selectedItemId ?? "__none"} items={items} movimientos={movimientos} defaultItemId={selectedItemId} />}
          {activeTab === "separados"   && <ViewReservas key={selectedItemId ?? "__none"} items={items} movimientos={movimientos} reservas={reservas} defaultItemId={selectedItemId} />}
          {activeTab === "corregir"    && <ViewReconciliacion key={selectedItemId ?? "__none"} items={items} movimientos={movimientos} defaultItemId={selectedItemId} />}
          {activeTab === "reset"       && <ViewReset />}
        </div>

      </div>
    </div>
  );
}

// ── STOCK ACTUAL ─────────────────────────────────────────────────────────────

const ESTADO_CFG: Record<EstadoDisponibilidad, { label: string; badge: string; qty: string }> = {
  disponible: { label: "DISPONIBLE", badge: "bg-[#45b356]/12 text-[#45b356]", qty: "text-[#45b356]"  },
  bajo_stock: { label: "QUEDA POCO", badge: "bg-amber-100 text-amber-600",    qty: "text-amber-500"  },
  agotado:    { label: "SIN STOCK",  badge: "bg-red-50 text-red-500",         qty: "text-red-400"    },
};

const MS_48H = 48 * 60 * 60 * 1000;

function formatRelativo(ts: number): string {
  const diff = Date.now() - ts;
  const min  = Math.floor(diff / 60_000);
  const h    = Math.floor(diff / 3_600_000);
  const d    = Math.floor(diff / 86_400_000);
  if (min < 2)  return "ahora mismo";
  if (min < 60) return `hace ${min}m`;
  if (h < 24)   return `hace ${h}h`;
  if (d === 1)  return "ayer";
  if (d < 7)    return `hace ${d} días`;
  return new Date(ts).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" });
}

const ORDEN_ESTADO: Record<EstadoDisponibilidad, number> = { agotado: 0, bajo_stock: 1, disponible: 2 };

function derivePendienteIngreso(compras: CompraOperacional[], itemId: string): number {
  return compras
    .filter(c => c.estado !== "recibida")
    .flatMap(c => c.lineas)
    .filter(l => l.itemId === itemId)
    .reduce((acc, l) => acc + Math.max(0, l.cantidad - (l.cantidadRecibida ?? 0)), 0);
}

function ViewDisponibilidad({
  items, movimientos, contexto, reservas, compras,
}: {
  items: ReturnType<typeof useInventoryStore>["items"];
  movimientos: ReturnType<typeof useInventoryStore>["movimientos"];
  contexto: ReturnType<typeof useInventoryStore>["contexto"];
  reservas: ReturnType<typeof useInventoryStore>["reservas"];
  compras: CompraOperacional[];
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Archive size={28} strokeWidth={1.2} className="text-[#3D8A8A]/30" />
        <p className="text-[12px] font-semibold text-[#9ca3af]">Sin productos registrados</p>
        <p className="text-[11px] text-[#b0bac8]">Registra el primer producto en PRODUCTOS.</p>
      </div>
    );
  }

  const enriched = items.map(item => {
    const existencia       = deriveDisponibilidad(movimientos, item.itemId);
    const reservado        = deriveReservado(reservas, item.itemId);
    const paraOperar       = existencia - reservado;
    const umbral           = contexto.find(c => c.itemId === item.itemId)?.umbralMinimo ?? 0;
    const estado           = deriveEstado(paraOperar, umbral);
    const cfg              = ESTADO_CFG[estado];
    const pendienteIngreso = derivePendienteIngreso(compras, item.itemId);
    const ingresoReciente  = movimientos.some(
      m => m.itemId === item.itemId && m.tipo === "entrada" && m.causa.startsWith("compra:") && Date.now() - m.timestamp < MS_48H,
    );
    const ultimoMov       = movimientos
      .filter(m => m.itemId === item.itemId)
      .reduce<typeof movimientos[0] | null>((best, m) => (!best || m.timestamp > best.timestamp) ? m : best, null);
    const ultimaActividad = ultimoMov ? formatRelativo(ultimoMov.timestamp) : null;
    return { item, existencia, reservado, paraOperar, umbral, estado, cfg, pendienteIngreso, ingresoReciente, ultimaActividad };
  });

  enriched.sort((a, b) => {
    const oa = ORDEN_ESTADO[a.estado], ob = ORDEN_ESTADO[b.estado];
    if (oa !== ob) return oa - ob;
    if (b.pendienteIngreso !== a.pendienteIngreso) return b.pendienteIngreso - a.pendienteIngreso;
    return a.item.nombre.localeCompare(b.item.nombre);
  });

  const sinStock   = enriched.filter(e => e.estado === "agotado").length;
  const pocoStock  = enriched.filter(e => e.estado === "bajo_stock").length;
  const conIngreso = enriched.filter(e => e.pendienteIngreso > 0).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>
          {items.length} producto{items.length !== 1 ? "s" : ""} · {movimientos.length} movimiento{movimientos.length !== 1 ? "s" : ""}
        </Label>
        {(sinStock > 0 || pocoStock > 0 || conIngreso > 0) && (
          <div className="flex items-center gap-3">
            {sinStock  > 0 && <span className="text-[10px] font-semibold text-red-500">{sinStock} sin stock</span>}
            {pocoStock > 0 && <span className="text-[10px] font-semibold text-amber-500">{pocoStock} con poco</span>}
            {conIngreso > 0 && <span className="text-[10px] text-amber-600">{conIngreso} en camino</span>}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {enriched.map(e => (
          <DisponibilidadCard key={e.item.itemId} {...e} />
        ))}
      </div>
    </div>
  );
}

function DisponibilidadCard({
  item, existencia, reservado, paraOperar, umbral, cfg, pendienteIngreso, ingresoReciente, ultimaActividad,
}: {
  item: ReturnType<typeof useInventoryStore>["items"][number];
  existencia: number;
  reservado: number;
  paraOperar: number;
  umbral: number;
  estado: EstadoDisponibilidad;
  cfg: typeof ESTADO_CFG[EstadoDisponibilidad];
  pendienteIngreso: number;
  ingresoReciente: boolean;
  ultimaActividad: string | null;
}) {
  const [accion,   setAccion]   = useState<"entrada" | "salida" | null>(null);
  const [cantidad, setCantidad] = useState("1");

  function confirmar() {
    const n = parseFloat(cantidad);
    if (isNaN(n) || n <= 0) { cancelar(); return; }
    if (accion === "entrada") inventoryService.registrarEntrada(item.itemId, n, "movimiento-rápido");
    else if (accion === "salida") inventoryService.registrarSalida(item.itemId, n, "movimiento-rápido");
    cancelar();
  }

  function cancelar() { setAccion(null); setCantidad("1"); }
  function activar(tipo: "entrada" | "salida") { setAccion(tipo); setCantidad("1"); }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e4eaea] bg-white px-4 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[#1f2937]">{item.nombre}</p>
        <p className="text-[10px] text-[#9ca3af]">
          {item.unidadBase}
          {umbral > 0 && ` · alerta desde ${umbral}`}
          {reservado > 0 && <span className="text-amber-500"> · {reservado} separado{reservado !== 1 ? "s" : ""}</span>}
          {pendienteIngreso > 0 && <span className="font-semibold text-amber-600"> · Llegan {pendienteIngreso}</span>}
          {ingresoReciente && !pendienteIngreso && <span className="text-[#2A7CA8]"> · Ingreso reciente</span>}
          {!pendienteIngreso && !ingresoReciente && ultimaActividad && <span> · {ultimaActividad}</span>}
          {!pendienteIngreso && !ingresoReciente && !ultimaActividad && <span className="text-[#c4bfb7]"> · sin movimientos</span>}
        </p>
      </div>

      {accion ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] font-bold ${accion === "entrada" ? "text-[#45b356]" : "text-red-500"}`}>
            {accion === "entrada" ? "+" : "−"}
          </span>
          <input
            autoFocus
            type="number"
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") confirmar(); if (e.key === "Escape") cancelar(); }}
            className="w-16 rounded border border-[#e4eaea] px-2 py-0.5 text-[12px] tabular-nums text-center focus:outline-none focus:border-[#3D8A8A]/50"
          />
          <button onClick={confirmar} className="rounded px-2 py-0.5 text-[11px] font-bold bg-[#3D8A8A] text-white hover:bg-[#2d6b6b] transition active:scale-95">OK</button>
          <button onClick={cancelar} className="text-[11px] text-[#b0bac8] hover:text-[#6b7280] transition">✕</button>
        </div>
      ) : (
        <>
          <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cfg.badge}`}>{cfg.label}</span>
          <div className="flex flex-col items-end shrink-0">
            <span className={`tabular-nums text-[20px] font-bold leading-none ${cfg.qty}`}>{paraOperar}</span>
            {reservado > 0 && <span className="text-[9px] text-[#b0bac8] tabular-nums leading-none">{existencia} total</span>}
          </div>
          <span className="text-[10px] text-[#b0bac8]">{item.unidadBase}</span>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => activar("entrada")}
              className="rounded px-2 py-1 text-[11px] font-bold text-[#45b356] border border-[#45b356]/30 hover:bg-[#45b356]/8 transition active:scale-95"
              title="Llegó producto"
            >+</button>
            <button
              onClick={() => activar("salida")}
              className="rounded px-2 py-1 text-[11px] font-bold text-red-500 border border-red-200 hover:bg-red-50 transition active:scale-95"
              title="Salió producto"
            >−</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── ENTRADAS Y SALIDAS ───────────────────────────────────────────────────────

function ViewMovimientos({
  items, movimientos, defaultItemId,
}: {
  items: ReturnType<typeof useInventoryStore>["items"];
  movimientos: ReturnType<typeof useInventoryStore>["movimientos"];
  defaultItemId?: string | null;
}) {
  const [itemId,     setItemId]     = useState(defaultItemId ?? items[0]?.itemId ?? "");
  const [tipo,       setTipo]       = useState<TipoMovimiento>("entrada");
  const [cantidad,   setCantidad]   = useState("");
  const [causa,      setCausa]      = useState("");
  const [error,      setError]      = useState("");
  const [busqueda,   setBusqueda]   = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoMovimiento | "todos">("todos");
  const [copiado,    setCopiado]    = useState(false);

  function handleRegistrar() {
    const n = parseFloat(cantidad);
    if (!itemId)  { setError("Selecciona un producto."); return; }
    if (isNaN(n)) { setError("Cantidad inválida."); return; }
    if ((tipo === "entrada" || tipo === "salida") && n <= 0) {
      setError("Entrada y salida requieren cantidad positiva.");
      return;
    }
    setError("");
    if (tipo === "entrada") inventoryService.registrarEntrada(itemId, n, causa || "manual");
    else if (tipo === "salida") inventoryService.registrarSalida(itemId, n, causa || "manual");
    else inventoryService.registrarAjuste(itemId, n, causa || "ajuste-manual");
    setCantidad("");
    setCausa("");
  }

  const hayFiltro = busqueda.trim() !== "" || filtroTipo !== "todos";

  function exportarCSV() {
    const header = "Fecha,Producto,Tipo,Cantidad,Motivo";
    const filas = [...movimientos].reverse().map(m => {
      const nombre = items.find(i => i.itemId === m.itemId)?.nombre ?? m.itemId;
      const fecha  = new Date(m.timestamp).toLocaleString("es-PE");
      const signo  = m.tipo === "salida" ? -Math.abs(m.cantidad) : m.cantidad;
      return [fecha, `"${nombre}"`, m.tipo, signo, `"${m.causa}"`].join(",");
    });
    const csv = [header, ...filas].join("\n");
    navigator.clipboard.writeText(csv).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); });
  }

  const filtrados = [...movimientos].reverse().filter(m => {
    if (filtroTipo !== "todos" && m.tipo !== filtroTipo) return false;
    if (busqueda.trim()) {
      const nombre = items.find(i => i.itemId === m.itemId)?.nombre ?? "";
      if (!nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    }
    return true;
  }).slice(0, 20);

  return (
    <div className="flex flex-col gap-3">

      <div className="rounded-2xl border border-[#3D8A8A]/20 bg-[#EDF7F6] px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Label>Registrar entrada o salida</Label>
          <Helper text="Usa esto para registrar mercadería que llegó o salió manualmente. El historial queda guardado." />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={itemId}
            onChange={e => setItemId(e.target.value)}
            className="flex-1 min-w-[140px] rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#3D8A8A]/50"
          >
            {items.length === 0 && <option value="">— sin productos —</option>}
            {items.map(i => <option key={i.itemId} value={i.itemId}>{i.nombre}</option>)}
          </select>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value as TipoMovimiento)}
            className="rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#3D8A8A]/50"
          >
            <option value="entrada">+ Llegó producto</option>
            <option value="salida">− Salió producto</option>
            <option value="ajuste">± Ajuste de cantidad</option>
          </select>
          <input
            type="number"
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            placeholder="cantidad"
            className="w-24 rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] tabular-nums focus:outline-none focus:border-[#3D8A8A]/50"
          />
          <input
            value={causa}
            onChange={e => setCausa(e.target.value)}
            placeholder="motivo (opcional)"
            className="flex-1 min-w-[100px] rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#3D8A8A]/50"
          />
          <button
            onClick={handleRegistrar}
            disabled={items.length === 0}
            className="rounded-lg bg-[#3D8A8A] px-4 py-1.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-[#2d6b6b] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Guardar
          </button>
        </div>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
        {items.length === 0 && <p className="text-[11px] text-[#9ca3af]">Registra productos en PRODUCTOS primero.</p>}
      </div>

      {movimientos.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="buscar producto…"
              className="flex-1 min-w-[120px] rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#3D8A8A]/50"
            />
            {(["todos", "entrada", "salida", "ajuste"] as const).map(t => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                  filtroTipo === t
                    ? t === "todos"   ? "bg-[#1f2937] text-white"
                    : t === "entrada" ? "bg-[#45b356] text-white"
                    : t === "salida"  ? "bg-red-500 text-white"
                    : "bg-[#005BE3] text-white"
                    : "border border-[#e4eaea] text-[#6b7280] hover:border-[#3D8A8A]/40"
                }`}
              >
                {t === "todos" ? "TODOS" : t === "entrada" ? "+" : t === "salida" ? "−" : "±"}
              </button>
            ))}
            {hayFiltro && (
              <button onClick={() => { setBusqueda(""); setFiltroTipo("todos"); }} className="text-[11px] text-[#b0bac8] hover:text-[#6b7280] transition">✕</button>
            )}
            <div className="ml-auto">
              <button
                onClick={exportarCSV}
                className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                  copiado
                    ? "bg-[#45b356] text-white"
                    : "border border-[#e4eaea] text-[#6b7280] hover:border-[#3D8A8A]/40 hover:text-[#3D8A8A]"
                }`}
              >
                {copiado ? "¡Copiado!" : "CSV"}
              </button>
            </div>
          </div>

          {filtrados.length > 0 ? (
            <>
              <Label>
                {hayFiltro
                  ? `${filtrados.length} resultado${filtrados.length !== 1 ? "s" : ""} · ${movimientos.length} total`
                  : `Últimas ${filtrados.length} entradas y salidas`}
              </Label>
              {filtrados.map(m => {
                const sign  = m.tipo === "entrada" ? "+" : m.tipo === "salida" ? "−" : "±";
                const color = m.tipo === "entrada" ? "text-[#45b356]" : m.tipo === "salida" ? "text-red-500" : "text-[#005BE3]";
                return (
                  <div key={m.movementId} className="flex items-center gap-3 rounded-xl border border-[#eef2f2] bg-white px-3 py-2">
                    <span className={`w-4 text-center font-bold text-[13px] ${color}`}>{sign}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#374151]">{items.find(i => i.itemId === m.itemId)?.nombre ?? m.itemId}</p>
                      <p className="text-[10px] text-[#9ca3af]">{m.causa} · {formatRelativo(m.timestamp)}</p>
                    </div>
                    <span className={`tabular-nums text-[13px] font-bold ${color}`}>{sign}{Math.abs(m.cantidad)}</span>
                  </div>
                );
              })}
            </>
          ) : (
            <p className="text-center text-[11px] text-[#b0bac8] py-6">Sin resultados para el filtro activo.</p>
          )}
        </div>
      )}

      {movimientos.length === 0 && (
        <p className="text-center text-[11px] text-[#b0bac8] py-8">Sin entradas ni salidas registradas.</p>
      )}
    </div>
  );
}

// ── PRODUCTOS ────────────────────────────────────────────────────────────────

function ViewItems({
  items, contexto,
}: {
  items: ReturnType<typeof useInventoryStore>["items"];
  contexto: ReturnType<typeof useInventoryStore>["contexto"];
}) {
  const [nombre,     setNombre]     = useState("");
  const [unidadBase, setUnidadBase] = useState("unidad");
  const [umbral,     setUmbral]     = useState("");
  const [error,      setError]      = useState("");
  const [busqueda,   setBusqueda]   = useState("");

  function handleRegistrar() {
    const name = nombre.trim();
    if (!name) { setError("El nombre es obligatorio."); return; }
    setError("");
    const itemId = `IT-${Date.now()}`;
    inventoryService.registrarItem({ itemId, nombre: name, unidadBase: unidadBase || "unidad" });
    const u = parseFloat(umbral);
    if (!isNaN(u) && u > 0) inventoryService.setUmbral(itemId, u);
    setNombre("");
    setUmbral("");
  }

  return (
    <div className="flex flex-col gap-3">

      <div className="rounded-2xl border border-[#3D8A8A]/20 bg-[#EDF7F6] px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Label>Agregar producto</Label>
          <Helper text="Registra los productos que manejas en tu negocio. Después podrás registrar entradas y salidas." />
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleRegistrar(); }}
            placeholder="nombre del producto"
            className="flex-1 min-w-[160px] rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#3D8A8A]/50"
          />
          <input
            value={unidadBase}
            onChange={e => setUnidadBase(e.target.value)}
            placeholder="kg, botella…"
            className="w-24 rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#3D8A8A]/50"
          />
          <input
            type="number"
            value={umbral}
            onChange={e => setUmbral(e.target.value)}
            placeholder="alerta desde"
            title="¿Desde cuántas unidades mostrar alerta de stock bajo?"
            className="w-24 rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] tabular-nums focus:outline-none focus:border-[#3D8A8A]/50"
          />
          <button
            onClick={handleRegistrar}
            className="rounded-lg bg-[#3D8A8A] px-4 py-1.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-[#2d6b6b] active:scale-95"
          >
            Agregar
          </button>
        </div>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
        <p className="text-[9.5px] text-[#b0bac8]">
          alerta desde: avisa cuando el stock baja de ese número · deja vacío para no alertar
        </p>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="buscar producto…"
              className="flex-1 rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#3D8A8A]/50"
            />
            {busqueda && (
              <button onClick={() => setBusqueda("")} className="text-[11px] text-[#b0bac8] hover:text-[#6b7280] transition">✕</button>
            )}
          </div>
          {(() => {
            const filtrados = busqueda.trim()
              ? items.filter(i => i.nombre.toLowerCase().includes(busqueda.toLowerCase()))
              : items;
            if (filtrados.length === 0) {
              return <p className="text-center text-[11px] text-[#b0bac8] py-6">Sin resultados para "{busqueda}".</p>;
            }
            return (
              <>
                <Label>{filtrados.length} de {items.length} producto{items.length !== 1 ? "s" : ""}</Label>
                {filtrados.map(item => {
                  const umbralMinimo = contexto.find(c => c.itemId === item.itemId)?.umbralMinimo ?? 0;
                  return <ItemRow key={item.itemId} item={item} umbralMinimo={umbralMinimo} />;
                })}
              </>
            );
          })()}
        </div>
      ) : (
        <p className="text-center text-[11px] text-[#b0bac8] py-8">Sin productos. Agrega el primero arriba.</p>
      )}
    </div>
  );
}

function ItemRow({ item, umbralMinimo }: {
  item: ReturnType<typeof useInventoryStore>["items"][number];
  umbralMinimo: number;
}) {
  const [editing,     setEditing]     = useState(false);
  const [val,         setVal]         = useState(String(umbralMinimo > 0 ? umbralMinimo : ""));
  const [confirmBaja, setConfirmBaja] = useState(false);

  function handleSave() {
    const u = parseFloat(val);
    inventoryService.setUmbral(item.itemId, isNaN(u) || u < 0 ? 0 : u);
    setEditing(false);
  }

  if (confirmBaja) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-[#1f2937]">{item.nombre}</p>
          <p className="text-[10px] text-red-400">¿Quitar este producto? El historial se conserva.</p>
        </div>
        <button onClick={() => inventoryService.darDeBaja(item.itemId)} className="rounded px-2.5 py-1 text-[11px] font-bold bg-red-500 text-white hover:bg-red-600 transition active:scale-95">QUITAR</button>
        <button onClick={() => setConfirmBaja(false)} className="text-[11px] text-[#b0bac8] hover:text-[#6b7280] transition">✕</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#eef2f2] bg-white px-4 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[#1f2937]">{item.nombre}</p>
        <p className="text-[10px] text-[#9ca3af] font-mono">{item.itemId} · {item.unidadBase}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-[#b0bac8]">alerta desde</span>
        {editing ? (
          <input
            autoFocus
            type="number"
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") { setVal(String(umbralMinimo > 0 ? umbralMinimo : "")); setEditing(false); }
            }}
            className="w-14 rounded border border-[#3D8A8A]/40 px-1.5 py-0.5 text-[11px] tabular-nums text-center focus:outline-none"
          />
        ) : (
          <button
            onClick={() => { setVal(String(umbralMinimo > 0 ? umbralMinimo : "")); setEditing(true); }}
            className="min-w-[28px] rounded border border-[#e4eaea] px-2 py-0.5 text-[11px] tabular-nums text-[#6b7280] hover:border-[#3D8A8A]/40 transition"
          >
            {umbralMinimo > 0 ? umbralMinimo : "—"}
          </button>
        )}
      </div>
      <button onClick={() => setConfirmBaja(true)} className="shrink-0 rounded p-1 text-[#d1d5db] hover:text-red-400 hover:bg-red-50 transition" title="Quitar producto">
        <Trash2 size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

// ── PRODUCTOS SEPARADOS ──────────────────────────────────────────────────────

function ViewReservas({
  items, movimientos, reservas, defaultItemId,
}: {
  items: ReturnType<typeof useInventoryStore>["items"];
  movimientos: ReturnType<typeof useInventoryStore>["movimientos"];
  reservas: Reserva[];
  defaultItemId?: string | null;
}) {
  const [itemId,   setItemId]   = useState(defaultItemId ?? items[0]?.itemId ?? "");
  const [cantidad, setCantidad] = useState("");
  const [causa,    setCausa]    = useState("");
  const [error,    setError]    = useState("");

  function handleReservar() {
    const n = parseFloat(cantidad);
    if (!itemId)            { setError("Selecciona un producto."); return; }
    if (isNaN(n) || n <= 0) { setError("La cantidad debe ser positiva."); return; }
    inventoryService.reservar(itemId, n, causa.trim() || "separación");
    setCantidad("");
    setCausa("");
    setError("");
  }

  const activas   = reservas.filter(r => r.estado === "activa");
  const historial = reservas.filter(r => r.estado !== "activa").slice().reverse().slice(0, 10);

  return (
    <div className="flex flex-col gap-3">

      <div className="rounded-2xl border border-[#3D8A8A]/20 bg-[#EDF7F6] px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Label>Separar producto</Label>
          <Helper text="Separa unidades para un cliente o pedido. No descuenta el stock todavía — solo las marca como reservadas." />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={itemId}
            onChange={e => setItemId(e.target.value)}
            className="flex-1 min-w-[140px] rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#3D8A8A]/50"
          >
            {items.length === 0 && <option value="">— sin productos —</option>}
            {items.map(i => {
              const existencia = deriveDisponibilidad(movimientos, i.itemId);
              return <option key={i.itemId} value={i.itemId}>{i.nombre} ({existencia})</option>;
            })}
          </select>
          <input
            type="number"
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            placeholder="cantidad"
            className="w-24 rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] tabular-nums focus:outline-none focus:border-[#3D8A8A]/50"
          />
          <input
            value={causa}
            onChange={e => setCausa(e.target.value)}
            placeholder="para quién o qué (opcional)"
            className="flex-1 min-w-[100px] rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#3D8A8A]/50"
          />
          <button
            onClick={handleReservar}
            disabled={items.length === 0}
            className="rounded-lg bg-[#3D8A8A] px-4 py-1.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-[#2d6b6b] active:scale-95 disabled:opacity-40"
          >
            Separar
          </button>
        </div>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
      </div>

      {activas.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <Label>{activas.length} producto{activas.length !== 1 ? "s" : ""} separado{activas.length !== 1 ? "s" : ""}</Label>
          {activas.map(r => {
            const nombreItem = items.find(i => i.itemId === r.itemId)?.nombre ?? r.itemId;
            return (
              <div key={r.reservaId} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#1f2937]">{nombreItem}</p>
                  <p className="text-[10px] text-[#9ca3af]">{r.causa} · {formatTs(r.timestamp)}</p>
                </div>
                <span className="tabular-nums text-[16px] font-bold text-amber-600 shrink-0">{r.cantidad}</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => inventoryService.materializarReserva(r.reservaId)}
                    className="rounded px-2 py-1 text-[10px] font-bold text-[#45b356] border border-[#45b356]/30 hover:bg-[#45b356]/8 transition active:scale-95"
                    title="Confirmar entrega al cliente — descuenta el stock"
                  >✓ Entregar</button>
                  <button
                    onClick={() => inventoryService.liberarReserva(r.reservaId, "cancelada-operador")}
                    className="rounded px-2 py-1 text-[10px] font-bold text-[#6b7280] border border-[#e4eaea] hover:border-red-200 hover:text-red-400 transition active:scale-95"
                    title="Cancelar separación — vuelve a estar disponible"
                  >✕</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-[11px] text-[#b0bac8] py-6">Sin productos separados.</p>
      )}

      {historial.length > 0 && (
        <div className="flex flex-col gap-1">
          <Label>Historial reciente</Label>
          {historial.map(r => {
            const nombreItem = items.find(i => i.itemId === r.itemId)?.nombre ?? r.itemId;
            const entregado  = r.estado === "materializada";
            return (
              <div key={r.reservaId} className="flex items-center gap-3 rounded-xl border border-[#eef2f2] bg-white px-4 py-2 opacity-70">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#374151]">{nombreItem}</p>
                  <p className="text-[10px] text-[#9ca3af]">{r.causa} · {formatTs(r.timestamp)}</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  entregado ? "bg-[#45b356]/10 text-[#45b356]" : "bg-[#e4eaea] text-[#9ca3af]"
                }`}>
                  {entregado ? "entregado" : "cancelado"}
                </span>
                <span className="tabular-nums text-[13px] font-bold text-[#9ca3af] shrink-0">{r.cantidad}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── CORREGIR DIFERENCIA ──────────────────────────────────────────────────────

function ViewReconciliacion({
  items, movimientos, defaultItemId,
}: {
  items: ReturnType<typeof useInventoryStore>["items"];
  movimientos: ReturnType<typeof useInventoryStore>["movimientos"];
  defaultItemId?: string | null;
}) {
  const [itemId,    setItemId]    = useState(defaultItemId ?? items[0]?.itemId ?? "");
  const [conteo,    setConteo]    = useState("");
  const [causa,     setCausa]     = useState("conteo físico");
  const [error,     setError]     = useState("");
  const [resultado, setResultado] = useState<{
    delta: number; existenciaAntes: number; conteoFisico: number; movimientoGenerado: boolean;
  } | null>(null);

  function handleReconciliar() {
    const n = parseFloat(conteo);
    if (!itemId)            { setError("Selecciona un producto."); return; }
    if (isNaN(n) || n < 0) { setError("El número debe ser 0 o mayor."); return; }
    const res = inventoryService.reconciliar(itemId, n, causa.trim() || "conteo físico");
    setResultado(res);
    setConteo("");
    setError("");
  }

  const correcciones = [...movimientos]
    .filter(m => m.tipo === "ajuste" && m.causa.startsWith("reconciliacion"))
    .reverse()
    .slice(0, 8);

  const itemSeleccionado = items.find(i => i.itemId === itemId);
  const existenciaActual = itemId ? deriveDisponibilidad(movimientos, itemId) : null;

  return (
    <div className="flex flex-col gap-3">

      <div className="rounded-2xl border border-[#3D8A8A]/20 bg-[#EDF7F6] px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Label>Corregir diferencia de stock</Label>
          <Helper text="Cuenta los productos físicamente y compara con lo que dice el sistema. Si hay diferencia, se corrige automáticamente." />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={itemId}
            onChange={e => { setItemId(e.target.value); setResultado(null); }}
            className="flex-1 min-w-[160px] rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#3D8A8A]/50"
          >
            {items.length === 0 && <option value="">— sin productos —</option>}
            {items.map(i => {
              const ex = deriveDisponibilidad(movimientos, i.itemId);
              return <option key={i.itemId} value={i.itemId}>{i.nombre} — sistema: {ex}</option>;
            })}
          </select>
          <input
            type="number"
            value={conteo}
            onChange={e => { setConteo(e.target.value); setResultado(null); }}
            placeholder="¿cuántos tienes?"
            min="0"
            className="w-32 rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] tabular-nums focus:outline-none focus:border-[#3D8A8A]/50"
          />
          <input
            value={causa}
            onChange={e => setCausa(e.target.value)}
            placeholder="motivo del ajuste"
            className="flex-1 min-w-[120px] rounded-lg border border-[#e4eaea] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#3D8A8A]/50"
          />
          <button
            onClick={handleReconciliar}
            disabled={items.length === 0}
            className="rounded-lg bg-[#005BE3] px-4 py-1.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-[#0049b5] active:scale-95 disabled:opacity-40"
          >
            Aplicar
          </button>
        </div>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
        {itemSeleccionado && existenciaActual !== null && !resultado && (
          <p className="text-[10px] text-[#9ca3af]">
            El sistema dice: <span className="font-bold tabular-nums text-[#374151]">{existenciaActual}</span> {itemSeleccionado.unidadBase}
          </p>
        )}
        {resultado && (
          <div className={`rounded-xl px-3 py-2 flex flex-col gap-0.5 ${
            resultado.delta === 0
              ? "bg-[#45b356]/10 border border-[#45b356]/20"
              : resultado.delta > 0
              ? "bg-[#005BE3]/8 border border-[#005BE3]/20"
              : "bg-red-50 border border-red-200"
          }`}>
            <p className="text-[11px] font-bold text-[#1f2937]">
              {resultado.delta === 0
                ? "Sin diferencia — todo cuadra."
                : resultado.delta > 0
                ? `Faltaban ${resultado.delta} en el sistema — ajuste aplicado.`
                : `Sobraban ${Math.abs(resultado.delta)} en el sistema — ajuste aplicado.`}
            </p>
            <p className="text-[10px] text-[#6b7280]">
              Sistema antes: {resultado.existenciaAntes} · Contaste: {resultado.conteoFisico}
              {resultado.movimientoGenerado && " · Corrección guardada en historial"}
            </p>
          </div>
        )}
      </div>

      {correcciones.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label>Correcciones recientes</Label>
          {correcciones.map(m => {
            const nombre = items.find(i => i.itemId === m.itemId)?.nombre ?? m.itemId;
            const pos    = m.cantidad >= 0;
            return (
              <div key={m.movementId} className="flex items-center gap-3 rounded-xl border border-[#eef2f2] bg-white px-3 py-2">
                <span className={`w-5 text-center font-bold text-[13px] ${pos ? "text-[#45b356]" : "text-red-500"}`}>{pos ? "+" : ""}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#374151]">{nombre}</p>
                  <p className="text-[10px] text-[#9ca3af]">{m.causa} · {formatTs(m.timestamp)}</p>
                </div>
                <span className={`tabular-nums text-[13px] font-bold ${pos ? "text-[#45b356]" : "text-red-500"}`}>{pos ? "+" : ""}{m.cantidad}</span>
              </div>
            );
          })}
        </div>
      )}
      {correcciones.length === 0 && <p className="text-center text-[11px] text-[#b0bac8] py-6">Sin correcciones registradas.</p>}
    </div>
  );
}

// ── RESET (DEV) ──────────────────────────────────────────────────────────────

const MUESTRA_BODEGA = [
  { nombre: "Arroz Superior Extra",            unidad: "kg",       umbral: 20, stock: 45 },
  { nombre: "Azúcar Rubia",                    unidad: "kg",       umbral: 15, stock: 8  },
  { nombre: "Aceite Primor 1L",                unidad: "botella",  umbral: 12, stock: 0  },
  { nombre: "Fideo Tallarin Don Vittorio",     unidad: "paquete",  umbral: 24, stock: 36 },
  { nombre: "Sal Emsal 1kg",                   unidad: "bolsa",    umbral: 10, stock: 22 },
  { nombre: "Harina Preparada Blanca Flor",    unidad: "bolsa",    umbral: 6,  stock: 3  },
  { nombre: "Avena Quaker 180g",               unidad: "bolsa",    umbral: 10, stock: 17 },
  { nombre: "Leche Evaporada Gloria",          unidad: "lata",     umbral: 48, stock: 60 },
  { nombre: "Agua Cielo 625ml",                unidad: "botella",  umbral: 24, stock: 72 },
  { nombre: "Inca Kola 1.5L",                  unidad: "botella",  umbral: 12, stock: 5  },
  { nombre: "Coca-Cola 500ml",                 unidad: "botella",  umbral: 24, stock: 48 },
  { nombre: "Chicha Morada Negrita 500ml",     unidad: "caja",     umbral: 12, stock: 0  },
  { nombre: "Jugo Pulp Naranja 1L",            unidad: "caja",     umbral: 6,  stock: 14 },
  { nombre: "Cerveza Cristal 650ml",           unidad: "botella",  umbral: 24, stock: 36 },
  { nombre: "Detergente Ariel 360g",           unidad: "bolsa",    umbral: 12, stock: 9  },
  { nombre: "Lejía Clorox 1L",                 unidad: "botella",  umbral: 6,  stock: 18 },
  { nombre: "Jabón Bolivar 200g",              unidad: "barra",    umbral: 24, stock: 48 },
  { nombre: "Papel Higiénico Elite x4",        unidad: "paquete",  umbral: 8,  stock: 4  },
  { nombre: "Lavavajilla Sapolio 180g",        unidad: "tarro",    umbral: 6,  stock: 12 },
  { nombre: "Galletas Oreo 117g",              unidad: "paquete",  umbral: 12, stock: 30 },
  { nombre: "Chifle Frito Lay 80g",            unidad: "bolsa",    umbral: 12, stock: 2  },
  { nombre: "Papas Fritas Pringles 40g",       unidad: "lata",     umbral: 8,  stock: 0  },
  { nombre: "Caramelos Halls Menta",           unidad: "bolsa",    umbral: 6,  stock: 15 },
  { nombre: "Shampoo Head & Shoulders 200ml",  unidad: "frasco",   umbral: 6,  stock: 8  },
  { nombre: "Pasta Dental Colgate Triple",     unidad: "tubo",     umbral: 6,  stock: 24 },
  { nombre: "Jabón de Tocador Lux",            unidad: "barra",    umbral: 12, stock: 5  },
  { nombre: "Yogurt Gloria Fresa 1kg",         unidad: "pote",     umbral: 6,  stock: 12 },
  { nombre: "Queso Fresco La Florida 250g",    unidad: "unidad",   umbral: 4,  stock: 0  },
  { nombre: "Pan de Molde Bimbo Grande",       unidad: "bolsa",    umbral: 4,  stock: 7  },
  { nombre: "Mermelada Fanny Fresa 300g",      unidad: "frasco",   umbral: 4,  stock: 9  },
  { nombre: "Margarina Manty 100g",            unidad: "tarro",    umbral: 6,  stock: 3  },
  { nombre: "Atún Florida en Agua",            unidad: "lata",     umbral: 12, stock: 28 },
  { nombre: "Sardina Campomar Tomate",         unidad: "lata",     umbral: 12, stock: 16 },
  { nombre: "Vela Familiar 7cm",               unidad: "unidad",   umbral: 10, stock: 0  },
  { nombre: "Fósforos Llama",                  unidad: "caja",     umbral: 6,  stock: 24 },
] as const;

function ViewReset() {
  function resetDatos() {
    localStorage.removeItem("inv_v0_items");
    localStorage.removeItem("inv_v0_movimientos");
    localStorage.removeItem("inv_v0_contexto");
    localStorage.removeItem("inv_v0_reservas");
    window.location.reload();
  }

  function resetTotal() {
    localStorage.removeItem("inv_v0_items");
    localStorage.removeItem("inv_v0_movimientos");
    localStorage.removeItem("inv_v0_contexto");
    localStorage.removeItem("inv_v0_reservas");
    localStorage.removeItem("inv_v0_runtime_id");
    window.location.reload();
  }

  function cargarMuestra() {
    const now      = Date.now();
    const day      = 86_400_000;
    const runtimeId = localStorage.getItem("inv_v0_runtime_id") ?? crypto.randomUUID();

    const items = MUESTRA_BODEGA.map((p, i) => ({
      itemId: `IT-SEED-${String(i + 1).padStart(3, "0")}`,
      nombre: p.nombre,
      unidadBase: p.unidad,
    }));

    const contexto = MUESTRA_BODEGA.map((p, i) => ({
      itemId:       `IT-SEED-${String(i + 1).padStart(3, "0")}`,
      umbralMinimo: p.umbral,
    }));

    const movimientos: {
      movementId: string; itemId: string; tipo: "entrada" | "salida" | "ajuste";
      cantidad: number; timestamp: number; runtimeId: string; causa: string;
    }[] = [];
    let seq = 0;

    MUESTRA_BODEGA.forEach((p, i) => {
      const itemId = `IT-SEED-${String(i + 1).padStart(3, "0")}`;
      const entradaInicial = p.stock + Math.floor(Math.random() * 15) + 12;
      movimientos.push({
        movementId: `MOV-SEED-${String(++seq).padStart(4, "0")}`,
        itemId, tipo: "entrada", cantidad: entradaInicial,
        timestamp: now - 7 * day - Math.floor(Math.random() * day),
        runtimeId, causa: "stock inicial",
      });
      let restante = entradaInicial - p.stock;
      const nSalidas = Math.min(restante, 4);
      for (let s = 0; s < nSalidas && restante > 0; s++) {
        const esUltima = s === nSalidas - 1;
        const qty = esUltima ? restante : Math.max(1, Math.floor(restante / (nSalidas - s) * (0.4 + Math.random() * 0.8)));
        const cantidad = Math.min(qty, restante);
        movimientos.push({
          movementId: `MOV-SEED-${String(++seq).padStart(4, "0")}`,
          itemId, tipo: "salida", cantidad,
          timestamp: now - Math.floor(Math.random() * 6 * day),
          runtimeId, causa: "venta",
        });
        restante -= cantidad;
      }
    });

    movimientos.sort((a, b) => a.timestamp - b.timestamp);
    localStorage.setItem("inv_v0_items",       JSON.stringify(items));
    localStorage.setItem("inv_v0_movimientos", JSON.stringify(movimientos));
    localStorage.setItem("inv_v0_contexto",    JSON.stringify(contexto));
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-dashed border-[#3D8A8A]/40 bg-[#EDF7F6] px-4 py-4 flex flex-col gap-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3D8A8A]">DEV · Datos de muestra</p>
        <button
          onClick={cargarMuestra}
          className="self-start rounded-xl border border-[#3D8A8A]/40 bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[#3D8A8A] hover:bg-[#3D8A8A]/8 transition active:scale-95"
        >
          CARGAR MUESTRA — 35 productos
        </button>
        <p className="text-[9px] text-[#7aacac] leading-snug">
          Bodega peruana — abarrotes, bebidas, limpieza, snacks, lácteos · estados mixtos · historial 7 días
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 flex flex-col gap-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-600">DEV · Reset — Inventario CAPA 0</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={resetDatos}
            className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-700 hover:bg-amber-100 transition active:scale-95"
          >
            RESET ÍTEMS + MOVIMIENTOS
          </button>
          <button
            onClick={resetTotal}
            className="rounded-xl border border-red-300 bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-red-600 hover:bg-red-50 transition active:scale-95"
          >
            RESET TOTAL (+ runtimeId)
          </button>
        </div>
        <p className="text-[9px] text-amber-500 leading-snug">
          ÍTEMS + MOVIMIENTOS conserva runtimeId · RESET TOTAL genera nueva identidad de runtime.
        </p>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Helper({ text }: { text: string }) {
  return (
    <span
      title={text}
      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#9ca3af]/20 text-[#9ca3af] text-[8px] font-bold cursor-help select-none leading-none"
    >?</span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9ca3af]">{children}</p>;
}

function formatTs(ts: number): string {
  const d   = new Date(ts);
  const hoy = new Date();
  const hora = d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === hoy.toDateString()) return hora;
  return `${d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" })} ${hora}`;
}
