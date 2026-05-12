import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useTicketLines } from "../../domains/ticket/selectors/ticket.selectors";
import { useTicketStore } from "../../domains/ticket/state/ticket.store";
import { usePOS } from "../../context/POSContext";

export function CobroPanel() {
  const lines = useTicketLines();
  const clearTicket = useTicketStore(s => s.clearTicket);
  const { cobroOpen, closeCobro } = usePOS();
  const [received, setReceived] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const total = lines.reduce((acc, l) => acc + l.subtotal, 0);
  const receivedNum = parseFloat(received) || 0;
  const change = receivedNum - total;
  const canConfirm = receivedNum >= total && total > 0;

  // Focus input when panel opens
  useEffect(() => {
    if (cobroOpen) {
      setReceived("");
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [cobroOpen]);

  // Keyboard: Enter confirm, Esc cancel
  useEffect(() => {
    if (!cobroOpen) return;

    const receivedRef = { current: receivedNum };
    const totalRef = { current: total };
    receivedRef.current = receivedNum;
    totalRef.current = total;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeCobro(); return; }
      if (e.key === "Enter" && receivedRef.current >= totalRef.current && totalRef.current > 0) {
        e.preventDefault();
        clearTicket();
        closeCobro();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cobroOpen, receivedNum, total, closeCobro, clearTicket]);

  if (!cobroOpen) return null;

  function confirmCobro() {
    if (!canConfirm) return;
    clearTicket();
    closeCobro();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0f172a]/30 backdrop-blur-[2px]"
        onClick={closeCobro}
      />

      {/* Panel — right-anchored, aligns with ticket column */}
      <div className="relative z-10 mr-3 mb-3 w-[420px] rounded-[28px] bg-white shadow-2xl border border-[#e4e9f0] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-3.5">
          <h2 className="text-[12px] font-bold uppercase tracking-widest text-[#9ca3af]">
            Cobrar venta
          </h2>
          <button
            onClick={closeCobro}
            className="rounded-lg p-1.5 text-[#c0cad4] transition hover:bg-[#f4f7fb] hover:text-[#374151]"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Total */}
          <div className="rounded-2xl bg-[#f4f7fb] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9ca3af]">
              Total a cobrar
            </p>
            <p className="mt-1 text-[28px] font-bold tracking-tight text-[#111827]">
              S/ {total.toFixed(2)}
            </p>
          </div>

          {/* Received */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-[#9ca3af]">
              Monto recibido
            </label>
            <input
              ref={inputRef}
              type="number"
              value={received}
              onChange={e => setReceived(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.10"
              className="w-full rounded-2xl border border-[#e4e9f0] bg-white px-4 py-3 text-[22px] font-bold text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
            />
          </div>

          {/* Change indicator */}
          {receivedNum > 0 && (
            <div className={`rounded-xl px-4 py-2.5 ${change >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-widest ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {change >= 0 ? "Vuelto" : "Faltan"}
              </p>
              <p className={`text-[18px] font-bold ${change >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                S/ {Math.abs(change).toFixed(2)}
              </p>
            </div>
          )}

          {/* Confirm */}
          <button
            onClick={confirmCobro}
            disabled={!canConfirm}
            className="w-full rounded-2xl bg-[#2154d8] py-3.5 text-[14px] font-bold uppercase tracking-widest text-white shadow-[0_4px_14px_rgba(33,84,216,0.22)] transition hover:bg-[#1a43b0] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
          >
            Confirmar cobro
          </button>

          <p className="text-center text-[10px] text-[#c0cad4]">
            Enter · confirmar &nbsp;·&nbsp; Esc · cancelar
          </p>
        </div>
      </div>
    </div>
  );
}
