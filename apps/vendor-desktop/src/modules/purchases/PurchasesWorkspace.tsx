import { useState } from "react";
import { ShoppingBag, Plus, Trash2, CheckCircle, Clock, PackageCheck } from "lucide-react";
import { type PurchasesSubView } from "../../App";
import { usePurchasesStore } from "../../domains/purchases/store";
import { purchasesService } from "../../domains/purchases/service";
import { useInventoryStore } from "../../domains/inventory/store";
import type { CompraOperacional, EstadoCompra, LineaCompra } from "../../domains/purchases/types";

interface Props {
  subView: PurchasesSubView;
}

// Ayuda contextual inline — discreta, no invasiva
function Helper({ text }: { text: string }) {
  return (
    <span
      title={text}
      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#9ca3af]/20 text-[#9ca3af] text-[8px] font-bold cursor-help select-none leading-none"
    >
      ?
    </span>
  );
}

export function PurchasesWorkspace({ subView }: Props) {
  const { runtimeId } = usePurchasesStore();

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#6670A8]/30 bg-[#F8FBF9]">

      {/* SheetHeader — h-[42px] fijo, una línea */}
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#6670A8]/15 bg-[#F3F4FB] px-4">
        <ShoppingBag size={13} strokeWidth={2} className="text-[#6670A8]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">COMPRAS</span>
        <span className="ml-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#6670A8]/10 text-[#6670A8]">CAPA 0</span>
        <span className="ml-auto font-mono text-[9px] text-[#9ca3af]">{runtimeId.slice(0, 8)}…</span>
      </div>

      {/* SheetBody */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3">
        {subView === "nueva"     && <ViewNuevaCompra />}
        {subView === "historial" && <ViewHistorial />}
        {subView === "reset"     && <ViewReset />}
      </div>

    </section>
  );
}

// ── REGISTRAR INGRESO ────────────────────────────────────────────────────────

interface LineaDraft {
  itemId: string;
  nombreItem: string;
  unidadBase: string;
  cantidad: number;
  costoUnitario: string;
}

function ViewNuevaCompra() {
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
    setLineas(prev => [...prev, {
      itemId:        first.itemId,
      nombreItem:    first.nombre,
      unidadBase:    first.unidadBase,
      cantidad:      1,
      costoUnitario: "",
    }]);
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
    if (lineas.length === 0) {
      setFeedback({ msg: "Agrega al menos un producto.", ok: false });
      return;
    }
    const lineasFinal: LineaCompra[] = lineas.map((l, idx) => ({
      lineaId:       `l${idx}`,
      itemId:        l.itemId,
      nombreItem:    l.nombreItem,
      unidadBase:    l.unidadBase,
      cantidad:      l.cantidad,
      costoUnitario: l.costoUnitario ? parseFloat(l.costoUnitario) : undefined,
    }));
    const purchaseId = purchasesService.registrarCompra({
      causa:      causa.trim(),
      proveedor:  proveedor.trim()  || undefined,
      referencia: referencia.trim() || undefined,
      observacion: observacion.trim() || undefined,
      lineas: lineasFinal,
    });
    if (recibirYa) {
      purchasesService.recibirLineas(purchaseId, lineasFinal);
      setFeedback({ msg: "Ingreso guardado. El stock fue actualizado.", ok: true });
    } else {
      setFeedback({ msg: "Ingreso guardado. Puedes confirmar la llegada cuando tengas el producto.", ok: true });
    }
    setCausa("llegó mercadería");
    setProveedor("");
    setReferencia("");
    setObservacion("");
    setLineas([]);
    setRecibirYa(false);
    setTimeout(() => setFeedback(null), 4000);
  }

  const inputCls = "w-full rounded-lg border border-[#d1d5db] bg-white px-3 py-1.5 text-[12px] text-[#121416] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#6670A8]/40";
  const labelCls = "flex items-center gap-1 mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280]";

  return (
    <div className="max-w-2xl space-y-4">

      {/* Contexto operacional — helper discreto */}
      <p className="text-[11px] text-[#9ca3af]">
        Registra los productos que acaban de llegar al negocio.
      </p>

      {/* Motivo + Proveedor */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            Motivo del ingreso *
            <Helper text="¿Por qué llegaron estos productos? Ej: pedido semanal, urgente, reposición." />
          </label>
          <input
            className={inputCls}
            value={causa}
            onChange={e => setCausa(e.target.value)}
            placeholder="llegó mercadería, pedido urgente…"
          />
        </div>
        <div>
          <label className={labelCls}>Proveedor</label>
          <input
            className={inputCls}
            value={proveedor}
            onChange={e => setProveedor(e.target.value)}
            placeholder="¿de dónde viene?"
          />
        </div>
      </div>

      {/* Documento + Anotación */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            Boleta / Factura / Guía
            <Helper text="Número del documento que llegó con la mercadería. Opcional." />
          </label>
          <input
            className={inputCls}
            value={referencia}
            onChange={e => setReferencia(e.target.value)}
            placeholder="001-003241, guía 456…"
          />
        </div>
        <div>
          <label className={labelCls}>
            Anotación
            <Helper text="Cualquier detalle extra sobre este ingreso." />
          </label>
          <input
            className={inputCls}
            value={observacion}
            onChange={e => setObservacion(e.target.value)}
            placeholder="algo que quieras recordar…"
          />
        </div>
      </div>

      {/* Productos que llegaron */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className={labelCls}>
            Productos que llegaron
            <Helper text="Agrega cada producto incluido en este ingreso. Puedes registrar el precio de compra si lo tienes." />
          </span>
          <button
            onClick={addLinea}
            disabled={items.length === 0}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-[#6670A8]/10 text-[#6670A8] hover:bg-[#6670A8]/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Plus size={11} strokeWidth={2.5} />
            Agregar producto
          </button>
        </div>

        {items.length === 0 && (
          <p className="text-[11px] text-[#9ca3af]">
            Aún no hay productos en el inventario. Agrégalos primero en INVENTARIOS.
          </p>
        )}

        {lineas.length === 0 && items.length > 0 && (
          <p className="text-[11px] text-[#9ca3af]">
            Agrega los productos que llegaron con esta compra.
          </p>
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
              <select
                value={l.itemId}
                onChange={e => updateLinea(idx, { itemId: e.target.value })}
                className="flex-1 rounded border border-[#d1d5db] bg-white px-2 py-1 text-[12px] text-[#121416] focus:outline-none focus:ring-1 focus:ring-[#6670A8]/40"
              >
                {items.map(it => (
                  <option key={it.itemId} value={it.itemId}>{it.nombre}</option>
                ))}
              </select>
              <span className="shrink-0 w-14 text-center text-[11px] text-[#9ca3af]">{l.unidadBase}</span>
              <input
                type="number"
                min={0.001}
                step={1}
                value={l.cantidad}
                onChange={e => updateLinea(idx, { cantidad: Math.max(0.001, parseFloat(e.target.value) || 0) })}
                className="w-20 rounded border border-[#d1d5db] bg-white px-2 py-1 text-[12px] text-right text-[#121416] focus:outline-none focus:ring-1 focus:ring-[#6670A8]/40"
              />
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="S/ —"
                value={l.costoUnitario}
                onChange={e => updateLinea(idx, { costoUnitario: e.target.value })}
                className="w-24 rounded border border-[#d1d5db] bg-white px-2 py-1 text-[12px] text-right text-[#121416] placeholder:text-[#d1d5db] focus:outline-none focus:ring-1 focus:ring-[#6670A8]/40"
              />
              <button onClick={() => removeLinea(idx)} className="text-[#dc2626]/50 hover:text-[#dc2626] transition">
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actualizar stock al guardar */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={recibirYa}
          onChange={e => setRecibirYa(e.target.checked)}
          className="accent-[#6670A8]"
        />
        <span className="text-[12px] font-semibold text-[#374151]">Actualizar stock al guardar</span>
        <Helper text="Activa esto si ya tienes los productos en el local. El stock se actualiza de inmediato." />
      </label>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-lg px-3 py-2 text-[11px] font-semibold ${
          feedback.ok
            ? "bg-[#6670A8]/10 text-[#6670A8]"
            : "bg-red-50 text-red-600"
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Acción principal */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleRegistrar}
          disabled={!causa.trim() || lineas.length === 0}
          className="flex items-center gap-1.5 rounded-xl bg-[#6670A8] px-5 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-[#5560a0] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <CheckCircle size={14} strokeWidth={2.5} />
          {recibirYa ? "Guardar y actualizar stock" : "Guardar ingreso"}
        </button>
      </div>
    </div>
  );
}

// ── HISTORIAL DE INGRESOS ────────────────────────────────────────────────────

// Lenguaje interno (tipos) ≠ lenguaje visible (UI)
const ESTADO_VISIBLE: Record<EstadoCompra, { label: string; cls: string }> = {
  registrada:       { label: "PENDIENTE",       cls: "bg-[#e5e7eb] text-[#6b7280]"    },
  recibida_parcial: { label: "LLEGÓ PARCIAL",   cls: "bg-amber-50 text-amber-600"      },
  recibida:         { label: "RECIBIDO",         cls: "bg-[#6670A8]/10 text-[#6670A8]" },
};

function formatTs(ts: number): string {
  return new Date(ts).toLocaleString("es-PE", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function ViewHistorial() {
  const { compras } = usePurchasesStore();
  const sorted = [...compras].sort((a, b) => b.timestamp - a.timestamp);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <Clock size={24} className="text-[#d1d5db]" />
        <p className="text-[12px] text-[#9ca3af]">Todavía no hay ingresos registrados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map(c => <IngresoRow key={c.purchaseId} compra={c} />)}
    </div>
  );
}

function IngresoRow({ compra }: { compra: CompraOperacional }) {
  const [open, setOpen] = useState(false);
  const cfg = ESTADO_VISIBLE[compra.estado];
  const totalProductos = compra.lineas.reduce((s, l) => s + l.cantidad, 0);

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f9fafb] transition"
      >
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cfg.cls}`}>
          {cfg.label}
        </span>
        <span className="flex-1 text-[12px] font-semibold text-[#121416] truncate">
          {compra.causa}{compra.proveedor ? ` · ${compra.proveedor}` : ""}
        </span>
        <span className="shrink-0 text-[10px] text-[#9ca3af]">
          {compra.lineas.length} {compra.lineas.length === 1 ? "producto" : "productos"} · {totalProductos} unid.
        </span>
        {compra.referencia && (
          <span className="shrink-0 text-[10px] text-[#9ca3af]">{compra.referencia}</span>
        )}
        <span className="shrink-0 text-[10px] text-[#9ca3af]">{formatTs(compra.timestamp)}</span>
        <span className={`shrink-0 text-[11px] text-[#9ca3af] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="border-t border-[#f3f4f6] px-4 py-3">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                <th className="pb-1.5 pr-3">Producto</th>
                <th className="pb-1.5 pr-3 text-right">Cantidad</th>
                <th className="pb-1.5 pr-3">Unidad</th>
                <th className="pb-1.5 text-right">Precio unit.</th>
              </tr>
            </thead>
            <tbody>
              {compra.lineas.map(l => (
                <tr key={l.lineaId} className="border-t border-[#f3f4f6]">
                  <td className="py-1 pr-3 font-medium text-[#374151]">{l.nombreItem}</td>
                  <td className="py-1 pr-3 text-right tabular-nums text-[#121416]">{l.cantidad}</td>
                  <td className="py-1 pr-3 text-[#6b7280]">{l.unidadBase}</td>
                  <td className="py-1 text-right tabular-nums text-[#6b7280]">
                    {l.costoUnitario != null ? `S/ ${l.costoUnitario.toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {compra.observacion && (
            <p className="mt-2 text-[11px] text-[#6b7280]">Nota: {compra.observacion}</p>
          )}

          {compra.estado === "registrada" && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => purchasesService.recibirLineas(compra.purchaseId, compra.lineas)}
                className="flex items-center gap-1.5 rounded-lg bg-[#6670A8] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#5560a0] transition"
              >
                <PackageCheck size={12} strokeWidth={2.5} />
                Confirmar llegada — actualizar stock
              </button>
              <span className="text-[10px] text-[#9ca3af]">Actualiza el inventario con los productos de este ingreso.</span>
            </div>
          )}

          <p className="mt-3 font-mono text-[9px] text-[#e5e7eb]">{compra.purchaseId}</p>
        </div>
      )}
    </div>
  );
}

// ── DEV · RESET ──────────────────────────────────────────────────────────────

function ViewReset() {
  function resetDatos() {
    localStorage.removeItem("purch_v0_compras");
    window.location.reload();
  }

  function resetTotal() {
    localStorage.removeItem("purch_v0_compras");
    localStorage.removeItem("purch_v0_runtime_id");
    window.location.reload();
  }

  return (
    <div className="max-w-md space-y-4">
      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 flex flex-col gap-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-600">DEV · Herramientas de testing — COMPRAS</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={resetDatos}
            className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-700 hover:bg-amber-100 transition"
          >
            RESET INGRESOS
          </button>
          <button
            onClick={resetTotal}
            className="rounded-xl border border-red-300 bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-red-600 hover:bg-red-50 transition"
          >
            RESET TOTAL
          </button>
        </div>
        <p className="text-[9px] text-amber-500 leading-snug">
          RESET INGRESOS elimina el historial · RESET TOTAL elimina historial + runtimeId.
        </p>
      </div>
    </div>
  );
}
