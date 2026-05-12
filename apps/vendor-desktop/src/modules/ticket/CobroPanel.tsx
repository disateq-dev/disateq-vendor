import { useState, useEffect, useRef } from "react";
import {
  X, Banknote, Smartphone, CreditCard,
  User, Printer, Send, Check,
} from "lucide-react";
import { useTicketLines } from "../../domains/ticket/selectors/ticket.selectors";
import { useTicketStore } from "../../domains/ticket/state/ticket.store";
import { usePOS } from "../../context/POSContext";

type DocType = "ticket" | "boleta" | "factura" | "cotizacion";
type PayMethod = "efectivo" | "yape" | "tarjeta";

const DOC_CONFIG: Record<DocType, { label: string; series: string; correlative: number }> = {
  ticket:     { label: "Ticket",     series: "T001", correlative: 1253 },
  boleta:     { label: "Boleta",     series: "B001", correlative:  871 },
  factura:    { label: "Factura",    series: "F001", correlative:  450 },
  cotizacion: { label: "Cotización", series: "C001", correlative:   22 },
};

const QUICK_AMOUNTS = [20, 50, 100, 200];

export function CobroPanel() {
  const lines = useTicketLines();
  const clearTicket = useTicketStore(s => s.clearTicket);
  const { cobroOpen, closeCobro, cashSession, showNotice } = usePOS();

  const [docType, setDocType] = useState<DocType>("ticket");
  const [payMethod, setPayMethod] = useState<PayMethod>("efectivo");
  const [received, setReceived] = useState("");
  const [customerDni, setCustomerDni] = useState("");
  const [customerRuc, setCustomerRuc] = useState("");
  const [customerRazon, setCustomerRazon] = useState("");
  const [customerDir, setCustomerDir] = useState("");
  const [observacion, setObservacion] = useState("");

  const receivedInputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<() => void>(() => {});

  const total = lines.reduce((acc, l) => acc + l.subtotal, 0);
  const receivedNum = parseFloat(received) || 0;
  const change = receivedNum - total;
  const needsReceived = payMethod === "efectivo";

  const canConfirm =
    cashSession.isOpen &&
    total > 0 &&
    (!needsReceived || receivedNum >= total) &&
    (docType !== "factura" || (customerRuc.length >= 11 && customerRazon.trim().length > 0));

  function confirmEmit() {
    if (!cashSession.isOpen) {
      showNotice("Apertura de caja requerida para emitir");
      return;
    }
    if (!canConfirm) return;
    clearTicket();
    closeCobro();
  }
  confirmRef.current = confirmEmit;

  // Reset on open
  useEffect(() => {
    if (!cobroOpen) return;
    setDocType("ticket");
    setPayMethod("efectivo");
    setReceived("");
    setCustomerDni("");
    setCustomerRuc("");
    setCustomerRazon("");
    setCustomerDir("");
    setObservacion("");
    const t = setTimeout(() => receivedInputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [cobroOpen]);

  // Keyboard: Esc cancel · Enter confirm (when not focused on text input)
  useEffect(() => {
    if (!cobroOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeCobro(); return; }
      if (e.key === "Enter") {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          confirmRef.current();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cobroOpen, closeCobro]);

  if (!cobroOpen) return null;

  const cfg = DOC_CONFIG[docType];
  const docNumber = `${cfg.series}-${String(cfg.correlative + 1).padStart(8, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end">
      <div
        className="absolute inset-0 bg-[#0f172a]/30 backdrop-blur-[2px]"
        onClick={closeCobro}
      />

      <div className="relative z-10 mr-3 mb-3 flex w-[460px] max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[28px] border border-[#e4e9f0] bg-white shadow-2xl">

        {/* HEADER */}
        <div className="shrink-0 flex items-center justify-between border-b border-[#f1f5f9] px-5 py-3.5">
          <div>
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-[#9ca3af]">
              Cobrar venta
            </h2>
            <p className="font-mono text-[11px] font-semibold text-[#c0cad4]">{docNumber}</p>
          </div>
          <button
            onClick={closeCobro}
            className="rounded-lg p-1.5 text-[#c0cad4] transition hover:bg-[#f4f7fb] hover:text-[#374151]"
          >
            <X size={15} />
          </button>
        </div>

        {/* BODY — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* DOC TYPE */}
          <div>
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-widest text-[#b8c4cf]">
              Tipo de documento
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {(["ticket", "boleta", "factura", "cotizacion"] as DocType[]).map(dt => (
                <button
                  key={dt}
                  onClick={() => setDocType(dt)}
                  className={`rounded-xl py-2 text-[12px] font-semibold transition ${
                    docType === dt
                      ? "bg-[#2154d8] text-white shadow-[0_2px_8px_rgba(33,84,216,0.25)]"
                      : "border border-[#e4e9f0] text-[#374151] hover:border-[#c7d7f4] hover:bg-[#f0f5ff] hover:text-[#2154d8]"
                  }`}
                >
                  {DOC_CONFIG[dt].label}
                </button>
              ))}
            </div>
          </div>

          {/* CUSTOMER — contextual by doc type */}
          {(docType === "ticket" || docType === "cotizacion") && (
            <div className="flex items-center gap-2 rounded-xl border border-[#f1f5f9] px-3.5 py-2.5">
              <User size={13} strokeWidth={2} className="shrink-0 text-[#c0cad4]" />
              <span className="text-[12px] text-[#b8c4cf]">Clientes varios</span>
            </div>
          )}

          {docType === "boleta" && (
            <div>
              <label className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-widest text-[#b8c4cf]">
                Cliente · DNI opcional
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 focus-within:border-[#2154d8] focus-within:ring-2 focus-within:ring-[#2154d8]/10">
                <User size={13} strokeWidth={2} className="shrink-0 text-[#c0cad4]" />
                <input
                  type="text"
                  value={customerDni}
                  onChange={e => setCustomerDni(e.target.value)}
                  placeholder="DNI · vacío = clientes varios"
                  maxLength={8}
                  className="flex-1 bg-transparent text-[13px] text-[#374151] outline-none placeholder:text-[#d1d9e1]"
                />
              </div>
            </div>
          )}

          {docType === "factura" && (
            <div className="flex flex-col gap-2">
              <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[#b8c4cf]">
                Cliente · Factura
              </p>
              <input
                type="text"
                value={customerRuc}
                onChange={e => setCustomerRuc(e.target.value)}
                placeholder="RUC *"
                maxLength={11}
                className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[13px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
              />
              <input
                type="text"
                value={customerRazon}
                onChange={e => setCustomerRazon(e.target.value)}
                placeholder="Razón social *"
                className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[13px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
              />
              <input
                type="text"
                value={customerDir}
                onChange={e => setCustomerDir(e.target.value)}
                placeholder="Dirección fiscal"
                className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[13px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
              />
            </div>
          )}

          {/* TOTAL */}
          <div className="rounded-2xl bg-[#f4f7fb] px-4 py-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[#9ca3af]">
              Total a cobrar
            </p>
            <p className="mt-0.5 text-[30px] font-bold leading-none tracking-tight text-[#111827]">
              S/ {total.toFixed(2)}
            </p>
          </div>

          {/* PAYMENT METHODS */}
          <div>
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-widest text-[#b8c4cf]">
              Método de pago
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setPayMethod("efectivo")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold transition ${
                  payMethod === "efectivo"
                    ? "bg-[#2154d8] text-white shadow-[0_2px_8px_rgba(33,84,216,0.22)]"
                    : "border border-[#e4e9f0] text-[#374151] hover:border-[#c7d7f4] hover:bg-[#f0f5ff] hover:text-[#2154d8]"
                }`}
              >
                <Banknote size={13} strokeWidth={2} />
                Efectivo
              </button>
              <button
                onClick={() => setPayMethod("yape")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold transition ${
                  payMethod === "yape"
                    ? "bg-[#2154d8] text-white shadow-[0_2px_8px_rgba(33,84,216,0.22)]"
                    : "border border-[#e4e9f0] text-[#374151] hover:border-[#c7d7f4] hover:bg-[#f0f5ff] hover:text-[#2154d8]"
                }`}
              >
                <Smartphone size={13} strokeWidth={2} />
                Yape
              </button>
              <button
                onClick={() => setPayMethod("tarjeta")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold transition ${
                  payMethod === "tarjeta"
                    ? "bg-[#2154d8] text-white shadow-[0_2px_8px_rgba(33,84,216,0.22)]"
                    : "border border-[#e4e9f0] text-[#374151] hover:border-[#c7d7f4] hover:bg-[#f0f5ff] hover:text-[#2154d8]"
                }`}
              >
                <CreditCard size={13} strokeWidth={2} />
                Tarjeta
              </button>
            </div>
          </div>

          {/* CASH SECTION */}
          {payMethod === "efectivo" && (
            <div className="flex flex-col gap-2.5">
              {/* Quick amounts */}
              <div className="flex gap-1.5">
                {QUICK_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setReceived(String(amt))}
                    className="flex-1 rounded-xl border border-[#e4e9f0] py-1.5 text-[12px] font-bold text-[#374151] transition hover:border-[#c7d7f4] hover:bg-[#f0f5ff] hover:text-[#2154d8]"
                  >
                    {amt}
                  </button>
                ))}
              </div>

              {/* Received input */}
              <div>
                <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-widest text-[#b8c4cf]">
                  Monto recibido
                </label>
                <input
                  ref={receivedInputRef}
                  type="number"
                  value={received}
                  onChange={e => setReceived(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && canConfirm) { e.preventDefault(); confirmEmit(); }
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.10"
                  className="w-full rounded-2xl border border-[#e4e9f0] px-4 py-3 text-[22px] font-bold text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                />
              </div>

              {/* Change indicator */}
              {receivedNum > 0 && (
                <div className={`rounded-xl px-4 py-2.5 ${change >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-widest ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {change >= 0 ? "Vuelto" : "Faltan"}
                  </p>
                  <p className={`text-[20px] font-bold leading-none ${change >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    S/ {Math.abs(change).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* OBSERVACIÓN */}
          <div>
            <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-widest text-[#b8c4cf]">
              Observación
            </label>
            <input
              type="text"
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              placeholder="opcional..."
              className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[13px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
            />
          </div>
        </div>

        {/* FOOTER — emission actions */}
        <div className="shrink-0 border-t border-[#f1f5f9] px-5 py-4 flex flex-col gap-2">
          <button
            onClick={confirmEmit}
            disabled={!canConfirm}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2154d8] py-3.5 text-[14px] font-bold uppercase tracking-widest text-white shadow-[0_4px_14px_rgba(33,84,216,0.25)] transition hover:bg-[#1a43b0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
          >
            <Printer size={15} strokeWidth={2.5} />
            Emitir e imprimir
          </button>
          <div className="flex gap-2">
            <button
              onClick={confirmEmit}
              disabled={!canConfirm}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#e4e9f0] py-2.5 text-[12px] font-semibold text-[#374151] transition hover:border-[#c7d7f4] hover:bg-[#f0f5ff] hover:text-[#2154d8] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Send size={12} strokeWidth={2} />
              Emitir y enviar
            </button>
            <button
              onClick={confirmEmit}
              disabled={!canConfirm}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#e4e9f0] py-2.5 text-[12px] font-semibold text-[#374151] transition hover:border-[#c7d7f4] hover:bg-[#f0f5ff] hover:text-[#2154d8] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Check size={12} strokeWidth={2.5} />
              Solo emitir
            </button>
          </div>
          <p className="text-center text-[10px] text-[#c0cad4]">Esc · cancelar</p>
        </div>
      </div>
    </div>
  );
}
