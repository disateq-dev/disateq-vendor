import { useState } from "react";
import { ArrowLeft, CheckCircle, Clock, PackageCheck, Plus, RotateCcw, ShoppingBag, Trash2 } from "lucide-react";
import { usePurchasesStore } from "../../domains/purchases/store";
import { purchasesService } from "../../domains/purchases/service";
import { useInventoryStore } from "../../domains/inventory/store";
import type { CompraOperacional, EstadoCompra, LineaCompra } from "../../domains/purchases/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type ContextState = "vacio" | "formulario" | "detalle" | "reset";

// ── Helpers ───────────────────────────────────────────────────────────────────

function Helper({ text }: { text: string }) {
  return (
    <span title={text} className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#9ca3af]/20 text-[#9ca3af] text-[8px] font-bold cursor-help select-none leading-none">?</span>
  );
}

function formatTs(ts: number): string {
  return new Date(ts).toLocaleString("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

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
  return formatTs(ts);
}

const ESTADO_VISIBLE: Record<EstadoCompra, { label: string; cls: string }> = {
  registrada:       { label: "PENDIENTE",   cls: "bg-[#e5e7eb] text-[#6b7280]"    },
  recibida_parcial: { label: "PARCIAL",      cls: "bg-amber-50 text-amber-600"      },
  recibida:         { label: "RECIBIDO",     cls: "bg-[#3D8A8A]/10 text-[#3D8A8A]" },
};

// ── Root ──────────────────────────────────────────────────────────────────────

export function PurchasesWorkspace() {
  const { compras, runtimeId } = usePurchasesStore();
  const [contextState, setContextState] = useState<ContextState>("vacio");
  const [selectedId,   setSelectedId]   = useState<string | null>(null);

  const sorted          = [...compras].sort((a, b) => b.timestamp - a.timestamp);
  const pendientes      = compras.filter(c => c.estado === "registrada").length;
  const selectedCompra  = selectedId ? compras.find(c => c.purchaseId === selectedId) ?? null : null;

  function selectCompra(id: string) {
    setSelectedId(id);
    setContextState("detalle");
  }

  function openFormulario() {
    setSelectedId(null);
    setContextState("formulario");
  }

  function handleDone(purchaseId: string) {
    setSelectedId(purchaseId);
    setContextState("detalle");
  }

  function goBack() {
    setContextState("vacio");
    setSelectedId(null);
  }

  const rightTitle =
    contextState === "formulario" ? "REGISTRAR INGRESO"
    : contextState === "detalle" && selectedCompra ? selectedCompra.causa.toUpperCase()
    : contextState === "reset"   ? "DEV · RESET"
    : "COMPRAS";

  return (
    <div className="flex min-h-0 flex-1 gap-3">

      {/* ── SheetWork IZQUIERDA — Historial ─────────────────── */}
      <section className="flex w-[400px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#3D8A8A]/25 bg-white">

        <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#3D8A8A]/15 bg-[#F3FAF9] px-4">
          <ShoppingBag size={13} strokeWidth={2} className="text-[#3D8A8A]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">INGRESOS</span>
          {pendientes > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 py-px text-[9px] font-bold leading-none text-white tabular-nums">
              {pendientes}
            </span>
          )}
          <span className="ml-auto font-mono text-[9px] text-[#9ca3af]">{runtimeId.slice(0, 8)}…</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Clock size={24} className="text-[#d1d5db]" />
              <p className="text-[12px] text-[#9ca3af]">Sin ingresos registrados.</p>
            </div>
          ) : (
            <div className="flex flex-col py-2 px-2 gap-0.5">
              {sorted.map(c => {
                const cfg        = ESTADO_VISIBLE[c.estado];
                const isSelected = c.purchaseId === selectedId;
                const total      = c.lineas.reduce((acc, l) => acc + l.cantidad, 0);
                const recibido   = c.lineas.reduce((acc, l) => acc + (l.cantidadRecibida ?? 0), 0);
                const pct        = total > 0 ? Math.round((recibido / total) * 100) : 0;
                return (
                  <button
                    key={c.purchaseId}
                    onClick={() => selectCompra(c.purchaseId)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition ${
                      isSelected ? "bg-[#3D8A8A]/10 ring-1 ring-[#3D8A8A]/25" : "hover:bg-[#f4fafa]"
                    }`}
                  >
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-[#1f2937] truncate">
                        {c.causa}{c.proveedor ? ` · ${c.proveedor}` : ""}
                      </p>
                      <p className="text-[9.5px] text-[#9ca3af]">
                        {c.lineas.length} prod{c.lineas.length !== 1 ? "s" : ""}
                        {c.estado === "recibida_parcial" && <span className="text-amber-600"> · {pct}%</span>}
                      </p>
                    </div>
                    <span className="shrink-0 text-[9.5px] text-[#b0bac8]">{formatRelativo(c.timestamp)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-[#3D8A8A]/10 px-3 py-2.5 flex flex-col gap-1">
          <button
            onClick={openFormulario}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#3D8A8A] py-2 text-[12px] font-bold text-white hover:bg-[#276565] transition"
          >
            <Plus size={13} strokeWidth={2.5} />
            Registrar nuevo ingreso
          </button>
          {import.meta.env.DEV && (
            <button
              onClick={() => setContextState("reset")}
              className="w-full rounded-xl py-1 text-[9px] font-bold uppercase tracking-wide text-amber-500 hover:bg-amber-50 transition"
            >
              DEV · RESET
            </button>
          )}
        </div>

      </section>

      {/* ── SheetWork DERECHA — Contexto ────────────────────── */}
      <section className="flex flex-1 flex-col overflow-hidden rounded-[28px] border border-[#3D8A8A]/15 bg-[#F8FDFC]">

        <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#3D8A8A]/15 bg-[#F3FAF9] px-4">
          {contextState !== "vacio" && (
            <button onClick={goBack} className="mr-1 rounded-lg p-1 text-[#3D8A8A]/40 hover:text-[#3D8A8A] hover:bg-[#3D8A8A]/10 transition">
              <ArrowLeft size={13} strokeWidth={2} />
            </button>
          )}
          {contextState === "formulario" && <Plus size={13} strokeWidth={2} className="text-[#3D8A8A]" />}
          {contextState === "reset"      && <RotateCcw size={13} strokeWidth={2} className="text-amber-500" />}
          {contextState === "vacio"      && <ShoppingBag size={13} strokeWidth={2} className="text-[#3D8A8A]/30" />}
          {contextState === "detalle" && selectedCompra && (
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider ${ESTADO_VISIBLE[selectedCompra.estado].cls}`}>
              {ESTADO_VISIBLE[selectedCompra.estado].label}
            </span>
          )}
          <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none truncate">
            {rightTitle}
          </span>
          {contextState === "detalle" && selectedCompra?.referencia && (
            <span className="ml-auto shrink-0 text-[10px] text-[#9ca3af]">{selectedCompra.referencia}</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3">
          {contextState === "vacio"      && <ContextoVacio onNuevo={openFormulario} hasCompras={sorted.length > 0} />}
          {contextState === "formulario" && <ViewNuevaCompra onDone={handleDone} onCancel={goBack} />}
          {contextState === "detalle"    && selectedCompra && <ContextoDetalle compra={selectedCompra} />}
          {contextState === "reset"      && <ViewReset />}
        </div>

      </section>

    </div>
  );
}

// ── ContextoVacio ─────────────────────────────────────────────────────────────

function ContextoVacio({ onNuevo, hasCompras }: { onNuevo: () => void; hasCompras: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
      <ShoppingBag size={32} strokeWidth={1} className="text-[#3D8A8A]/20" />
      <p className="text-[13px] font-semibold text-[#9ca3af]">
        {hasCompras ? "Selecciona un ingreso del historial" : "Sin ingresos registrados"}
      </p>
      <p className="text-[11px] text-[#b0bac8]">
        {hasCompras ? "o registra un nuevo ingreso de mercadería" : "Registra el primer ingreso de mercadería"}
      </p>
      <button
        onClick={onNuevo}
        className="mt-2 flex items-center gap-1.5 rounded-xl border border-[#3D8A8A]/30 px-4 py-2 text-[12px] font-semibold text-[#3D8A8A] hover:bg-[#3D8A8A]/8 transition"
      >
        <Plus size={13} strokeWidth={2.5} />
        Registrar ingreso
      </button>
    </div>
  );
}

// ── ViewNuevaCompra ────────────────────────────────────────────────────────────

interface LineaDraft {
  itemId: string;
  nombreItem: string;
  unidadBase: string;
  cantidad: number;
  costoUnitario: string;
}

function ViewNuevaCompra({ onDone, onCancel }: { onDone: (id: string) => void; onCancel: () => void }) {
  const { items: todosItems } = useInventoryStore();
  const items = todosItems.filter(i => !i.eliminado);

  const [causa,       setCausa]       = useState("llegó mercadería");
  const [proveedor,   setProveedor]   = useState("");
  const [referencia,  setReferencia]  = useState("");
  const [observacion, setObservacion] = useState("");
  const [lineas,      setLineas]      = useState<LineaDraft[]>([]);
  const [recibirYa,   setRecibirYa]   = useState(false);
  const [feedback,    setFeedback]    = useState<{ msg: string; ok: boolean } | null>(null);

  function addLinea() {
    if (items.length === 0) return;
    const first = items[0];
    setLineas(prev => [...prev, { itemId: first.itemId, nombreItem: first.nombre, unidadBase: first.unidadBase, cantidad: 1, costoUnitario: "" }]);
  }

  function removeLinea(idx: number) {
    setLineas(prev => prev.filter((_, i) => i !== idx));
  }

  function updateLinea(idx: number, patch: Partial<LineaDraft>) {
    setLineas(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const next = { ...l, ...patch };
      if (patch.itemId) {
        const it = items.find(x => x.itemId === patch.itemId);
        if (it) { next.nombreItem = it.nombre; next.unidadBase = it.unidadBase; }
      }
      return next;
    }));
  }

  function handleRegistrar() {
    if (!causa.trim()) return;
    if (lineas.length === 0) { setFeedback({ msg: "Agrega al menos un producto.", ok: false }); return; }
    const lineasFinal: LineaCompra[] = lineas.map((l, idx) => ({
      lineaId: `l${idx}`, itemId: l.itemId, nombreItem: l.nombreItem,
      unidadBase: l.unidadBase, cantidad: l.cantidad,
      costoUnitario: l.costoUnitario ? parseFloat(l.costoUnitario) : undefined,
    }));
    const purchaseId = purchasesService.registrarCompra({
      causa: causa.trim(), proveedor: proveedor.trim() || undefined,
      referencia: referencia.trim() || undefined, observacion: observacion.trim() || undefined,
      lineas: lineasFinal,
    });
    if (recibirYa) purchasesService.recibirLineas(purchaseId, lineasFinal);
    onDone(purchaseId);
  }

  const inputCls = "w-full rounded-lg border border-[#d1d5db] bg-white px-3 py-1.5 text-[12px] text-[#121416] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#3D8A8A]/40";
  const labelCls = "flex items-center gap-1 mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280]";

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-[11px] text-[#9ca3af]">Registra los productos que acaban de llegar al negocio.</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            Motivo del ingreso *
            <Helper text="¿Por qué llegaron estos productos? Ej: pedido semanal, reposición." />
          </label>
          <input className={inputCls} value={causa} onChange={e => setCausa(e.target.value)} placeholder="llegó mercadería, pedido urgente…" />
        </div>
        <div>
          <label className={labelCls}>Proveedor</label>
          <input className={inputCls} value={proveedor} onChange={e => setProveedor(e.target.value)} placeholder="¿de dónde viene?" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            Boleta / Factura / Guía
            <Helper text="Número del documento. Opcional." />
          </label>
          <input className={inputCls} value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="001-003241, guía 456…" />
        </div>
        <div>
          <label className={labelCls}>
            Anotación
            <Helper text="Cualquier detalle extra." />
          </label>
          <input className={inputCls} value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="algo que quieras recordar…" />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className={labelCls}>
            Productos que llegaron
            <Helper text="Agrega cada producto incluido en este ingreso." />
          </span>
          <button
            onClick={addLinea}
            disabled={items.length === 0}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-[#3D8A8A]/10 text-[#3D8A8A] hover:bg-[#3D8A8A]/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Plus size={11} strokeWidth={2.5} />
            Agregar producto
          </button>
        </div>

        {items.length === 0 && (
          <p className="text-[11px] text-[#9ca3af]">Aún no hay productos en inventario. Agrégalos primero en INVENTARIOS.</p>
        )}
        {lineas.length === 0 && items.length > 0 && (
          <p className="text-[11px] text-[#9ca3af]">Agrega los productos que llegaron con esta compra.</p>
        )}

        {lineas.length > 0 && (
          <div className="mb-1 grid grid-cols-[1fr_56px_80px_96px_20px] gap-2 px-3">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af]">Producto</span>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af] text-center">Unidad</span>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af] text-right">Cantidad</span>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af] text-right">Precio unit.</span>
            <span />
          </div>
        )}

        <div className="space-y-2">
          {lineas.map((l, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2">
              <select value={l.itemId} onChange={e => updateLinea(idx, { itemId: e.target.value })}
                className="flex-1 rounded border border-[#d1d5db] bg-white px-2 py-1 text-[12px] text-[#121416] focus:outline-none focus:ring-1 focus:ring-[#3D8A8A]/40">
                {items.map(it => <option key={it.itemId} value={it.itemId}>{it.nombre}</option>)}
              </select>
              <span className="shrink-0 w-14 text-center text-[11px] text-[#9ca3af]">{l.unidadBase}</span>
              <input type="number" min={0.001} step={1} value={l.cantidad}
                onChange={e => updateLinea(idx, { cantidad: Math.max(0.001, parseFloat(e.target.value) || 0) })}
                className="w-20 rounded border border-[#d1d5db] bg-white px-2 py-1 text-[12px] text-right text-[#121416] focus:outline-none focus:ring-1 focus:ring-[#3D8A8A]/40" />
              <input type="number" min={0} step={0.01} placeholder="S/ —" value={l.costoUnitario}
                onChange={e => updateLinea(idx, { costoUnitario: e.target.value })}
                className="w-24 rounded border border-[#d1d5db] bg-white px-2 py-1 text-[12px] text-right text-[#121416] placeholder:text-[#d1d5db] focus:outline-none focus:ring-1 focus:ring-[#3D8A8A]/40" />
              <button onClick={() => removeLinea(idx)} className="text-[#dc2626]/50 hover:text-[#dc2626] transition">
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={recibirYa} onChange={e => setRecibirYa(e.target.checked)} className="accent-[#3D8A8A]" />
        <span className="text-[12px] font-semibold text-[#374151]">Actualizar stock al guardar</span>
        <Helper text="Activa si ya tienes los productos en el local. El stock se actualiza de inmediato." />
      </label>

      {feedback && (
        <div className={`rounded-lg px-3 py-2 text-[11px] font-semibold ${feedback.ok ? "bg-[#3D8A8A]/10 text-[#3D8A8A]" : "bg-red-50 text-red-600"}`}>
          {feedback.msg}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleRegistrar}
          disabled={!causa.trim() || lineas.length === 0}
          className="flex items-center gap-1.5 rounded-xl bg-[#3D8A8A] px-5 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-[#276565] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <CheckCircle size={14} strokeWidth={2.5} />
          {recibirYa ? "Guardar y actualizar stock" : "Guardar ingreso"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-[#e5e7eb] px-4 py-2 text-[12px] font-semibold text-[#6b7280] hover:bg-[#f9fafb] transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── ContextoDetalle ────────────────────────────────────────────────────────────

function ContextoDetalle({ compra }: { compra: CompraOperacional }) {
  const [deltaMap, setDeltaMap] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  const puedeRecibir    = compra.estado !== "recibida";
  const totalSolicitado = compra.lineas.reduce((acc, l) => acc + l.cantidad, 0);
  const totalRecibido   = compra.lineas.reduce((acc, l) => acc + (l.cantidadRecibida ?? 0), 0);
  const pctRecibido     = totalSolicitado > 0 ? Math.round((totalRecibido / totalSolicitado) * 100) : 0;

  function handleRecibirParcial() {
    const recepciones = compra.lineas
      .map(l => ({ lineaId: l.lineaId, itemId: l.itemId, cantidad: Math.max(0, parseFloat(deltaMap[l.lineaId] ?? "") || 0) }))
      .filter(r => r.cantidad > 0);
    if (recepciones.length === 0) {
      setFeedback({ msg: "Ingresa al menos una cantidad.", ok: false });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    purchasesService.recibirParcial(compra.purchaseId, recepciones);
    setDeltaMap({});
    setFeedback({ msg: "Llegada registrada. Stock actualizado.", ok: true });
    setTimeout(() => setFeedback(null), 3000);
  }

  return (
    <div className="space-y-4">

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#6b7280]">
        {compra.proveedor   && <span><span className="text-[#9ca3af]">Proveedor:</span> {compra.proveedor}</span>}
        {compra.referencia  && <span><span className="text-[#9ca3af]">Ref:</span> {compra.referencia}</span>}
        {compra.observacion && <span><span className="text-[#9ca3af]">Nota:</span> {compra.observacion}</span>}
        <span className="ml-auto text-[#b0bac8]">{formatTs(compra.timestamp)}</span>
      </div>

      {/* Barra de progreso parcial */}
      {compra.estado === "recibida_parcial" && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-[#3D8A8A]">{pctRecibido}% recibido</span>
            <span className="text-[10px] text-[#9ca3af]">{totalRecibido} de {totalSolicitado}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#e9e4dc]">
            <div className="h-full rounded-full bg-[#3D8A8A]/60 transition-all duration-300" style={{ width: `${pctRecibido}%` }} />
          </div>
        </div>
      )}

      {/* Cabecera tabla */}
      <div className={`grid gap-2 px-1 ${puedeRecibir ? "grid-cols-[1fr_52px_56px_52px_76px]" : "grid-cols-[1fr_52px_52px_52px_80px]"}`}>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af]">Producto</span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af] text-right">Pedido</span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af] text-right">Recibido</span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af] text-right">Pendiente</span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af] text-right">
          {puedeRecibir ? "¿Cuánto llegó?" : "Precio unit."}
        </span>
      </div>

      {/* Líneas */}
      <div className="space-y-1">
        {compra.lineas.map(l => {
          const recibido  = l.cantidadRecibida ?? 0;
          const pendiente = Math.max(0, l.cantidad - recibido);
          const completa  = pendiente === 0;
          return (
            <div
              key={l.lineaId}
              className={`grid gap-2 rounded-lg px-3 py-2 ${
                puedeRecibir ? "grid-cols-[1fr_52px_56px_52px_76px]" : "grid-cols-[1fr_52px_52px_52px_80px]"
              } ${completa ? "bg-[#EDF7F6]" : "bg-[#fafafa]"}`}
            >
              <span className="text-[12px] font-medium text-[#374151] truncate">{l.nombreItem}</span>
              <span className="text-[11px] text-right tabular-nums text-[#6b7280]">{l.cantidad}</span>
              <span className={`text-[11px] text-right tabular-nums font-semibold ${recibido > 0 ? "text-[#3D8A8A]" : "text-[#d1d5db]"}`}>
                {recibido > 0 ? recibido : "—"}
              </span>
              <span className={`text-[11px] text-right tabular-nums font-semibold ${completa ? "text-[#3D8A8A]" : "text-amber-600"}`}>
                {completa ? "✓" : pendiente}
              </span>
              {puedeRecibir ? (
                <input
                  type="number" min={0} max={pendiente} step={1}
                  value={deltaMap[l.lineaId] ?? ""}
                  onChange={e => setDeltaMap(prev => ({ ...prev, [l.lineaId]: e.target.value }))}
                  disabled={completa}
                  placeholder={completa ? "—" : `máx ${pendiente}`}
                  className="w-full rounded border border-[#d1d5db] bg-white px-2 py-0.5 text-[11px] text-right tabular-nums text-[#121416] disabled:opacity-30 disabled:bg-transparent disabled:border-transparent focus:outline-none focus:ring-1 focus:ring-[#3D8A8A]/40"
                />
              ) : (
                <span className="text-[11px] text-right tabular-nums text-[#6b7280]">
                  {l.costoUnitario != null ? `S/ ${l.costoUnitario.toFixed(2)}` : "—"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Acción recepción */}
      {puedeRecibir && (
        <div className="flex items-center gap-3 pt-1">
          {feedback ? (
            <span className={`text-[11px] font-semibold ${feedback.ok ? "text-[#3D8A8A]" : "text-red-600"}`}>{feedback.msg}</span>
          ) : (
            <>
              <button
                onClick={handleRecibirParcial}
                className="flex items-center gap-1.5 rounded-lg bg-[#3D8A8A] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#276565] transition"
              >
                <PackageCheck size={12} strokeWidth={2.5} />
                Registrar lo que llegó
              </button>
              <span className="text-[10px] text-[#9ca3af]">Ingresa cantidades y confirma.</span>
            </>
          )}
        </div>
      )}

      {compra.estado === "recibida" && (
        <div className="rounded-xl bg-[#3D8A8A]/8 border border-[#3D8A8A]/15 px-4 py-3">
          <p className="text-[12px] font-semibold text-[#3D8A8A]">Ingreso completamente recibido.</p>
          <p className="text-[10px] text-[#276565]/70 mt-0.5">Todo el stock fue actualizado.</p>
        </div>
      )}

      <p className="font-mono text-[9px] text-[#e5e7eb]">{compra.purchaseId}</p>
    </div>
  );
}

// ── ViewReset (DEV) ────────────────────────────────────────────────────────────

function ViewReset() {
  function resetDatos() { localStorage.removeItem("purch_v0_compras"); window.location.reload(); }
  function resetTotal()  { localStorage.removeItem("purch_v0_compras"); localStorage.removeItem("purch_v0_runtime_id"); window.location.reload(); }
  return (
    <div className="max-w-md space-y-4">
      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 flex flex-col gap-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-600">DEV · Herramientas de testing — COMPRAS</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={resetDatos} className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-700 hover:bg-amber-100 transition">RESET INGRESOS</button>
          <button onClick={resetTotal} className="rounded-xl border border-red-300 bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-red-600 hover:bg-red-50 transition">RESET TOTAL</button>
        </div>
        <p className="text-[9px] text-amber-500 leading-snug">RESET INGRESOS elimina el historial · RESET TOTAL elimina historial + runtimeId.</p>
      </div>
    </div>
  );
}
