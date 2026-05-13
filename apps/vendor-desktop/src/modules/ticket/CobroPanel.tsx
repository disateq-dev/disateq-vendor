import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Banknote, Smartphone, CreditCard,
  User, Printer, Send, Check, Plus, X,
} from "lucide-react";
import { useTicketLines } from "../../domains/ticket/selectors/ticket.selectors";
import { useTicketStore } from "../../domains/ticket/state/ticket.store";
import { usePOS } from "../../context/POSContext";

type DocType = "nota" | "boleta" | "factura" | "cotizacion";
type PayMethod = "efectivo" | "yape" | "tarjeta";

const DOC_CONFIG: Record<DocType, { label: string; series: string; correlative: number }> = {
  nota:       { label: "Nota",      series: "T001", correlative: 1253 },
  boleta:     { label: "Boleta",    series: "B001", correlative:  871 },
  factura:    { label: "Factura",   series: "F001", correlative:  450 },
  cotizacion: { label: "Cotización",series: "C001", correlative:   22 },
};

const QUICK_AMOUNTS = [20, 50, 100, 200];

export function CobroPanel() {
  const lines = useTicketLines();
  const clearTicket = useTicketStore(s => s.clearTicket);
  const { cobroOpen, closeCobro, cashSession, showNotice } = usePOS();

  const [docType, setDocType]           = useState<DocType>("nota");
  const [payMethod, setPayMethod]       = useState<PayMethod>("efectivo");
  const [received, setReceived]         = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customerDni, setCustomerDni]   = useState("");
  const [customerRuc, setCustomerRuc]   = useState("");
  const [customerRazon, setCustomerRazon] = useState("");
  const [customerDir, setCustomerDir]   = useState("");
  const [observacion, setObservacion]   = useState("");

  const receivedInputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<() => void>(() => {});

  const total = lines.reduce((acc, l) => acc + l.subtotal, 0);
  const receivedNum = parseFloat(received) || 0;
  const change = receivedNum - total;
  const needsReceived = payMethod === "efectivo";

  const baseImponible = total / 1.18;
  const igv = total - baseImponible;

  const canConfirm =
    cashSession.isOpen &&
    total > 0 &&
    (!needsReceived || receivedNum >= total) &&
    (docType !== "factura" || (customerRuc.length >= 11 && customerRazon.trim().length > 0));

  // Auto-open advanced panel for factura
  useEffect(() => {
    if (docType === "factura") setShowAdvanced(true);
  }, [docType]);

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
    setDocType("nota");
    setPayMethod("efectivo");
    setReceived("");
    setShowAdvanced(false);
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

  const cfg = DOC_CONFIG[docType];
  const docNumber = `${cfg.series}-${String(cfg.correlative + 1).padStart(8, "0")}`;
  const showTax = docType === "boleta" || docType === "factura";

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e4e9f0] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

      {/* HEADER — 2 rows */}
      <div className="shrink-0 border-b border-[#f1f5f9]">

        {/* Row 1: ← Regresar | TOTAL protagonist | [+] */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={closeCobro}
            className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[#9ca3af] transition hover:text-[#374151]"
          >
            <ArrowLeft size={12} />
            Regresar
          </button>

          <div className="flex min-w-0 flex-1 flex-col items-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#c8d4e0]">Total a cobrar</p>
            <p className="text-[24px] font-bold leading-none tracking-tight text-[#111827]">
              S/ {total.toFixed(2)}
            </p>
            <p className="font-mono text-[9px] text-[#d1d9e1]">{docNumber}</p>
          </div>

          <button
            onClick={() => setShowAdvanced(v => !v)}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
              showAdvanced
                ? "border-[#2154d8] bg-[#2154d8] text-white"
                : "border-[#e4e9f0] bg-white text-[#9ca3af] hover:border-[#c7d7f4] hover:text-[#2154d8]"
            }`}
          >
            {showAdvanced ? <X size={11} strokeWidth={2.5} /> : <Plus size={11} strokeWidth={2.5} />}
          </button>
        </div>

        {/* Row 2: segmented doc type */}
        <div className="flex gap-0 border-t border-[#f8fafd] px-3 pb-2.5">
          {(["nota", "boleta", "factura", "cotizacion"] as DocType[]).map(dt => (
            <button
              key={dt}
              onClick={() => setDocType(dt)}
              className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold transition ${
                docType === dt
                  ? "bg-[#2154d8] text-white shadow-[0_1px_4px_rgba(33,84,216,0.2)]"
                  : "text-[#9ca3af] hover:text-[#374151]"
              }`}
            >
              {DOC_CONFIG[dt].label}
            </button>
          ))}
        </div>
      </div>

      {/* ADVANCED PANEL — collapsible customer data */}
      {showAdvanced && (
        <div className="shrink-0 border-b border-[#f1f5f9] px-4 py-3 flex flex-col gap-2 bg-[#fafbfd]">
          {(docType === "nota" || docType === "cotizacion") && (
            <div className="flex items-center gap-2 rounded-xl border border-[#f1f5f9] px-3.5 py-2">
              <User size={12} strokeWidth={2} className="shrink-0 text-[#c0cad4]" />
              <span className="text-[11.5px] text-[#b8c4cf]">Clientes varios</span>
            </div>
          )}
          {docType === "boleta" && (
            <div className="flex items-center gap-2 rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 focus-within:border-[#2154d8] focus-within:ring-2 focus-within:ring-[#2154d8]/10">
              <User size={12} strokeWidth={2} className="shrink-0 text-[#c0cad4]" />
              <input
                type="text"
                value={customerDni}
                onChange={e => setCustomerDni(e.target.value)}
                placeholder="DNI · opcional"
                maxLength={8}
                className="flex-1 bg-transparent text-[13px] text-[#374151] outline-none placeholder:text-[#d1d9e1]"
              />
            </div>
          )}
          {docType === "factura" && (
            <>
              <input
                type="text"
                value={customerRuc}
                onChange={e => setCustomerRuc(e.target.value)}
                placeholder="RUC *"
                maxLength={11}
                className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2 text-[13px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
              />
              <input
                type="text"
                value={customerRazon}
                onChange={e => setCustomerRazon(e.target.value)}
                placeholder="Razón social *"
                className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2 text-[13px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
              />
              <input
                type="text"
                value={customerDir}
                onChange={e => setCustomerDir(e.target.value)}
                placeholder="Dirección fiscal"
                className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2 text-[13px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
              />
            </>
          )}
          <input
            type="text"
            value={observacion}
            onChange={e => setObservacion(e.target.value)}
            placeholder="Observación..."
            className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
          />
        </div>
      )}

      {/* BODY — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5 flex flex-col gap-3">

        {/* PAYMENT METHODS */}
        <div className="grid grid-cols-3 gap-1.5">
          {([
            { id: "efectivo", label: "Efectivo", Icon: Banknote },
            { id: "yape",     label: "Yape",     Icon: Smartphone },
            { id: "tarjeta",  label: "Tarjeta",  Icon: CreditCard },
          ] as { id: PayMethod; label: string; Icon: React.ElementType }[]).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setPayMethod(id)}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold transition ${
                payMethod === id
                  ? "bg-[#2154d8] text-white shadow-[0_2px_8px_rgba(33,84,216,0.22)]"
                  : "border border-[#e4e9f0] text-[#374151] hover:border-[#c7d7f4] hover:bg-[#f0f5ff] hover:text-[#2154d8]"
              }`}
            >
              <Icon size={13} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        {/* CASH SECTION */}
        {payMethod === "efectivo" && (
          <div className="flex flex-col gap-2.5">
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

        {/* TAX SUMMARY — boleta / factura */}
        {showTax && (
          <div className="rounded-xl border border-[#f1f5f9] px-3.5 py-2.5 flex flex-col gap-1">
            <div className="flex justify-between text-[11px] text-[#9ca3af]">
              <span>Op. Gravada</span>
              <span className="font-semibold tabular-nums text-[#374151]">S/ {baseImponible.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#9ca3af]">
              <span>IGV 18%</span>
              <span className="font-semibold tabular-nums text-[#374151]">S/ {igv.toFixed(2)}</span>
            </div>
            <div className="mt-0.5 flex justify-between border-t border-[#f1f5f9] pt-1.5 text-[12px] font-bold text-[#111827]">
              <span>Total</span>
              <span className="tabular-nums">S/ {total.toFixed(2)}</span>
            </div>
          </div>
        )}
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
    </section>
  );
}
