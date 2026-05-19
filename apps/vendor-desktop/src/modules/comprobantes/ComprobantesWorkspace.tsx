import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, AlertTriangle } from "lucide-react";
import { usePOS } from "../../context/POSContext";
import type { Comprobante } from "../../domains/comprobantes/types/comprobante.types";

const DOC_LABELS: Record<string, string> = {
  nota: "NOTA", boleta: "BOL", factura: "FAC", cotizacion: "COT",
};

const METHOD_LABELS: Record<string, string> = {
  efectivo: "EFE", yape: "YAP", tarjeta: "TAR", mixto: "MIX",
};

const METHOD_COLORS: Record<string, string> = {
  efectivo: "bg-emerald-50 text-emerald-700",
  yape:     "bg-violet-50 text-violet-700",
  tarjeta:  "bg-blue-50 text-blue-700",
  mixto:    "bg-amber-50 text-amber-700",
};

function formatDateTime(dt: string): string {
  // dt may be "DD/MM/YYYY HH:MM" or ISO
  return dt.length > 16 ? dt.slice(0, 16) : dt;
}

function pad8(n: number) { return String(n).padStart(8, "0"); }

export function ComprobantesWorkspace() {
  const { comprobantes, voidComprobante, cashSession } = usePOS();

  const [search,      setSearch]      = useState("");
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [voidMode,    setVoidMode]    = useState(false);
  const [voidMotivo,  setVoidMotivo]  = useState("");
  const searchRef   = useRef<HTMLInputElement>(null);
  const motivoRef   = useRef<HTMLInputElement>(null);

  // Session key for current session
  const sessionKey = cashSession.isOpen && cashSession.cashBox
    ? `${cashSession.cashBox.code}-${cashSession.openedAt?.toISOString() ?? ""}`
    : null;

  // Filter: current session only (show all if no session open)
  const sessionDocs = sessionKey
    ? comprobantes.filter(c => c.sessionKey === sessionKey)
    : comprobantes;

  // Apply search filter
  const query = search.trim().toLowerCase();
  const filtered: Comprobante[] = query
    ? sessionDocs.filter(c =>
        `${c.docSeries}-${pad8(c.docCorrelative)}`.toLowerCase().includes(query) ||
        c.netTotal.toFixed(2).includes(query) ||
        c.payMethod.toLowerCase().includes(query) ||
        (c.customer?.name ?? "").toLowerCase().includes(query)
      )
    : sessionDocs;

  // Show newest first
  const docs = [...filtered].reverse();

  const selected = docs.find(c => c.id === selectedId) ?? null;

  const handleSelect = useCallback((id: string) => {
    if (selectedId === id) { setSelectedId(null); setVoidMode(false); return; }
    setSelectedId(id);
    setVoidMode(false);
    setVoidMotivo("");
  }, [selectedId]);

  const handleVoidStart = useCallback(() => {
    setVoidMode(true);
    setVoidMotivo("");
    setTimeout(() => motivoRef.current?.focus(), 30);
  }, []);

  const handleVoidConfirm = useCallback(() => {
    if (!selectedId || !voidMotivo.trim()) return;
    voidComprobante(selectedId, voidMotivo.trim());
    setSelectedId(null);
    setVoidMode(false);
    setVoidMotivo("");
  }, [selectedId, voidMotivo, voidComprobante]);

  const handleVoidCancel = useCallback(() => {
    setVoidMode(false);
    setVoidMotivo("");
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const inInput = tag === "INPUT";

      if (e.key === "Escape") {
        if (voidMode) { e.preventDefault(); handleVoidCancel(); return; }
        if (selectedId) { e.preventDefault(); setSelectedId(null); return; }
      }

      if (!inInput && e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (inInput && e.key === "Enter" && voidMode) {
        e.preventDefault();
        handleVoidConfirm();
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [voidMode, selectedId, handleVoidCancel, handleVoidConfirm]);

  return (
    <section className="flex h-full w-full gap-3">

      {/* LEFT — LISTA */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-[28px] border border-[#73C7D4]/50 bg-[#FDFCF9]">

        {/* SheetHeader */}
        <header className="shrink-0 flex items-center gap-2 border-b border-[#73C7D4]/15 bg-[#F1F8F9] px-4 py-2.5">
          <span className="text-[14px] font-semibold uppercase tracking-tight text-[#121416] leading-none">COMPROBANTES</span>
          {cashSession.isOpen && (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest text-emerald-700">
              SESIÓN ACTIVA
            </span>
          )}
          <span className="ml-auto text-[11px] text-[#9ca3af]">
            {docs.length} docs
          </span>
        </header>

        {/* SEARCH */}
        <div className="shrink-0 px-3 pt-2.5 pb-1.5">
          <div className="flex items-center gap-2 rounded-xl border border-[#e4e9f0] bg-white px-3 py-1.5">
            <Search size={12} className="shrink-0 text-[#9ca3af]" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar número, monto, cliente... [F2]"
              className="flex-1 bg-transparent text-[12px] text-[#374151] outline-none placeholder:text-[#c0cad4]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="shrink-0 text-[#9ca3af] hover:text-[#374151]">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* ROWS */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-16 text-center">
              <p className="text-[13px] font-semibold text-[#c0cad4]">
                {cashSession.isOpen ? "Sin ventas en esta sesión" : "Sin sesión activa"}
              </p>
              <p className="text-[11px] text-[#d1d9e1]">
                {cashSession.isOpen ? "Las ventas confirmadas aparecerán aquí" : "Abra una caja para ver comprobantes"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 pt-1">
              {docs.map(c => {
                const isSelected = c.id === selectedId;
                const isCancelled = c.status === "cancelled";
                return (
                  <article
                    key={c.id}
                    onClick={() => !isCancelled && handleSelect(c.id)}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 transition-colors ${
                      isCancelled
                        ? "cursor-default opacity-50"
                        : isSelected
                        ? "bg-[#EDF4FF] ring-1 ring-[#2154d8]/20"
                        : "hover:bg-white"
                    }`}
                  >
                    {/* Doc type badge */}
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest ${
                      isCancelled ? "bg-red-50 text-red-400" : "bg-[#f1f5f9] text-[#374151]"
                    }`}>
                      {isCancelled ? "ANUL" : (DOC_LABELS[c.docType] ?? c.docType.toUpperCase())}
                    </span>

                    {/* Correlative */}
                    <span className="shrink-0 tabular-nums text-[11px] text-[#374151]">
                      {c.docSeries}-{pad8(c.docCorrelative)}
                    </span>

                    {/* Customer or datetime */}
                    <span className="min-w-0 flex-1 truncate text-[11px] text-[#9ca3af]">
                      {c.customer?.name || formatDateTime(c.dateTime)}
                    </span>

                    {/* Method */}
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${METHOD_COLORS[c.payMethod] ?? "bg-[#f1f5f9] text-[#374151]"}`}>
                      {METHOD_LABELS[c.payMethod] ?? c.payMethod.toUpperCase()}
                    </span>

                    {/* Total */}
                    <span className={`shrink-0 w-16 text-right text-[12px] font-bold tabular-nums ${
                      isCancelled ? "text-red-400 line-through" : isSelected ? "text-[#2154d8]" : "text-[#2F3E46]"
                    }`}>
                      S/ {c.netTotal.toFixed(2)}
                    </span>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — DETALLE / ACCIONES */}
      <div className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#73C7D4]/50 bg-[#FDFCF9]">

        <header className="shrink-0 flex items-center border-b border-[#73C7D4]/15 bg-[#F1F8F9] px-4 py-2.5">
          <span className="text-[14px] font-semibold uppercase tracking-tight text-[#121416] leading-none">DETALLE</span>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!selected ? (
            <p className="text-[12px] text-[#c0cad4]">Seleccione un comprobante activo</p>
          ) : (
            <div className="flex flex-col gap-3">

              {/* Correlativo + tipo */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Comprobante</p>
                <p className="text-[14px] font-bold text-[#2F3E46]">
                  {selected.docSeries}-{pad8(selected.docCorrelative)}
                </p>
                <p className="text-[11px] text-[#9ca3af]">{selected.docType.toUpperCase()} · {formatDateTime(selected.dateTime)}</p>
              </div>

              {/* Operador */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Operador</p>
                <p className="text-[12px] text-[#374151]">{selected.operator || "—"}</p>
              </div>

              {/* Cliente */}
              {selected.customer && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Cliente</p>
                  <p className="text-[12px] text-[#374151]">{selected.customer.name}</p>
                  {selected.customer.docNumber && (
                    <p className="text-[11px] text-[#9ca3af]">{selected.customer.docNumber}</p>
                  )}
                </div>
              )}

              {/* Líneas */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] mb-1">Ítems</p>
                <div className="flex flex-col gap-0.5">
                  {selected.lines.map((l, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-[11px] text-[#374151]">
                        {l.quantity}× {l.description}
                        {l.note && <span className="text-[#9ca3af]"> ↳{l.note}</span>}
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#374151]">
                        S/ {l.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="rounded-xl bg-[#f4f7fb] px-3 py-2.5 flex flex-col gap-1">
                {selected.discountAmount > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#9ca3af]">Dcto.</span>
                    <span className="text-red-500 font-semibold">−S/ {selected.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[12px] font-bold text-[#374151]">TOTAL</span>
                  <span className="text-[14px] font-extrabold tabular-nums text-[#111827]">S/ {selected.netTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#9ca3af]">Método</span>
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${METHOD_COLORS[selected.payMethod] ?? ""}`}>
                    {METHOD_LABELS[selected.payMethod] ?? selected.payMethod.toUpperCase()}
                  </span>
                </div>
                {selected.payMethod === "mixto" && (
                  <div className="flex flex-col gap-0.5 pt-0.5 border-t border-[#e4e9f0] mt-0.5">
                    {selected.cashComponent > 0 && <div className="flex justify-between text-[10px] text-[#9ca3af]"><span>EFE</span><span>S/ {selected.cashComponent.toFixed(2)}</span></div>}
                    {selected.yapeComponent > 0 && <div className="flex justify-between text-[10px] text-[#9ca3af]"><span>YAP</span><span>S/ {selected.yapeComponent.toFixed(2)}</span></div>}
                    {selected.tarjetaComponent > 0 && <div className="flex justify-between text-[10px] text-[#9ca3af]"><span>TAR</span><span>S/ {selected.tarjetaComponent.toFixed(2)}</span></div>}
                  </div>
                )}
              </div>

              {/* Anulación info si ya está anulado */}
              {selected.status === "cancelled" && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">ANULADO</p>
                  <p className="text-[11px] text-red-500 mt-0.5">{selected.cancelledMotivo}</p>
                  <p className="text-[10px] text-red-400 mt-0.5">{selected.cancelledBy} · {selected.cancelledAt ? new Date(selected.cancelledAt).toLocaleString("es-PE") : ""}</p>
                </div>
              )}

              {/* Acciones */}
              {selected.status === "active" && !voidMode && (
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleVoidStart}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.97]"
                  >
                    <AlertTriangle size={13} />
                    ANULAR
                  </button>
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#e4e9f0] bg-[#f4f7fb] px-3 py-2 text-[12px] font-bold text-[#c0cad4] cursor-not-allowed"
                  >
                    REIMPRIMIR (próx.)
                  </button>
                </div>
              )}

              {/* Void form */}
              {selected.status === "active" && voidMode && (
                <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50/60 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={12} className="shrink-0 text-red-500" />
                    <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Confirmar anulación</span>
                  </div>
                  <input
                    ref={motivoRef}
                    type="text"
                    value={voidMotivo}
                    onChange={e => setVoidMotivo(e.target.value)}
                    placeholder="Motivo requerido..."
                    className="w-full rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[12px] text-[#374151] outline-none placeholder:text-[#c0cad4] focus:border-red-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleVoidCancel}
                      className="flex-1 rounded-lg border border-[#e4e9f0] bg-white py-1.5 text-[11px] font-bold text-[#374151] transition hover:bg-[#f4f7fb]"
                    >
                      Cancelar [Esc]
                    </button>
                    <button
                      onClick={handleVoidConfirm}
                      disabled={!voidMotivo.trim()}
                      className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold text-white transition ${
                        voidMotivo.trim()
                          ? "bg-red-600 hover:bg-red-700 active:scale-[0.97]"
                          : "cursor-not-allowed bg-red-300"
                      }`}
                    >
                      Anular [Enter]
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

    </section>
  );
}
