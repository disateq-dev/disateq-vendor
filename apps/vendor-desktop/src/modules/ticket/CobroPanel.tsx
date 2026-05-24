import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Banknote, Smartphone, CreditCard,
  Printer, Send, Save, User, AlertCircle, Plus,
} from "lucide-react";
import { useTicketLines } from "../../domains/ticket/selectors/ticket.selectors";
import { ticketService } from "../../domains/ticket/services/ticket.service";
import { usePOS } from "../../context/POSContext";
import { printTicket, printTicketThermal, printTicketWithDispatch, printReceiptWithDispatch, printDispatchTicket, type DispatchData } from "../../print/printTicket";

import { toCents, moneySum, moneySub, moneyRound, moneyGt, moneyGte, moneyEq } from "../../lib/money";

type DocType     = "nota" | "boleta" | "factura" | "cotizacion";
type PayMethod   = "efectivo" | "yape" | "tarjeta" | "mixto";
type CobroView   = "main" | "client";
type CotizaMode  = "dni" | "ruc";
type Affectation = "gravado-onerosa" | "exonerado-onerosa" | "inafecto-onerosa" | "gravado-retiro" | "inafecto-retiro";

type CustomerData = {
  docNumber:  string;
  name:       string;
  department?: string;
  province?:  string;
  district?:  string;
  address?:   string;
  phone?:     string;
  email?:     string;
};

let _dispatchCorrelative = 1;

const DOC_SERIES: Record<DocType, { series: string; correlative: number }> = {
  nota:       { series: "T001", correlative: 1253 },
  boleta:     { series: "B001", correlative:  871 },
  factura:    { series: "F001", correlative:  450 },
  cotizacion: { series: "C001", correlative:   22 },
};

const DOC_SHORT: Record<DocType, string> = {
  nota: "Nota", boleta: "Boleta", factura: "Factura", cotizacion: "Cotiza",
};

const AFFECTATIONS: { id: Affectation; label: string }[] = [
  { id: "gravado-onerosa",   label: "Gravado · Op. onerosa" },
  { id: "exonerado-onerosa", label: "Exonerado · Op. onerosa" },
  { id: "inafecto-onerosa",  label: "Inafecto · Op. onerosa" },
  { id: "gravado-retiro",    label: "Gravado · Retiro" },
  { id: "inafecto-retiro",   label: "Inafecto · Retiro" },
];

const QUICK_AMOUNTS      = [10, 20, 50, 100, 200];
const BOLETA_THRESHOLD   = 700;
const CLIENTES_VARIOS    = "00000000 - CLIENTES VARIOS";

export function CobroPanel() {
  const lines = useTicketLines();
  const { cobroOpen, closeCobro, cashSession, showNotice, recordSale, addComprobante, docCorrelatives, printFlow, sessionStats } = usePOS();
  const { cashBox } = cashSession;
  const isCtg = !!cashBox && cashBox.type !== "normal";

  // ── main state ──────────────────────────────────────────────────────────────
  const [docType,       setDocType]       = useState<DocType>("nota");
  const [payMethod,     setPayMethod]     = useState<PayMethod>("efectivo");
  const [received,      setReceived]      = useState("");
  const [discount,      setDiscount]      = useState("");
  const [cobroView,     setCobroView]     = useState<CobroView>("main");
  const [affectation,   setAffectation]   = useState<Affectation>("gravado-onerosa");
  const [mixtoEfe, setMixtoEfe] = useState("");
  const [mixtoYap, setMixtoYap] = useState("");
  const [mixtoTar, setMixtoTar] = useState("");

  // ── committed customer ───────────────────────────────────────────────────────
  const [customer, setCustomer] = useState<CustomerData | null>(null);

  // ── client form fields ───────────────────────────────────────────────────────
  const [cDoc,      setCDoc]      = useState("");
  const [cName,     setCName]     = useState("");
  const [cDept,     setCDept]     = useState("");
  const [cProvince, setCProvince] = useState("");
  const [cDistrict, setCDistrict] = useState("");
  const [cAddress,  setCAddress]  = useState("");
  const [cPhone,    setCPhone]    = useState("");
  const [cEmail,    setCEmail]    = useState("");

  const receivedRef    = useRef<HTMLInputElement>(null);
  const mixtoEfeRef    = useRef<HTMLInputElement>(null);
  const mixtoYapRef    = useRef<HTMLInputElement>(null);
  const mixtoTarRef    = useRef<HTMLInputElement>(null);
  const discountRef         = useRef<HTMLInputElement>(null);
  const confirmRef          = useRef<() => void>(() => {});
  const openClientRef       = useRef<() => void>(() => {});
  const canConfirmRef       = useRef(false);
  const imprimirRef         = useRef<() => void>(() => {});
  const netTotalRef         = useRef(0);
  const activatedMethodsRef = useRef<Set<PayMethod>>(new Set<PayMethod>());

  // ── derived ─────────────────────────────────────────────────────────────────
  const total        = moneySum(lines.map(l => l.subtotal));
  const discountNum  = Math.min(parseFloat(discount) || 0, total);
  const netTotal     = moneySub(total, discountNum);
  const isGravado    = affectation === "gravado-onerosa" || affectation === "gravado-retiro";
  const baseImponible = isGravado ? moneyRound(netTotal / 1.18) : netTotal;
  const igv           = isGravado ? moneySub(netTotal, baseImponible) : 0;
  const receivedNum = parseFloat(received) || 0;
  const mixtoEfeNum = parseFloat(mixtoEfe) || 0;
  const mixtoYapNum = parseFloat(mixtoYap) || 0;
  const mixtoTarNum = parseFloat(mixtoTar) || 0;
  const mixtoTotal  = moneySum([mixtoEfeNum, mixtoYapNum, mixtoTarNum]);
  const mixtoValid  = moneyGt(mixtoTotal, 0) && moneyEq(mixtoTotal, netTotal);
  const change           = moneySub(receivedNum, netTotal);
  const paidEnough       = moneyGte(receivedNum, netTotal);
  const needsCustomer    = docType === "factura" || (docType === "boleta" && moneyGt(netTotal, BOLETA_THRESHOLD));
  const canConfirm       = cashSession.isOpen && moneyGt(netTotal, 0)
    && (payMethod !== "efectivo" || paidEnough)
    && (payMethod !== "mixto"    || mixtoValid)
    && (!needsCustomer || customer !== null);
  netTotalRef.current = netTotal;

  // client form derived
  const showDocInput       = docType === "boleta" || docType === "factura" || docType === "cotizacion";
  const [cotizaMode, setCotizaMode] = useState<CotizaMode>("dni");
  const docLabel           = docType === "factura" ? "RUC *" : docType === "cotizacion" ? (cotizaMode === "ruc" ? "RUC" : "DNI · opcional") : "DNI · opcional";
  const docMaxLen          = (docType === "factura" || (docType === "cotizacion" && cotizaMode === "ruc")) ? 11 : 8;
  const docPlaceholder     = (docType === "factura" || (docType === "cotizacion" && cotizaMode === "ruc")) ? "20xxxxxxxxx" : "xxxxxxxx";
  const docLookupLabel     = cDoc.length === 11 ? "SUNAT" : cDoc.length === 8 ? "RENIEC" : null;
  const canEstablecer      = cName.trim().length > 0 && (docType !== "factura" || cDoc.trim().length === 11);

  // ── customer display ─────────────────────────────────────────────────────────
  function getCustomerDisplay(): string | null {
    if (!customer) return null;
    if (docType === "factura")    return `${customer.docNumber} · ${customer.name}`;
    if (docType === "boleta")     return customer.docNumber ? `${customer.docNumber} · ${customer.name}` : customer.name;
    if (docType === "cotizacion") return customer.docNumber ? `${customer.docNumber} · ${customer.name}` : customer.name;
    return customer.name;
  }

  function getRowLabel(): { text: string; warn: boolean } {
    if (docType === "factura") return { text: "RUC requerido", warn: true };
    if (docType === "boleta" && moneyGt(netTotal, BOLETA_THRESHOLD)) return { text: "Datos requeridos", warn: true };
    return { text: CLIENTES_VARIOS, warn: false };
  }

  // ── form actions ─────────────────────────────────────────────────────────────
  function openClientForm() {
    setCDoc(customer?.docNumber ?? "");
    setCName(customer?.name ?? "");
    setCDept(customer?.department ?? "");
    setCProvince(customer?.province ?? "");
    setCDistrict(customer?.district ?? "");
    setCAddress(customer?.address ?? "");
    setCPhone(customer?.phone ?? "");
    setCEmail(customer?.email ?? "");
    setCotizaMode("dni");
    setCobroView("client");
  }

  function resetForm() {
    setCDoc(""); setCName(""); setCDept(""); setCProvince("");
    setCDistrict(""); setCAddress(""); setCPhone(""); setCEmail("");
    setCobroView("main");
  }

  const handleEstablecer = useCallback((persist = false) => {
    if (!canEstablecer) return;
    setCustomer({
      docNumber:  cDoc.trim(),
      name:       cName.trim(),
      department: cDept.trim()     || undefined,
      province:   cProvince.trim() || undefined,
      district:   cDistrict.trim() || undefined,
      address:    cAddress.trim()  || undefined,
      phone:      cPhone.trim()    || undefined,
      email:      cEmail.trim()    || undefined,
    });
    if (persist) showNotice("Cliente guardado (próximamente sincronización)");
    setCDoc(""); setCName(""); setCDept(""); setCProvince("");
    setCDistrict(""); setCAddress(""); setCPhone(""); setCEmail("");
    setCobroView("main");
  }, [canEstablecer, cDoc, cName, cDept, cProvince, cDistrict, cAddress, cPhone, cEmail, showNotice]);

  function buildComprobanteData(dt: string) {
    return {
      docType, docSeries: cfg.series, docCorrelative: nextCorrelative, dateTime: dt,
      lines: lines.map(l => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, subtotal: l.subtotal, note: l.note })),
      discountAmount: discountNum, grossTotal: total, netTotal,
      payMethod,
      cashComponent:    payMethod === "efectivo" ? netTotal : payMethod === "mixto" ? mixtoEfeNum : 0,
      yapeComponent:    payMethod === "yape"     ? netTotal : payMethod === "mixto" ? mixtoYapNum : 0,
      tarjetaComponent: payMethod === "tarjeta"  ? netTotal : payMethod === "mixto" ? mixtoTarNum : 0,
      customer: customer ? { docNumber: customer.docNumber, name: customer.name } : null,
    };
  }

  function confirmEmit() {
    if (!cashSession.isOpen) { showNotice("Apertura de caja requerida para emitir"); return; }
    if (!canConfirm) return;
    const now = new Date();
    const p2  = (n: number) => String(n).padStart(2, "0");
    const dt  = `${p2(now.getDate())}/${p2(now.getMonth() + 1)}/${now.getFullYear()} ${p2(now.getHours())}:${p2(now.getMinutes())}`;
    if (printFlow === "comprobante-despacho") {
      printDispatchTicket({
        correlative: _dispatchCorrelative++,
        dateTime:    dt,
        lines:       lines.map(l => ({ description: l.description, quantity: l.quantity, note: l.note })),
        opNumber:    docNumber,
      } satisfies DispatchData);
    }
    recordSale(netTotal, payMethod, docType, cfg.series, nextCorrelative,
      payMethod === "mixto" ? mixtoEfeNum : undefined,
      payMethod === "mixto" ? mixtoYapNum : undefined,
      payMethod === "mixto" ? mixtoTarNum : undefined);
    addComprobante(buildComprobanteData(dt));
    ticketService.clear();
    closeCobro();
  }

  async function handleImprimir() {
    if (!cashSession.isOpen) { showNotice("Apertura de caja requerida para emitir"); return; }
    if (!canConfirm) return;
    const now      = new Date();
    const p        = (n: number) => String(n).padStart(2, "0");
    const dateTime = `${p(now.getDate())}/${p(now.getMonth() + 1)}/${now.getFullYear()} ${p(now.getHours())}:${p(now.getMinutes())}`;
    const receiptData = {
      businessName:   "DISATEQ TIENDA",
      businessRuc:    "20123456789",
      businessAddr:   "Jr. Comercio 456, Lima",
      businessPhone:  "01-234-5678",
      docType,
      docSeries:      cfg.series,
      docCorrelative: nextCorrelative,
      dateTime,
      customer,
      lines: lines.map(l => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, subtotal: l.subtotal, note: l.note })),
      baseImponible, igv, discountNum, total, netTotal, payMethod, receivedNum, change,
      mixtoBreakdown: payMethod === "mixto" ? { efe: mixtoEfeNum, yap: mixtoYapNum, tar: mixtoTarNum } : undefined,
    };
    const dispatchData: DispatchData = {
      correlative: _dispatchCorrelative++,
      dateTime,
      lines:       lines.map(l => ({ description: l.description, quantity: l.quantity, note: l.note })),
      opNumber:    docNumber,
    };
    if (printFlow === "comprobante-despacho") {
      try {
        await printTicketWithDispatch("TIQUE", receiptData, dispatchData);
      } catch {
        printReceiptWithDispatch(receiptData, dispatchData);
      }
    } else {
      // solo-comprobante + flujos no implementados aún → solo receipt
      try {
        await printTicketThermal("TIQUE", receiptData);
      } catch {
        printTicket(receiptData);
      }
    }
    recordSale(netTotal, payMethod, docType, cfg.series, nextCorrelative,
      payMethod === "mixto" ? mixtoEfeNum : undefined,
      payMethod === "mixto" ? mixtoYapNum : undefined,
      payMethod === "mixto" ? mixtoTarNum : undefined);
    addComprobante(buildComprobanteData(dateTime));
    ticketService.clear();
    closeCobro();
  }

  confirmRef.current    = confirmEmit;
  openClientRef.current = openClientForm;
  canConfirmRef.current = canConfirm;
  imprimirRef.current   = () => { void handleImprimir(); };

  // ── effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setCustomer(null); setCDoc(""); setCName(""); setCobroView("main");
  }, [docType]);

  useEffect(() => {
    if (!cobroOpen) return;
    activatedMethodsRef.current = new Set(["efectivo"]);
    setDocType("nota"); setPayMethod("efectivo"); setReceived(netTotalRef.current.toFixed(2)); setDiscount("");
    setMixtoEfe(""); setMixtoYap(""); setMixtoTar("");
    setCustomer(null); setCDoc(""); setCName("");
    setCobroView("main"); setAffectation("gravado-onerosa");
    const t = setTimeout(() => receivedRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [cobroOpen]);

  // F1-F4 doc · F5-F8 pago · F10 guardar · F11 enviar · F12 imprimir · Ctrl+Enter cliente
  useEffect(() => {
    if (!cobroOpen) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
      if (e.ctrlKey) {
        if      (e.key === "1") { e.preventDefault(); setDocType("nota"); }
        else if (e.key === "2") { e.preventDefault(); setDocType("boleta"); }
        else if (e.key === "3") { e.preventDefault(); setDocType("factura"); }
        else if (e.key === "4") { e.preventDefault(); setDocType("cotizacion"); }
        else if (e.key.toLowerCase() === "d" && cobroView === "main") { e.preventDefault(); discountRef.current?.focus(); }
        return;
      }
      if (!inInput && cobroView === "main") {
        if      (e.key.toLowerCase() === "e") { e.preventDefault(); setPayMethod("efectivo"); }
        else if (e.key.toLowerCase() === "y") { e.preventDefault(); setPayMethod("yape"); }
        else if (e.key.toLowerCase() === "t") { e.preventDefault(); setPayMethod("tarjeta"); }
        else if (e.key.toLowerCase() === "m") { e.preventDefault(); setPayMethod("mixto"); }
      }
      if      (e.key === "F10") { e.preventDefault(); if (cobroView === "main") confirmRef.current(); }
      else if (e.key === "F11") { e.preventDefault(); if (cobroView === "main") confirmRef.current(); }
      else if (e.key === "F12") { e.preventDefault(); if (cobroView === "main") imprimirRef.current(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cobroOpen, cobroView]);

  // Main view: Esc → close · Ctrl+Enter → cliente · Enter → imprimir si canConfirm
  useEffect(() => {
    if (!cobroOpen || cobroView !== "main") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeCobro(); return; }
      if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); openClientRef.current(); return; }
      if (e.key === "Enter") {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") { e.preventDefault(); return; }
        if (canConfirmRef.current) { e.preventDefault(); imprimirRef.current(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cobroOpen, cobroView, closeCobro]);

  // Client form: Esc → cancel · Enter (no input) → establecer
  useEffect(() => {
    if (!cobroOpen || cobroView !== "client") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); resetForm(); return; }
      if (e.key === "Enter") {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") { e.preventDefault(); handleEstablecer(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cobroOpen, cobroView, handleEstablecer]);

  // Autofocus + prefill por primera activación de método, y al volver de sheet cliente
  useEffect(() => {
    if (!cobroOpen || cobroView !== "main") return;
    const isFirst = !activatedMethodsRef.current.has(payMethod);
    activatedMethodsRef.current.add(payMethod);
    if (payMethod === "efectivo") {
      if (isFirst) setReceived(netTotalRef.current.toFixed(2));
      const t = setTimeout(() => receivedRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
    if (payMethod === "mixto") {
      const t = setTimeout(() => mixtoEfeRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [payMethod, cobroOpen, cobroView]);

  // ── render ───────────────────────────────────────────────────────────────────
  const cfg             = DOC_SERIES[docType];
  // docCorrelatives: fuente única persistente entre sesiones (no se resetea con NULL_STATS)
  const lastCorrelative = docCorrelatives[docType] ?? cfg.correlative;
  const nextCorrelative = lastCorrelative + 1;
  const docNumber       = `${cfg.series}-${String(nextCorrelative).padStart(8, "0")}`;
  const customerDisplay = getCustomerDisplay();
  const { text: rowLabel, warn: rowWarn } = getRowLabel();

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#4F7396]/50 bg-[#FDFCF9]">

      {/* SheetHeader */}
      <header className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#4F7396]/20 bg-[#F2F6FA] px-4">
        <button
          title="Tecla [Esc]"
          onClick={cobroView === "client" ? resetForm : closeCobro}
          className="flex shrink-0 items-center gap-1 text-[14px] font-semibold uppercase tracking-tight text-[#121416] leading-none transition hover:text-[#374151]"
        >
          <ArrowLeft size={12} />
          {cobroView === "client" ? "COBRO" : "PRE-VENTA"}
        </button>

        <div className="flex flex-1 justify-center">
          <div className="flex gap-px rounded-lg bg-[#f1f5f9] p-0.5">
            {(["nota", "boleta", "factura", "cotizacion"] as DocType[]).map((dt, i) => (
              <button
                key={dt}
                title={`Tecla [Ctrl + ${i + 1}]`}
                onClick={() => setDocType(dt)}
                className={`rounded-[5px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                  docType === dt ? "bg-white text-[#2154d8] shadow-sm" : "text-[#9ca3af] hover:text-[#374151]"
                }`}
              >
                {DOC_SHORT[dt]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isCtg && (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-extrabold tracking-widest text-amber-500">CTG</span>
          )}
          <span className="tabular-nums text-[11px] font-semibold text-[#374151]">{docNumber}</span>
        </div>
      </header>

      {/* BODY */}
      {cobroView === "main" ? (
        <>
          {/* CLIENTE strip */}
          <div className="shrink-0 px-4 pt-3 pb-1">
            <button
              title="Tecla [Ctrl+Enter]"
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
                customerDisplay ? "text-[#374151]" : rowWarn ? "text-amber-600" : "text-[#b8c4cf]"
              }`}>
                {customerDisplay ?? rowLabel}
              </span>
              <span className="shrink-0 text-[10px] text-[#9ca3af]">
                {customerDisplay ? "editar" : "agregar →"}
              </span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">

            {/* AFECTACIÓN TRIBUTARIA */}
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Afect.</span>
              <select
                value={affectation}
                onChange={e => setAffectation(e.target.value as Affectation)}
                className="flex-1 rounded-lg border border-[#e4e9f0] bg-white px-2.5 py-1 text-[11px] text-[#374151] outline-none focus:border-[#2154d8]"
              >
                {AFFECTATIONS.map(a => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </div>

            {/* TOTAL + descuento */}
            <div className="rounded-2xl bg-[#f4f7fb] px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="flex flex-col justify-center gap-1 flex-1 min-w-0">
                  <div className="flex justify-between text-[10.5px] text-[#9ca3af]">
                    <span>{isGravado ? "Op. Gravada" : "Op. Base"}</span>
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
                    S/ {netTotal.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Descuento */}
              <div className="flex items-center gap-2 border-t border-[#e8edf4] pt-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]" title="Tecla [Ctrl + D]">Dto. S/</span>
                <input
                  ref={discountRef}
                  type="number"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  min="0"
                  max={total}
                  step="0.10"
                  placeholder="0.00"
                  className="w-20 rounded-lg border border-[#e4e9f0] px-2.5 py-1 text-[12px] font-bold text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8]"
                />
                {moneyGt(discountNum, 0) && (
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    −S/ {discountNum.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* MÉTODOS DE PAGO */}
            <div className="grid grid-cols-4 gap-1">
              {([
                { id: "efectivo", label: "Efectivo", Icon: Banknote,   fkey: "E" },
                { id: "yape",     label: "Yape",     Icon: Smartphone, fkey: "Y" },
                { id: "tarjeta",  label: "Tarjeta",  Icon: CreditCard, fkey: "T" },
                { id: "mixto",    label: "Mixto",    Icon: Plus,       fkey: "M" },
              ] as { id: PayMethod; label: string; Icon: React.ElementType; fkey: string }[]).map(({ id, label, Icon, fkey }) => (
                <button
                  key={id}
                  title={`Tecla [${fkey}]`}
                  onClick={() => setPayMethod(id)}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition ${
                    payMethod === id
                      ? "bg-[#4F7396] text-white shadow-[0_2px_8px_rgba(79,115,150,0.25)]"
                      : "border border-[#e4e9f0] text-[#374151] hover:border-[#4F7396]/40 hover:bg-[#EEF3F8] hover:text-[#2d4f6b]"
                  }`}
                >
                  <Icon size={12} strokeWidth={2} />
                  {label}
                </button>
              ))}
            </div>

            {/* EFECTIVO */}
            {payMethod === "efectivo" && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-1">
                  {QUICK_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setReceived(String(amt))}
                      className="flex-1 rounded-xl border border-[#e4e9f0] py-1.5 text-[11px] font-bold text-[#374151] transition hover:border-[#c7d7f4] hover:bg-[#f0f5ff] hover:text-[#2154d8]"
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
                      if (e.key === "Enter" && !e.ctrlKey && canConfirm) { e.preventDefault(); imprimirRef.current(); }
                    }}
                    placeholder="0.00"
                    min="0"
                    step="0.10"
                    className="flex-1 min-w-0 rounded-2xl border border-[#e4e9f0] px-4 py-3 text-[22px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                  />
                  <div className={`flex-1 min-w-0 flex flex-col justify-center rounded-xl px-3.5 py-2.5 ${
                    moneyGt(receivedNum, 0)
                      ? paidEnough ? "bg-emerald-50" : "bg-red-50"
                      : "border border-dashed border-[#E9E4DC]"
                  }`}>
                    {moneyGt(receivedNum, 0) ? (
                      <>
                        <p className={`text-[10px] font-semibold uppercase tracking-widest ${paidEnough ? "text-emerald-600" : "text-red-500"}`}>
                          {paidEnough ? "Vuelto" : "Faltan"}
                        </p>
                        <p className={`text-[20px] font-bold leading-none tabular-nums ${paidEnough ? "text-emerald-700" : "text-red-600"}`}>
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

            {/* MIXTO */}
            {payMethod === "mixto" && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-1.5">
                  {([
                    { label: "Efectivo", short: "E", value: mixtoEfe, set: setMixtoEfe, ref: mixtoEfeRef, nextRef: mixtoYapRef },
                    { label: "Yape",     short: "Y", value: mixtoYap, set: setMixtoYap, ref: mixtoYapRef, nextRef: mixtoTarRef },
                    { label: "Tarjeta",  short: "T", value: mixtoTar, set: setMixtoTar, ref: mixtoTarRef, nextRef: null       },
                  ] as const).map(({ label, short, value, set, ref, nextRef }) => (
                    <div key={short} className="flex flex-col flex-1 gap-0.5">
                      <span className="text-[9.5px] font-bold uppercase tracking-wide text-[#9ca3af]">{label}</span>
                      <div className="flex items-center gap-1">
                        <span className="shrink-0 text-[9.5px] font-bold text-[#c0cad4]">S/</span>
                        <input
                          ref={ref}
                          type="number"
                          value={value}
                          onChange={e => set(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && !e.ctrlKey) {
                              e.preventDefault();
                              if (nextRef) nextRef.current?.focus();
                              else if (canConfirm) imprimirRef.current();
                            }
                          }}
                          placeholder="0.00"
                          min="0"
                          step="0.10"
                          className="w-full min-w-0 rounded-xl border border-[#e4e9f0] px-2 py-2 text-[15px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`flex items-center justify-between rounded-xl px-3 py-1.5 ${
                  mixtoValid ? "bg-emerald-50" : "bg-[#f4f7fb]"
                }`}>
                  {mixtoValid ? (
                    <span className="text-[10px] font-bold text-emerald-600">✓ Distribución completa</span>
                  ) : moneyGt(mixtoTotal, 0) ? (
                    <>
                      <span className="text-[9.5px] text-[#9ca3af]">Pendiente</span>
                      <span className={`text-[11px] font-bold tabular-nums ${moneyGt(mixtoTotal, netTotal) ? "text-red-500" : "text-[#374151]"}`}>
                        S/ {(Math.abs(toCents(netTotal) - toCents(mixtoTotal)) / 100).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[9.5px] text-[#c0cad4]">Distribuir S/ {netTotal.toFixed(2)}</span>
                  )}
                </div>
              </div>
            )}

          </div>
        </>

      ) : (

        /* ── CLIENT FORM ── */
        <div className="flex-1 overflow-y-auto flex flex-col px-5 pt-4 pb-2 gap-3">

          <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
            {docType === "factura" ? "Datos de facturación" :
             docType === "boleta"  ? "Datos del cliente" :
             docType === "cotizacion" ? "Cliente de cotización" : "Cliente"}
          </p>

          {/* BLOQUE 1 — IDENTIDAD */}
          <div className="flex flex-col gap-2">
            {docType === "cotizacion" && (
              <div className="flex gap-px rounded-lg bg-[#f1f5f9] p-0.5 self-start">
                {(["dni", "ruc"] as CotizaMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => { setCotizaMode(m); setCDoc(""); }}
                    className={`rounded-[5px] px-3 py-1 text-[11px] font-bold uppercase transition ${
                      cotizaMode === m ? "bg-white text-[#2154d8] shadow-sm" : "text-[#9ca3af] hover:text-[#374151]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            {showDocInput && (
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                  {docLabel}
                </label>
                <div className="flex gap-1.5">
                  <input
                    autoFocus
                    type="text"
                    value={cDoc}
                    onChange={e => setCDoc(e.target.value.replace(/\D/g, ""))}
                    placeholder={docPlaceholder}
                    maxLength={docMaxLen}
                    className="flex-1 rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[14px] font-bold text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                  />
                  {docLookupLabel && (
                    <button className="shrink-0 rounded-xl border border-[#c7d7f4] bg-[#f0f5ff] px-3 text-[11px] font-bold text-[#2154d8] transition hover:bg-[#dbeafe]">
                      {docLookupLabel}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                {docType === "factura" ? "Razón social *" : "Nombre · opcional"}
              </label>
              <input
                autoFocus={!showDocInput}
                type="text"
                value={cName}
                onChange={e => setCName(e.target.value)}
                placeholder={docType === "factura" ? "Empresa S.A.C." : "Nombre completo"}
                className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[14px] text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
              />
            </div>
          </div>

          {/* BLOQUE 2 — UBICACIÓN */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#c4a87c]">Ubicación</p>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={cDept}
                onChange={e => setCDept(e.target.value)}
                placeholder="Departamento"
                className="flex-1 rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8]"
              />
              <input
                type="text"
                value={cProvince}
                onChange={e => setCProvince(e.target.value)}
                placeholder="Provincia"
                className="flex-1 rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8]"
              />
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={cDistrict}
                onChange={e => setCDistrict(e.target.value)}
                placeholder="Distrito"
                className="flex-1 rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8]"
              />
              <input
                type="text"
                value={cAddress}
                onChange={e => setCAddress(e.target.value)}
                placeholder="Dirección"
                className="flex-[2] rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8]"
              />
            </div>
          </div>

          {/* BLOQUE 3 — CONTACTO */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#c4a87c]">Contacto</p>
            <div className="flex gap-1.5">
              <input
                type="tel"
                value={cPhone}
                onChange={e => setCPhone(e.target.value)}
                placeholder="Teléfono"
                className="flex-1 rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8]"
              />
              <input
                type="email"
                value={cEmail}
                onChange={e => setCEmail(e.target.value)}
                placeholder="Correo-E"
                className="flex-[1.5] rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8]"
              />
            </div>
          </div>

          {customer && (
            <button
              onClick={() => { setCustomer(null); resetForm(); }}
              className="shrink-0 rounded-xl py-1.5 text-[11px] font-semibold text-[#9ca3af] transition hover:text-red-500"
            >
              Quitar cliente
            </button>
          )}

        </div>
      )}

      {/* FOOTER — condicional por sheet activa */}
      {cobroView === "main" ? (
        <div className="shrink-0 border-t border-amber-100/70 bg-[#fffdf8] px-3 py-3">
          <div className="flex gap-1.5 items-stretch">
            <button
              title="Tecla [F10]"
              onClick={confirmEmit}
              disabled={!canConfirm}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#e4e9f0] bg-[#f8fafd] py-3.5 text-[12px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f1f5f9] hover:border-[#d0d5dd] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Save size={13} strokeWidth={2} />
              Guardar
            </button>
            <button
              title="Tecla [F12]"
              onClick={handleImprimir}
              disabled={!canConfirm}
              className="flex flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-[#56C264] py-3.5 text-[13px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(86,194,100,0.32)] transition hover:bg-[#45b356] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
            >
              <Printer size={15} strokeWidth={2} />
              Imprimir
            </button>
            <button
              title="Tecla [F11]"
              onClick={confirmEmit}
              disabled={!canConfirm}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#005BE3] py-3.5 text-[12px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(0,91,227,0.22)] transition hover:bg-[#0049c4] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
            >
              <Send size={13} strokeWidth={2} />
              Enviar
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-t border-amber-100/70 bg-[#fffdf8] px-3 py-3">
          <div className="flex gap-1.5 items-stretch">
            <button
              title="Tecla [Esc]"
              onClick={resetForm}
              className="flex flex-1 items-center justify-center rounded-2xl border border-[#e4e9f0] py-3.5 text-[12px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]"
            >
              Cancelar
            </button>
            <button
              title="Tecla [Enter]"
              onClick={() => handleEstablecer(false)}
              disabled={!canEstablecer}
              className="flex flex-[1.5] items-center justify-center rounded-2xl bg-[#56C264] py-3.5 text-[13px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(86,194,100,0.28)] transition hover:bg-[#45b356] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Establecer
            </button>
            <button
              onClick={() => handleEstablecer(true)}
              disabled={!canEstablecer}
              className="flex flex-1 items-center justify-center rounded-2xl border border-[#e4e9f0] bg-[#f8fafd] py-3.5 text-[12px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f1f5f9] hover:border-[#d0d5dd] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

    </section>
  );
}
