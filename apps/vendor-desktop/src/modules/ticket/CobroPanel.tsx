import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Banknote, Smartphone, CreditCard,
  Printer, Send, Save, User, AlertCircle,
} from "lucide-react";
import { useTicketLines } from "../../domains/ticket/selectors/ticket.selectors";
import { useTicketStore } from "../../domains/ticket/state/ticket.store";
import { usePOS } from "../../context/POSContext";

type DocType = "nota" | "boleta" | "factura" | "cotizacion";
type PayMethod = "efectivo" | "yape" | "tarjeta";
type CobroView = "main" | "client";
type CotizaDocMode = "dni" | "ruc";

// Future-ready: extend with id, address, source when SQLite/API is integrated
type CustomerData = {
  docNumber: string; // DNI (8) or RUC (11); "" when not used
  name: string;
};

const DOC_SERIES: Record<DocType, { series: string; correlative: number }> = {
  nota:       { series: "T001", correlative: 1253 },
  boleta:     { series: "B001", correlative:  871 },
  factura:    { series: "F001", correlative:  450 },
  cotizacion: { series: "C001", correlative:   22 },
};

const DOC_SHORT: Record<DocType, string> = {
  nota: "Nota", boleta: "Boleta", factura: "Factura", cotizacion: "Cotiza",
};

const QUICK_AMOUNTS = [20, 50, 100, 200];
const BOLETA_REQUIRE_THRESHOLD = 700;

export function CobroPanel() {
  const lines       = useTicketLines();
  const clearTicket = useTicketStore(s => s.clearTicket);
  const { cobroOpen, closeCobro, cashSession, showNotice } = usePOS();

  const [docType,       setDocType]       = useState<DocType>("nota");
  const [payMethod,     setPayMethod]     = useState<PayMethod>("efectivo");
  const [received,      setReceived]      = useState("");
  const [cobroView,     setCobroView]     = useState<CobroView>("main");
  const [cotizaDocMode, setCotizaDocMode] = useState<CotizaDocMode>("dni");

  // Committed customer (set via ESTABLECER)
  const [customer, setCustomer] = useState<CustomerData | null>(null);

  // Client form temporary inputs
  const [clientDoc,  setClientDoc]  = useState("");
  const [clientName, setClientName] = useState("");

  const receivedRef = useRef<HTMLInputElement>(null);
  const confirmRef  = useRef<() => void>(() => {});

  const total         = lines.reduce((acc, l) => acc + l.subtotal, 0);
  const receivedNum   = parseFloat(received) || 0;
  const change        = receivedNum - total;
  const needsReceived = payMethod === "efectivo";
  const baseImponible = total / 1.18;
  const igv           = total - baseImponible;

  // Derived client requirements per docType
  const needsCustomer =
    docType === "factura" ||
    (docType === "boleta" && total > BOLETA_REQUIRE_THRESHOLD);

  // Client form fields per docType
  const showDocInput    = docType === "boleta" || docType === "factura" || docType === "cotizacion";
  const docInputLabel   = docType === "factura" ? "RUC *"
                        : docType === "cotizacion" ? (cotizaDocMode === "ruc" ? "RUC" : "DNI · opcional")
                        : "DNI · opcional";
  const docInputMaxLen  = (docType === "factura" || (docType === "cotizacion" && cotizaDocMode === "ruc")) ? 11 : 8;
  const docInputPlaceholder = (docType === "factura" || (docType === "cotizacion" && cotizaDocMode === "ruc"))
    ? "20xxxxxxxxx" : "xxxxxxxx";

  const canEstablecer =
    clientName.trim().length > 0 &&
    (docType !== "factura" || clientDoc.trim().length === 11);

  const canConfirm =
    cashSession.isOpen &&
    total > 0 &&
    (!needsReceived || receivedNum >= total) &&
    (!needsCustomer || customer !== null);

  // Customer display in the strip (after ESTABLECER)
  function getCustomerDisplay(): string | null {
    if (!customer) return null;
    if (docType === "boleta")
      return customer.docNumber ? `${customer.docNumber} · ${customer.name}` : customer.name;
    if (docType === "factura") return `${customer.docNumber} · ${customer.name}`;
    if (docType === "cotizacion") return customer.name; // name only
    if (docType === "nota") return customer.name; // name only
    return null;
  }

  // Placeholder shown in client row when no customer committed
  function getCustomerRowLabel(): { text: string; warn: boolean } {
    if (docType === "nota")       return { text: "Clientes varios", warn: false };
    if (docType === "boleta")     return total > BOLETA_REQUIRE_THRESHOLD
      ? { text: "Datos requeridos", warn: true }
      : { text: "Clientes varios", warn: false };
    if (docType === "factura")    return { text: "RUC requerido", warn: true };
    if (docType === "cotizacion") return { text: "Sin cliente", warn: false };
    return { text: "Clientes varios", warn: false };
  }

  function openClientForm() {
    setClientDoc(customer?.docNumber ?? "");
    setClientName(customer?.name ?? "");
    setCotizaDocMode("dni");
    setCobroView("client");
  }

  function cancelClientForm() {
    setClientDoc("");
    setClientName("");
    setCobroView("main");
  }

  const handleEstablecer = useCallback(() => {
    if (!canEstablecer) return;
    setCustomer({ docNumber: clientDoc.trim(), name: clientName.trim() });
    setClientDoc("");
    setClientName("");
    setCobroView("main");
  }, [canEstablecer, clientDoc, clientName]);

  function confirmEmit() {
    if (!cashSession.isOpen) { showNotice("Apertura de caja requerida para emitir"); return; }
    if (!canConfirm) return;
    clearTicket();
    closeCobro();
  }
  confirmRef.current = confirmEmit;

  // Reset customer when docType changes
  useEffect(() => {
    setCustomer(null);
    setClientDoc("");
    setClientName("");
    setCobroView("main");
  }, [docType]);

  // Full reset on open
  useEffect(() => {
    if (!cobroOpen) return;
    setDocType("nota");
    setPayMethod("efectivo");
    setReceived("");
    setCustomer(null);
    setClientDoc("");
    setClientName("");
    setCobroView("main");
    const t = setTimeout(() => receivedRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [cobroOpen]);

  // F1-F4 → doc type switching (always active while cobro is open)
  useEffect(() => {
    if (!cobroOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F1") { e.preventDefault(); setDocType("nota"); }
      else if (e.key === "F2") { e.preventDefault(); setDocType("boleta"); }
      else if (e.key === "F3") { e.preventDefault(); setDocType("factura"); }
      else if (e.key === "F4") { e.preventDefault(); setDocType("cotizacion"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cobroOpen]);

  // Keyboard — main view
  useEffect(() => {
    if (!cobroOpen || cobroView !== "main") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeCobro(); return; }
      if (e.key === "Insert") { e.preventDefault(); openClientForm(); return; }
      if (e.key === "Enter") {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") { e.preventDefault(); confirmRef.current(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cobroOpen, cobroView, closeCobro]);

  // Keyboard — client form view
  useEffect(() => {
    if (!cobroOpen || cobroView !== "client") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); cancelClientForm(); }
      if (e.key === "Enter") { e.preventDefault(); handleEstablecer(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cobroOpen, cobroView, handleEstablecer]);

  const cfg = DOC_SERIES[docType];
  const docNumber = `${cfg.series}-${String(cfg.correlative + 1).padStart(8, "0")}`;
  const customerDisplay = getCustomerDisplay();
  const { text: rowLabel, warn: rowWarn } = getCustomerRowLabel();

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#E9E4DC] bg-[#FDFBF7] shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

      {/* ── HEADER — misma calidez visual que PRE-VENTA ── */}
      <header className="shrink-0 flex items-center gap-2 border-b border-black/5 bg-black/[0.02] px-4 py-2.5">

        {/* Left: back */}
        <button
          onClick={cobroView === "client" ? cancelClientForm : closeCobro}
          className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#374151] transition hover:text-[#111827]"
        >
          <ArrowLeft size={12} />
          {cobroView === "client" ? "Cobro" : "PRE-VENTA"}
        </button>

        {/* Center: segmented doc type */}
        <div className="flex flex-1 justify-center">
          <div className="flex gap-px rounded-lg bg-amber-100/60 p-0.5">
            {(["nota", "boleta", "factura", "cotizacion"] as DocType[]).map(dt => (
              <button
                key={dt}
                onClick={() => setDocType(dt)}
                className={`rounded-[5px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                  docType === dt
                    ? "bg-white text-[#2154d8] shadow-sm"
                    : "text-[#b89a6c] hover:text-[#7c6240]"
                }`}
              >
                {DOC_SHORT[dt]}
              </button>
            ))}
          </div>
        </div>

        {/* Right: doc number */}
        <span className="shrink-0 font-mono text-[11px] font-semibold text-[#374151]">
          {docNumber}
        </span>
      </header>

      {/* ── BODY ── */}
      {cobroView === "main" ? (
        <>
          {/* CLIENTE — fijo, no scrollea */}
          <div className="shrink-0 px-4 pt-3 pb-1">
          <button
            onClick={openClientForm}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left transition ${
              rowWarn && !customerDisplay
                ? "border border-amber-200 bg-amber-50/60 hover:bg-amber-50"
                : "border border-[#e4e9f0] hover:border-[#c7d7f4] hover:bg-[#f0f5ff]"
            }`}
          >
            {rowWarn && !customerDisplay ? (
              <AlertCircle size={13} strokeWidth={2} className="shrink-0 text-amber-500" />
            ) : (
              <User size={13} strokeWidth={2} className={`shrink-0 ${customerDisplay ? "text-[#9ca3af]" : "text-[#c0cad4]"}`} />
            )}
            <span className={`flex-1 truncate text-[12px] font-semibold ${
              customerDisplay ? "text-[#374151]"
              : rowWarn ? "text-amber-600"
              : "text-[#b8c4cf]"
            }`}>
              {customerDisplay ?? rowLabel}
            </span>
            <span className="shrink-0 text-[10px] text-[#9ca3af]">
              {customerDisplay ? "editar" : "agregar →"}
            </span>
          </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">

          {/* TOTAL A COBRAR + tax — 50/50 */}
          <div className="rounded-2xl bg-[#f4f7fb] px-4 py-3 flex items-center gap-3">
            <div className="flex flex-col justify-center gap-1 flex-1 min-w-0">
              <div className="flex justify-between text-[10.5px] text-[#9ca3af]">
                <span>Op. Gravada</span>
                <span className="tabular-nums font-semibold text-[#374151]">S/ {baseImponible.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10.5px] text-[#9ca3af]">
                <span>IGV 18%</span>
                <span className="tabular-nums font-semibold text-[#374151]">S/ {igv.toFixed(2)}</span>
              </div>
            </div>
            <div className="w-px self-stretch shrink-0 bg-[#e0e8f0]" />
            <div className="flex flex-col items-end flex-1 min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#9ca3af]">Total a cobrar</p>
              <p className="text-[24px] font-bold leading-none tracking-tight text-[#2F3E46] tabular-nums">
                S/ {total.toFixed(2)}
              </p>
            </div>
          </div>

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
              <div className="flex gap-2 items-stretch">
                <input
                  ref={receivedRef}
                  type="number"
                  value={received}
                  onChange={e => setReceived(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && canConfirm) { e.preventDefault(); confirmEmit(); }
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.10"
                  className="flex-1 min-w-0 rounded-2xl border border-[#e4e9f0] px-4 py-3 text-[22px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                />
                <div className={`flex-1 min-w-0 flex flex-col justify-center rounded-xl px-3.5 py-2.5 ${
                  receivedNum > 0
                    ? change >= 0 ? "bg-emerald-50" : "bg-red-50"
                    : "border border-dashed border-[#E9E4DC]"
                }`}>
                  {receivedNum > 0 ? (
                    <>
                      <p className={`text-[10px] font-semibold uppercase tracking-widest ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {change >= 0 ? "Vuelto" : "Faltan"}
                      </p>
                      <p className={`text-[20px] font-bold leading-none tabular-nums ${change >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                        S/ {Math.abs(change).toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-[#d1d9e1] text-center">vuelto</p>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </>

      ) : (

        /* ── CLIENT FORM — inline, reemplaza body ── */
        <div className="flex-1 flex flex-col px-5 pt-4 pb-3 gap-3">

          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
            {docType === "factura" ? "Datos de facturación" :
             docType === "boleta"  ? "Datos del cliente" :
             docType === "cotizacion" ? "Cliente de cotización" :
             "Cliente"}
          </p>

          {/* COTIZA: DNI/RUC switch */}
          {docType === "cotizacion" && (
            <div className="flex gap-px rounded-lg bg-[#f1f5f9] p-0.5 self-start">
              {(["dni", "ruc"] as CotizaDocMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setCotizaDocMode(m); setClientDoc(""); }}
                  className={`rounded-[5px] px-3 py-1 text-[11px] font-bold uppercase transition ${
                    cotizaDocMode === m ? "bg-white text-[#2154d8] shadow-sm" : "text-[#9ca3af] hover:text-[#374151]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* Doc number input */}
          {showDocInput && (
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                {docInputLabel}
              </label>
              <input
                autoFocus
                type="text"
                value={clientDoc}
                onChange={e => setClientDoc(e.target.value.replace(/\D/g, ""))}
                placeholder={docInputPlaceholder}
                maxLength={docInputMaxLen}
                className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[14px] font-bold text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
              />
            </div>
          )}

          {/* Name input */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              {docType === "factura" ? "Razón social *" : "Nombre · opcional"}
            </label>
            <input
              autoFocus={!showDocInput}
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder={docType === "factura" ? "Empresa S.A.C." : "Nombre completo"}
              className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[14px] text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
            />
          </div>

          <button
            onClick={handleEstablecer}
            disabled={!canEstablecer}
            className="mt-1 w-full rounded-2xl bg-[#2154d8] py-3 text-[13px] font-bold uppercase tracking-widest text-white transition hover:bg-[#1a43b0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
          >
            Establecer
          </button>

          {customer && (
            <button
              onClick={() => { setCustomer(null); setCobroView("main"); }}
              className="w-full rounded-xl py-1.5 text-[11px] font-semibold text-[#9ca3af] transition hover:text-red-500"
            >
              Quitar cliente
            </button>
          )}
        </div>
      )}

      {/* ── FOOTER — siempre visible ── */}
      <div className="shrink-0 border-t border-amber-100/70 bg-[#fffdf8] px-3 pt-2.5 pb-3 flex flex-col gap-2">
        <p className="text-center text-[9px] font-bold uppercase tracking-[0.18em] text-[#c4a87c]">
          Emisión de comprobante
        </p>
        <div className="flex gap-1.5 items-stretch">
          <button
            onClick={confirmEmit}
            disabled={!canConfirm}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#ddd0b0] bg-[#fefaef] py-3.5 text-[12px] font-bold uppercase tracking-wide text-[#2F3E46] shadow-[0_1px_4px_rgba(160,120,40,0.10)] transition hover:bg-[#fef3d8] hover:border-[#c8a860] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
          >
            <Save size={13} strokeWidth={2} />
            Guardar
          </button>
          <button
            onClick={confirmEmit}
            disabled={!canConfirm}
            className="flex flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-[#166534] py-3.5 text-[13px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(22,101,52,0.32)] transition hover:bg-[#14532d] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
          >
            <Printer size={15} strokeWidth={2} />
            Imprimir
          </button>
          <button
            onClick={confirmEmit}
            disabled={!canConfirm}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#ddd0b0] bg-[#fefaef] py-3.5 text-[12px] font-bold uppercase tracking-wide text-[#2F3E46] shadow-[0_1px_4px_rgba(160,120,40,0.10)] transition hover:bg-[#fef3d8] hover:border-[#c8a860] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
          >
            <Send size={13} strokeWidth={2} />
            Enviar
          </button>
        </div>
      </div>
    </section>
  );
}
