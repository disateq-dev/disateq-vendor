import { useState } from "react";
import { Archive } from "lucide-react";
import { type InventorySubView } from "../../App";
import { useInventoryStore, deriveDisponibilidad } from "../../domains/inventory/store";
import { inventoryService } from "../../domains/inventory/service";
import type { TipoMovimiento } from "../../domains/inventory/types";

interface Props {
  subView: InventorySubView;
}

export function InventoryWorkspace({ subView }: Props) {
  const { runtimeId, items, movimientos } = useInventoryStore();

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#C4844A]/30 bg-[#FDFCF9]">

      {/* SheetHeader — h-[42px] fijo, una línea */}
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#C4844A]/15 bg-[#FBF7F3] px-4">
        <Archive size={13} strokeWidth={2} className="text-[#C4844A]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">INVENTARIO</span>
        <span className="ml-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#C4844A]/10 text-[#C4844A]">CAPA 0</span>
        <span className="ml-auto font-mono text-[9px] text-[#b0a898]">{runtimeId.slice(0, 8)}…</span>
      </div>

      {/* SheetBody */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3">
        {subView === "disponibilidad" && <ViewDisponibilidad items={items} movimientos={movimientos} />}
        {subView === "movimientos"    && <ViewMovimientos    items={items} movimientos={movimientos} />}
        {subView === "items"          && <ViewItems          items={items} />}
      </div>

    </section>
  );
}

// ── DISPONIBILIDAD ───────────────────────────────────────────────────────────

function ViewDisponibilidad({
  items,
  movimientos,
}: {
  items: ReturnType<typeof useInventoryStore>["items"];
  movimientos: ReturnType<typeof useInventoryStore>["movimientos"];
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Archive size={28} strokeWidth={1.2} className="text-[#C4844A]/30" />
        <p className="text-[12px] font-semibold text-[#9ca3af]">Sin ítems registrados</p>
        <p className="text-[11px] text-[#b0bac8]">Registra un ítem en la pestaña ÍTEMS para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Disponibilidad derivada — {items.length} ítem{items.length !== 1 ? "s" : ""} · {movimientos.length} movimiento{movimientos.length !== 1 ? "s" : ""}</Label>
      <div className="flex flex-col gap-1.5">
        {items.map(item => {
          const qty = deriveDisponibilidad(movimientos, item.itemId);
          return (
            <div key={item.itemId} className="flex items-center gap-3 rounded-xl border border-[#e9e4dc] bg-white px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#1f2937]">{item.nombre}</p>
                <p className="text-[10px] text-[#9ca3af]">{item.itemId} · {item.unidadBase}</p>
              </div>
              <span className={`tabular-nums text-[20px] font-bold leading-none ${qty < 0 ? "text-red-500" : qty === 0 ? "text-[#9ca3af]" : "text-[#45b356]"}`}>
                {qty}
              </span>
              <span className="text-[10px] text-[#b0bac8]">{item.unidadBase}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MOVIMIENTOS ──────────────────────────────────────────────────────────────

function ViewMovimientos({
  items,
  movimientos,
}: {
  items: ReturnType<typeof useInventoryStore>["items"];
  movimientos: ReturnType<typeof useInventoryStore>["movimientos"];
}) {
  const [itemId,   setItemId]   = useState(items[0]?.itemId ?? "");
  const [tipo,     setTipo]     = useState<TipoMovimiento>("entrada");
  const [cantidad, setCantidad] = useState("");
  const [causa,    setCausa]    = useState("");
  const [error,    setError]    = useState("");

  function handleRegistrar() {
    const n = parseFloat(cantidad);
    if (!itemId)      { setError("Selecciona un ítem."); return; }
    if (isNaN(n))     { setError("Cantidad inválida."); return; }
    if ((tipo === "entrada" || tipo === "salida") && n <= 0) {
      setError("Entrada/salida requieren cantidad positiva.");
      return;
    }
    setError("");
    if (tipo === "entrada") inventoryService.registrarEntrada(itemId, n, causa || "manual");
    else if (tipo === "salida") inventoryService.registrarSalida(itemId, n, causa || "manual");
    else inventoryService.registrarAjuste(itemId, n, causa || "ajuste-manual");
    setCantidad("");
    setCausa("");
  }

  const recent = [...movimientos].reverse().slice(0, 20);

  return (
    <div className="flex flex-col gap-3">

      {/* Formulario */}
      <div className="rounded-2xl border border-[#C4844A]/20 bg-[#FBF7F3] px-4 py-3 flex flex-col gap-2">
        <Label>Registrar movimiento</Label>

        <div className="flex gap-2 flex-wrap">
          <select
            value={itemId}
            onChange={e => setItemId(e.target.value)}
            className="flex-1 min-w-[140px] rounded-lg border border-[#e9e4dc] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#C4844A]/50"
          >
            {items.length === 0 && <option value="">— sin ítems —</option>}
            {items.map(i => <option key={i.itemId} value={i.itemId}>{i.nombre}</option>)}
          </select>

          <select
            value={tipo}
            onChange={e => setTipo(e.target.value as TipoMovimiento)}
            className="rounded-lg border border-[#e9e4dc] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#C4844A]/50"
          >
            <option value="entrada">+ Entrada</option>
            <option value="salida">− Salida</option>
            <option value="ajuste">± Ajuste</option>
          </select>

          <input
            type="number"
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            placeholder="cantidad"
            className="w-24 rounded-lg border border-[#e9e4dc] bg-white px-3 py-1.5 text-[12px] tabular-nums focus:outline-none focus:border-[#C4844A]/50"
          />

          <input
            value={causa}
            onChange={e => setCausa(e.target.value)}
            placeholder="causa (opcional)"
            className="flex-1 min-w-[100px] rounded-lg border border-[#e9e4dc] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#C4844A]/50"
          />

          <button
            onClick={handleRegistrar}
            disabled={items.length === 0}
            className="rounded-lg bg-[#C4844A] px-4 py-1.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-[#a86d38] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Registrar
          </button>
        </div>

        {error && <p className="text-[11px] text-red-500">{error}</p>}
        {items.length === 0 && (
          <p className="text-[11px] text-[#9ca3af]">Registra un ítem en la pestaña ÍTEMS primero.</p>
        )}
      </div>

      {/* Log reciente */}
      {recent.length > 0 && (
        <div className="flex flex-col gap-1">
          <Label>Últimos {recent.length} movimientos</Label>
          {recent.map(m => {
            const sign = m.tipo === "entrada" ? "+" : m.tipo === "salida" ? "−" : "±";
            const color = m.tipo === "entrada" ? "text-[#45b356]" : m.tipo === "salida" ? "text-red-500" : "text-[#005BE3]";
            return (
              <div key={m.movementId} className="flex items-center gap-3 rounded-xl border border-[#f0ece6] bg-white px-3 py-2">
                <span className={`w-4 text-center font-bold text-[13px] ${color}`}>{sign}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#374151]">{items.find(i => i.itemId === m.itemId)?.nombre ?? m.itemId}</p>
                  <p className="text-[10px] text-[#9ca3af]">{m.causa} · {new Date(m.timestamp).toLocaleTimeString()}</p>
                </div>
                <span className={`tabular-nums text-[13px] font-bold ${color}`}>{sign}{Math.abs(m.cantidad)}</span>
              </div>
            );
          })}
        </div>
      )}

      {movimientos.length === 0 && (
        <p className="text-center text-[11px] text-[#b0bac8] py-8">Sin movimientos registrados.</p>
      )}
    </div>
  );
}

// ── ÍTEMS ────────────────────────────────────────────────────────────────────

function ViewItems({ items }: { items: ReturnType<typeof useInventoryStore>["items"] }) {
  const [nombre,      setNombre]      = useState("");
  const [unidadBase,  setUnidadBase]  = useState("unidad");
  const [error,       setError]       = useState("");

  function handleRegistrar() {
    const name = nombre.trim();
    if (!name) { setError("El nombre es obligatorio."); return; }
    setError("");
    const itemId = `IT-${Date.now()}`;
    inventoryService.registrarItem({ itemId, nombre: name, unidadBase: unidadBase || "unidad" });
    setNombre("");
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Formulario */}
      <div className="rounded-2xl border border-[#C4844A]/20 bg-[#FBF7F3] px-4 py-3 flex flex-col gap-2">
        <Label>Registrar ítem</Label>
        <div className="flex gap-2 flex-wrap">
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleRegistrar(); }}
            placeholder="nombre del ítem"
            className="flex-1 min-w-[160px] rounded-lg border border-[#e9e4dc] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#C4844A]/50"
          />
          <input
            value={unidadBase}
            onChange={e => setUnidadBase(e.target.value)}
            placeholder="unidad"
            className="w-24 rounded-lg border border-[#e9e4dc] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#C4844A]/50"
          />
          <button
            onClick={handleRegistrar}
            className="rounded-lg bg-[#C4844A] px-4 py-1.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-[#a86d38] active:scale-95"
          >
            Registrar
          </button>
        </div>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
      </div>

      {/* Lista */}
      {items.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Label>{items.length} ítem{items.length !== 1 ? "s" : ""} registrado{items.length !== 1 ? "s" : ""}</Label>
          {items.map(item => (
            <div key={item.itemId} className="flex items-center gap-3 rounded-xl border border-[#f0ece6] bg-white px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#1f2937]">{item.nombre}</p>
                <p className="text-[10px] text-[#9ca3af] font-mono">{item.itemId} · {item.unidadBase}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-[11px] text-[#b0bac8] py-8">Sin ítems. Registra el primero arriba.</p>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9ca3af]">{children}</p>
  );
}
