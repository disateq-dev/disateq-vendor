import { useState } from "react";
import { ShoppingBag, Plus, Trash2, CheckCircle, Clock } from "lucide-react";
import { type PurchasesSubView } from "../../App";
import { usePurchasesStore } from "../../domains/purchases/store";
import { purchasesService } from "../../domains/purchases/service";
import { useInventoryStore } from "../../domains/inventory/store";
import type { CompraOperacional, EstadoCompra, LineaCompra } from "../../domains/purchases/types";

interface Props {
  subView: PurchasesSubView;
}

const ACCENT = "#3B7A55";

export function PurchasesWorkspace({ subView }: Props) {
  const { runtimeId } = usePurchasesStore();

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#3B7A55]/30 bg-[#F8FBF9]">

      {/* SheetHeader — h-[42px] fijo, una línea */}
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#3B7A55]/15 bg-[#F2F8F4] px-4">
        <ShoppingBag size={13} strokeWidth={2} className="text-[#3B7A55]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">COMPRAS</span>
        <span className="ml-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#3B7A55]/10 text-[#3B7A55]">CAPA 0</span>
        <span className="ml-auto font-mono text-[9px] text-[#9cafa0]">{runtimeId.slice(0, 8)}…</span>
      </div>

      {/* SheetBody */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3">
        {subView === "nueva"    && <ViewNuevaCompra />}
        {subView === "historial" && <ViewHistorial />}
      </div>

    </section>
  );
}

// ── NUEVA COMPRA ─────────────────────────────────────────────────────────────

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

  const [causa,      setCausa]      = useState("abastecimiento");
  const [proveedor,  setProveedor]  = useState("");
  const [referencia, setReferencia] = useState("");
  const [observacion, setObservacion] = useState("");
  const [lineas,     setLineas]     = useState<LineaDraft[]>([]);
  const [recibirYa,  setRecibirYa]  = useState(false);
  const [feedback,   setFeedback]   = useState<string | null>(null);

  function addLinea() {
    if (items.length === 0) return;
    const first = items[0];
    setLineas(prev => [...prev, {
      itemId:       first.itemId,
      nombreItem:   first.nombre,
      unidadBase:   first.unidadBase,
      cantidad:     1,
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
      // Si cambia itemId, sync nombre+unidad
      if (patch.itemId) {
        const it = items.find(x => x.itemId === patch.itemId);
        if (it) {
          next.nombreItem = it.nombre;
          next.unidadBase = it.unidadBase;
        }
      }
      return next;
    }));
  }

  function handleRegistrar() {
    if (!causa.trim()) return;
    if (lineas.length === 0) { setFeedback("Añade al menos una línea."); return; }
    const lineasFinal: LineaCompra[] = lineas.map((l, idx) => ({
      lineaId:      `l${idx}`,
      itemId:       l.itemId,
      nombreItem:   l.nombreItem,
      unidadBase:   l.unidadBase,
      cantidad:     l.cantidad,
      costoUnitario: l.costoUnitario ? parseFloat(l.costoUnitario) : undefined,
    }));
    const purchaseId = purchasesService.registrarCompra({
      causa:     causa.trim(),
      proveedor: proveedor.trim() || undefined,
      referencia: referencia.trim() || undefined,
      observacion: observacion.trim() || undefined,
      lineas: lineasFinal,
    });
    if (recibirYa) {
      purchasesService.recibirLineas(purchaseId, lineasFinal);
      setFeedback("Compra registrada y entradas aplicadas a inventario.");
    } else {
      setFeedback("Compra registrada (estado: registrada).");
    }
    setCausa("abastecimiento");
    setProveedor("");
    setReferencia("");
    setObservacion("");
    setLineas([]);
    setRecibirYa(false);
    setTimeout(() => setFeedback(null), 3500);
  }

  const inputCls = "w-full rounded-lg border border-[#d1d5db] bg-white px-3 py-1.5 text-[12px] text-[#121416] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#3B7A55]/40";
  const labelCls = "block mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280]";

  return (
    <div className="max-w-2xl space-y-4">

      {/* Causa + Proveedor */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Causa *</label>
          <input
            className={inputCls}
            value={causa}
            onChange={e => setCausa(e.target.value)}
            placeholder="abastecimiento, urgente…"
          />
        </div>
        <div>
          <label className={labelCls}>Proveedor</label>
          <input
            className={inputCls}
            value={proveedor}
            onChange={e => setProveedor(e.target.value)}
            placeholder="nombre libre"
          />
        </div>
      </div>

      {/* Referencia + Observación */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Referencia</label>
          <input
            className={inputCls}
            value={referencia}
            onChange={e => setReferencia(e.target.value)}
            placeholder="boleta, factura, nota…"
          />
        </div>
        <div>
          <label className={labelCls}>Observación</label>
          <input
            className={inputCls}
            value={observacion}
            onChange={e => setObservacion(e.target.value)}
            placeholder="contexto adicional"
          />
        </div>
      </div>

      {/* Líneas */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className={labelCls}>Líneas</span>
          <button
            onClick={addLinea}
            disabled={items.length === 0}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-[#3B7A55]/10 text-[#3B7A55] hover:bg-[#3B7A55]/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Plus size={11} strokeWidth={2.5} />
            Añadir ítem
          </button>
        </div>

        {items.length === 0 && (
          <p className="text-[11px] text-[#9ca3af]">Sin ítems en inventario. Registra ítems primero.</p>
        )}

        {lineas.length === 0 && items.length > 0 && (
          <p className="text-[11px] text-[#9ca3af]">Añade al menos una línea para registrar la compra.</p>
        )}

        <div className="space-y-2">
          {lineas.map((l, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2">
              {/* Selector ítem */}
              <select
                value={l.itemId}
                onChange={e => updateLinea(idx, { itemId: e.target.value })}
                className="flex-1 rounded border border-[#d1d5db] bg-white px-2 py-1 text-[12px] text-[#121416] focus:outline-none focus:ring-1 focus:ring-[#3B7A55]/40"
              >
                {items.map(it => (
                  <option key={it.itemId} value={it.itemId}>{it.nombre}</option>
                ))}
              </select>
              {/* Unidad */}
              <span className="shrink-0 text-[11px] text-[#9ca3af] w-14 text-center">{l.unidadBase}</span>
              {/* Cantidad */}
              <input
                type="number"
                min={0.001}
                step={1}
                value={l.cantidad}
                onChange={e => updateLinea(idx, { cantidad: Math.max(0.001, parseFloat(e.target.value) || 0) })}
                className="w-20 rounded border border-[#d1d5db] bg-white px-2 py-1 text-[12px] text-right text-[#121416] focus:outline-none focus:ring-1 focus:ring-[#3B7A55]/40"
              />
              {/* Costo unitario opcional */}
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="Costo"
                value={l.costoUnitario}
                onChange={e => updateLinea(idx, { costoUnitario: e.target.value })}
                className="w-24 rounded border border-[#d1d5db] bg-white px-2 py-1 text-[12px] text-right text-[#121416] placeholder:text-[#d1d5db] focus:outline-none focus:ring-1 focus:ring-[#3B7A55]/40"
              />
              {/* Eliminar */}
              <button onClick={() => removeLinea(idx)} className="text-[#dc2626]/60 hover:text-[#dc2626] transition">
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recibir ya */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={recibirYa}
          onChange={e => setRecibirYa(e.target.checked)}
          className="accent-[#3B7A55]"
        />
        <span className="text-[12px] font-semibold text-[#374151]">Aplicar entradas a inventario al registrar</span>
      </label>

      {/* Feedback */}
      {feedback && (
        <div className="rounded-lg bg-[#3B7A55]/10 px-3 py-2 text-[11px] font-semibold text-[#3B7A55]">
          {feedback}
        </div>
      )}

      {/* Registrar */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleRegistrar}
          disabled={!causa.trim() || lineas.length === 0}
          className="flex items-center gap-1.5 rounded-xl bg-[#3B7A55] px-5 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-[#2d5e40] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <CheckCircle size={14} strokeWidth={2.5} />
          {recibirYa ? "Registrar y recibir" : "Registrar compra"}
        </button>
      </div>
    </div>
  );
}

// ── HISTORIAL ────────────────────────────────────────────────────────────────

const ESTADO_CFG: Record<EstadoCompra, { label: string; cls: string }> = {
  registrada:       { label: "REGISTRADA",     cls: "bg-[#e5e7eb] text-[#6b7280]"       },
  recibida_parcial: { label: "PARC. RECIBIDA", cls: "bg-amber-50 text-amber-600"         },
  recibida:         { label: "RECIBIDA",       cls: "bg-[#3B7A55]/10 text-[#3B7A55]"    },
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
        <p className="text-[12px] text-[#9ca3af]">Sin compras registradas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map(c => <CompraRow key={c.purchaseId} compra={c} />)}
    </div>
  );
}

function CompraRow({ compra }: { compra: CompraOperacional }) {
  const [open, setOpen] = useState(false);
  const cfg = ESTADO_CFG[compra.estado];

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
        {compra.referencia && (
          <span className="shrink-0 text-[10px] text-[#9ca3af]">{compra.referencia}</span>
        )}
        <span className="shrink-0 text-[10px] text-[#9ca3af]">{formatTs(compra.timestamp)}</span>
        <span className={`shrink-0 text-[11px] text-[#9ca3af] transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="border-t border-[#f3f4f6] px-4 py-3">
          {/* Líneas */}
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                <th className="pb-1 pr-3">Ítem</th>
                <th className="pb-1 pr-3 text-right">Cant.</th>
                <th className="pb-1 pr-3">Unidad</th>
                <th className="pb-1 text-right">Costo u.</th>
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

          {/* Observación */}
          {compra.observacion && (
            <p className="mt-2 text-[11px] text-[#6b7280]">Obs.: {compra.observacion}</p>
          )}

          {/* Acciones estado */}
          {compra.estado === "registrada" && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  purchasesService.recibirLineas(compra.purchaseId, compra.lineas);
                }}
                className="rounded-lg bg-[#3B7A55] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#2d5e40] transition"
              >
                Recibir y aplicar a inventario
              </button>
            </div>
          )}

          <p className="mt-2 font-mono text-[9px] text-[#d1d5db]">{compra.purchaseId}</p>
        </div>
      )}
    </div>
  );
}
