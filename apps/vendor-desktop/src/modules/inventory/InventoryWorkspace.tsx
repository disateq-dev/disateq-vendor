import { useState } from "react";
import { Archive, Trash2 } from "lucide-react";
import { type InventorySubView } from "../../App";
import { useInventoryStore, deriveDisponibilidad, deriveEstado } from "../../domains/inventory/store";
import { inventoryService } from "../../domains/inventory/service";
import type { TipoMovimiento, EstadoDisponibilidad } from "../../domains/inventory/types";

interface Props {
  subView: InventorySubView;
}

export function InventoryWorkspace({ subView }: Props) {
  const { runtimeId, items: todosItems, movimientos, contexto } = useInventoryStore();
  const items = todosItems.filter(i => !i.eliminado);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#C4844A]/30 bg-[#FDFCF9]">

      {/* SheetHeader — h-[42px] fijo, una línea */}
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#C4844A]/15 bg-[#FBF7F3] px-4">
        <Archive size={13} strokeWidth={2} className="text-[#C4844A]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">INVENTARIO</span>
        <span className="ml-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#C4844A]/10 text-[#C4844A]">CAPA 1</span>
        <span className="ml-auto font-mono text-[9px] text-[#b0a898]">{runtimeId.slice(0, 8)}…</span>
      </div>

      {/* SheetBody */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3">
        {subView === "disponibilidad" && <ViewDisponibilidad items={items} movimientos={movimientos} contexto={contexto} />}
        {subView === "movimientos"    && <ViewMovimientos    items={items} movimientos={movimientos} />}
        {subView === "items"          && <ViewItems          items={items} contexto={contexto} />}
        {subView === "reset"          && <ViewReset />}
      </div>

    </section>
  );
}

// ── DISPONIBILIDAD ───────────────────────────────────────────────────────────

const ESTADO_CFG: Record<EstadoDisponibilidad, { label: string; badge: string; qty: string }> = {
  disponible: { label: "DISPONIBLE", badge: "bg-[#45b356]/12 text-[#45b356]",   qty: "text-[#45b356]"  },
  bajo_stock: { label: "BAJO STOCK", badge: "bg-[#C4844A]/12 text-[#C4844A]",   qty: "text-[#C4844A]"  },
  agotado:    { label: "AGOTADO",    badge: "bg-red-50 text-red-500",            qty: "text-red-400"    },
};

function ViewDisponibilidad({
  items,
  movimientos,
  contexto,
}: {
  items: ReturnType<typeof useInventoryStore>["items"];
  movimientos: ReturnType<typeof useInventoryStore>["movimientos"];
  contexto: ReturnType<typeof useInventoryStore>["contexto"];
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
      <Label>Disponibilidad contextual — {items.length} ítem{items.length !== 1 ? "s" : ""} · {movimientos.length} movimiento{movimientos.length !== 1 ? "s" : ""}</Label>
      <div className="flex flex-col gap-1.5">
        {items.map(item => {
          const existencia = deriveDisponibilidad(movimientos, item.itemId);
          const umbral     = contexto.find(c => c.itemId === item.itemId)?.umbralMinimo ?? 0;
          const estado     = deriveEstado(existencia, umbral);
          const cfg        = ESTADO_CFG[estado];
          return (
            <DisponibilidadCard
              key={item.itemId}
              item={item}
              existencia={existencia}
              umbral={umbral}
              estado={estado}
              cfg={cfg}
            />
          );
        })}
      </div>
    </div>
  );
}

function DisponibilidadCard({
  item,
  existencia,
  umbral,
  cfg,
}: {
  item: ReturnType<typeof useInventoryStore>["items"][number];
  existencia: number;
  umbral: number;
  estado: EstadoDisponibilidad;
  cfg: typeof ESTADO_CFG[EstadoDisponibilidad];
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

  function cancelar() {
    setAccion(null);
    setCantidad("1");
  }

  function activar(tipo: "entrada" | "salida") {
    setAccion(tipo);
    setCantidad("1");
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e9e4dc] bg-white px-4 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[#1f2937]">{item.nombre}</p>
        <p className="text-[10px] text-[#9ca3af]">{item.unidadBase}{umbral > 0 && ` · mín. ${umbral}`}</p>
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
            onKeyDown={e => {
              if (e.key === "Enter")  confirmar();
              if (e.key === "Escape") cancelar();
            }}
            className="w-16 rounded border border-[#e9e4dc] px-2 py-0.5 text-[12px] tabular-nums text-center focus:outline-none focus:border-[#C4844A]/50"
          />
          <button
            onClick={confirmar}
            className="rounded px-2 py-0.5 text-[11px] font-bold bg-[#C4844A] text-white hover:bg-[#a86d38] transition active:scale-95"
          >
            OK
          </button>
          <button
            onClick={cancelar}
            className="text-[11px] text-[#b0bac8] hover:text-[#6b7280] transition"
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cfg.badge}`}>
            {cfg.label}
          </span>
          <span className={`tabular-nums text-[20px] font-bold leading-none ${cfg.qty}`}>
            {existencia}
          </span>
          <span className="text-[10px] text-[#b0bac8]">{item.unidadBase}</span>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => activar("entrada")}
              className="rounded px-2 py-1 text-[11px] font-bold text-[#45b356] border border-[#45b356]/30 hover:bg-[#45b356]/8 transition active:scale-95"
              title="Registrar entrada"
            >
              +
            </button>
            <button
              onClick={() => activar("salida")}
              className="rounded px-2 py-1 text-[11px] font-bold text-red-500 border border-red-200 hover:bg-red-50 transition active:scale-95"
              title="Registrar salida"
            >
              −
            </button>
          </div>
        </>
      )}
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
  const [itemId,      setItemId]      = useState(items[0]?.itemId ?? "");
  const [tipo,        setTipo]        = useState<TipoMovimiento>("entrada");
  const [cantidad,    setCantidad]    = useState("");
  const [causa,       setCausa]       = useState("");
  const [error,       setError]       = useState("");
  const [busqueda,    setBusqueda]    = useState("");
  const [filtroTipo,  setFiltroTipo]  = useState<TipoMovimiento | "todos">("todos");
  const [copiado,     setCopiado]     = useState(false);

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

  const hayFiltro = busqueda.trim() !== "" || filtroTipo !== "todos";

  function exportarCSV() {
    const header = "Fecha,Ítem,Tipo,Cantidad,Causa";
    const filas = [...movimientos].reverse().map(m => {
      const nombre = items.find(i => i.itemId === m.itemId)?.nombre ?? m.itemId;
      const fecha  = new Date(m.timestamp).toLocaleString("es-PE");
      const signo  = m.tipo === "salida" ? -Math.abs(m.cantidad) : m.cantidad;
      return [fecha, `"${nombre}"`, m.tipo, signo, `"${m.causa}"`].join(",");
    });
    const csv = [header, ...filas].join("\n");
    navigator.clipboard.writeText(csv).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
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

      {/* Filtros + Log */}
      {movimientos.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="buscar ítem…"
              className="flex-1 min-w-[120px] rounded-lg border border-[#e9e4dc] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#C4844A]/50"
            />
            {(["todos", "entrada", "salida", "ajuste"] as const).map(t => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                  filtroTipo === t
                    ? t === "todos"    ? "bg-[#1f2937] text-white"
                    : t === "entrada"  ? "bg-[#45b356] text-white"
                    : t === "salida"   ? "bg-red-500 text-white"
                    : "bg-[#005BE3] text-white"
                    : "border border-[#e9e4dc] text-[#6b7280] hover:border-[#C4844A]/40"
                }`}
              >
                {t === "todos" ? "TODOS" : t === "entrada" ? "+" : t === "salida" ? "−" : "±"}
              </button>
            ))}
            {hayFiltro && (
              <button
                onClick={() => { setBusqueda(""); setFiltroTipo("todos"); }}
                className="text-[11px] text-[#b0bac8] hover:text-[#6b7280] transition"
              >
                ✕
              </button>
            )}
            <div className="ml-auto">
              <button
                onClick={exportarCSV}
                className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                  copiado
                    ? "bg-[#45b356] text-white"
                    : "border border-[#e9e4dc] text-[#6b7280] hover:border-[#C4844A]/40 hover:text-[#C4844A]"
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
                  : `Últimos ${filtrados.length} movimientos`}
              </Label>
              {filtrados.map(m => {
                const sign  = m.tipo === "entrada" ? "+" : m.tipo === "salida" ? "−" : "±";
                const color = m.tipo === "entrada" ? "text-[#45b356]" : m.tipo === "salida" ? "text-red-500" : "text-[#005BE3]";
                return (
                  <div key={m.movementId} className="flex items-center gap-3 rounded-xl border border-[#f0ece6] bg-white px-3 py-2">
                    <span className={`w-4 text-center font-bold text-[13px] ${color}`}>{sign}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#374151]">{items.find(i => i.itemId === m.itemId)?.nombre ?? m.itemId}</p>
                      <p className="text-[10px] text-[#9ca3af]">{m.causa} · {formatTs(m.timestamp)}</p>
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
        <p className="text-center text-[11px] text-[#b0bac8] py-8">Sin movimientos registrados.</p>
      )}
    </div>
  );
}

// ── ÍTEMS ────────────────────────────────────────────────────────────────────

function ViewItems({
  items,
  contexto,
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
          <input
            type="number"
            value={umbral}
            onChange={e => setUmbral(e.target.value)}
            placeholder="stock mínimo"
            title="Stock mínimo antes de alertar (opcional)"
            className="w-20 rounded-lg border border-[#e9e4dc] bg-white px-3 py-1.5 text-[12px] tabular-nums focus:outline-none focus:border-[#C4844A]/50"
          />
          <button
            onClick={handleRegistrar}
            className="rounded-lg bg-[#C4844A] px-4 py-1.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-[#a86d38] active:scale-95"
          >
            Registrar
          </button>
        </div>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
        <p className="text-[9.5px] text-[#b0bac8]">stock mínimo: cantidad antes de marcar BAJO STOCK · 0 = sin alerta</p>
      </div>

      {/* Lista */}
      {items.length > 0 ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="buscar ítem…"
              className="flex-1 rounded-lg border border-[#e9e4dc] bg-white px-3 py-1.5 text-[12px] focus:outline-none focus:border-[#C4844A]/50"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="text-[11px] text-[#b0bac8] hover:text-[#6b7280] transition"
              >
                ✕
              </button>
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
                <Label>{filtrados.length} de {items.length} ítem{items.length !== 1 ? "s" : ""}</Label>
                {filtrados.map(item => {
                  const umbralMinimo = contexto.find(c => c.itemId === item.itemId)?.umbralMinimo ?? 0;
                  return <ItemRow key={item.itemId} item={item} umbralMinimo={umbralMinimo} />;
                })}
              </>
            );
          })()}
        </div>
      ) : (
        <p className="text-center text-[11px] text-[#b0bac8] py-8">Sin ítems. Registra el primero arriba.</p>
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
          <p className="text-[10px] text-red-400">¿Confirmar baja? Los movimientos se conservan.</p>
        </div>
        <button
          onClick={() => inventoryService.darDeBaja(item.itemId)}
          className="rounded px-2.5 py-1 text-[11px] font-bold bg-red-500 text-white hover:bg-red-600 transition active:scale-95"
        >
          DAR DE BAJA
        </button>
        <button
          onClick={() => setConfirmBaja(false)}
          className="text-[11px] text-[#b0bac8] hover:text-[#6b7280] transition"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#f0ece6] bg-white px-4 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[#1f2937]">{item.nombre}</p>
        <p className="text-[10px] text-[#9ca3af] font-mono">{item.itemId} · {item.unidadBase}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-[#b0bac8]">stock mínimo</span>
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
            className="w-14 rounded border border-[#C4844A]/40 px-1.5 py-0.5 text-[11px] tabular-nums text-center focus:outline-none"
          />
        ) : (
          <button
            onClick={() => { setVal(String(umbralMinimo > 0 ? umbralMinimo : "")); setEditing(true); }}
            className="min-w-[28px] rounded border border-[#e9e4dc] px-2 py-0.5 text-[11px] tabular-nums text-[#6b7280] hover:border-[#C4844A]/40 transition"
          >
            {umbralMinimo > 0 ? umbralMinimo : "—"}
          </button>
        )}
      </div>
      <button
        onClick={() => setConfirmBaja(true)}
        className="shrink-0 rounded p-1 text-[#d1d5db] hover:text-red-400 hover:bg-red-50 transition"
        title="Dar de baja"
      >
        <Trash2 size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

// ── RESET (DEV) ──────────────────────────────────────────────────────────────

const MUESTRA_BODEGA = [
  // Abarrotes
  { nombre: "Arroz Superior Extra",            unidad: "kg",       umbral: 20, stock: 45 },
  { nombre: "Azúcar Rubia",                    unidad: "kg",       umbral: 15, stock: 8  },
  { nombre: "Aceite Primor 1L",                unidad: "botella",  umbral: 12, stock: 0  },
  { nombre: "Fideo Tallarin Don Vittorio",     unidad: "paquete",  umbral: 24, stock: 36 },
  { nombre: "Sal Emsal 1kg",                   unidad: "bolsa",    umbral: 10, stock: 22 },
  { nombre: "Harina Preparada Blanca Flor",    unidad: "bolsa",    umbral: 6,  stock: 3  },
  { nombre: "Avena Quaker 180g",               unidad: "bolsa",    umbral: 10, stock: 17 },
  { nombre: "Leche Evaporada Gloria",          unidad: "lata",     umbral: 48, stock: 60 },
  // Bebidas
  { nombre: "Agua Cielo 625ml",                unidad: "botella",  umbral: 24, stock: 72 },
  { nombre: "Inca Kola 1.5L",                  unidad: "botella",  umbral: 12, stock: 5  },
  { nombre: "Coca-Cola 500ml",                 unidad: "botella",  umbral: 24, stock: 48 },
  { nombre: "Chicha Morada Negrita 500ml",     unidad: "caja",     umbral: 12, stock: 0  },
  { nombre: "Jugo Pulp Naranja 1L",            unidad: "caja",     umbral: 6,  stock: 14 },
  { nombre: "Cerveza Cristal 650ml",           unidad: "botella",  umbral: 24, stock: 36 },
  // Limpieza
  { nombre: "Detergente Ariel 360g",           unidad: "bolsa",    umbral: 12, stock: 9  },
  { nombre: "Lejía Clorox 1L",                 unidad: "botella",  umbral: 6,  stock: 18 },
  { nombre: "Jabón Bolivar 200g",              unidad: "barra",    umbral: 24, stock: 48 },
  { nombre: "Papel Higiénico Elite x4",        unidad: "paquete",  umbral: 8,  stock: 4  },
  { nombre: "Lavavajilla Sapolio 180g",        unidad: "tarro",    umbral: 6,  stock: 12 },
  // Snacks
  { nombre: "Galletas Oreo 117g",              unidad: "paquete",  umbral: 12, stock: 30 },
  { nombre: "Chifle Frito Lay 80g",            unidad: "bolsa",    umbral: 12, stock: 2  },
  { nombre: "Papas Fritas Pringles 40g",       unidad: "lata",     umbral: 8,  stock: 0  },
  { nombre: "Caramelos Halls Menta",           unidad: "bolsa",    umbral: 6,  stock: 15 },
  // Cuidado personal
  { nombre: "Shampoo Head & Shoulders 200ml",  unidad: "frasco",   umbral: 6,  stock: 8  },
  { nombre: "Pasta Dental Colgate Triple",     unidad: "tubo",     umbral: 6,  stock: 24 },
  { nombre: "Jabón de Tocador Lux",            unidad: "barra",    umbral: 12, stock: 5  },
  // Lácteos
  { nombre: "Yogurt Gloria Fresa 1kg",         unidad: "pote",     umbral: 6,  stock: 12 },
  { nombre: "Queso Fresco La Florida 250g",    unidad: "unidad",   umbral: 4,  stock: 0  },
  // Desayuno
  { nombre: "Pan de Molde Bimbo Grande",       unidad: "bolsa",    umbral: 4,  stock: 7  },
  { nombre: "Mermelada Fanny Fresa 300g",      unidad: "frasco",   umbral: 4,  stock: 9  },
  { nombre: "Margarina Manty 100g",            unidad: "tarro",    umbral: 6,  stock: 3  },
  // Conservas
  { nombre: "Atún Florida en Agua",            unidad: "lata",     umbral: 12, stock: 28 },
  { nombre: "Sardina Campomar Tomate",         unidad: "lata",     umbral: 12, stock: 16 },
  // Otros
  { nombre: "Vela Familiar 7cm",               unidad: "unidad",   umbral: 10, stock: 0  },
  { nombre: "Fósforos Llama",                  unidad: "caja",     umbral: 6,  stock: 24 },
] as const;

function ViewReset() {
  function resetDatos() {
    localStorage.removeItem("inv_v0_items");
    localStorage.removeItem("inv_v0_movimientos");
    localStorage.removeItem("inv_v0_contexto");
    window.location.reload();
  }

  function resetTotal() {
    localStorage.removeItem("inv_v0_items");
    localStorage.removeItem("inv_v0_movimientos");
    localStorage.removeItem("inv_v0_contexto");
    localStorage.removeItem("inv_v0_runtime_id");
    window.location.reload();
  }

  function cargarMuestra() {
    const now      = Date.now();
    const day      = 86_400_000;
    const runtimeId = localStorage.getItem("inv_v0_runtime_id") ?? crypto.randomUUID();

    const items = MUESTRA_BODEGA.map((p, i) => ({
      itemId:     `IT-SEED-${String(i + 1).padStart(3, "0")}`,
      nombre:     p.nombre,
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
      <div className="rounded-2xl border border-dashed border-[#C4844A]/40 bg-[#FBF7F3] px-4 py-4 flex flex-col gap-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#C4844A]">DEV · Datos de muestra</p>
        <button
          onClick={cargarMuestra}
          className="self-start rounded-xl border border-[#C4844A]/40 bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-[#C4844A] hover:bg-[#C4844A]/8 transition active:scale-95"
        >
          CARGAR MUESTRA — 35 productos
        </button>
        <p className="text-[9px] text-[#b0a898] leading-snug">
          Bodega peruana — abarrotes, bebidas, limpieza, snacks, lácteos · estados mixtos · historial 7 días
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 flex flex-col gap-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-600">DEV · Reset temporal — Inventario CAPA 0</p>
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

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9ca3af]">{children}</p>
  );
}

function formatTs(ts: string): string {
  const d = new Date(ts);
  const hoy = new Date();
  const esHoy = d.toDateString() === hoy.toDateString();
  const hora = d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  if (esHoy) return hora;
  const fecha = d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" });
  return `${fecha} ${hora}`;
}
