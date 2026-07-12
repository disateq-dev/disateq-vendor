import React, { useState, useEffect, useRef } from "react";
import {
  Banknote, Smartphone, CreditCard,
  Printer, Send, Save, User, AlertCircle, Plus, Receipt,
} from "lucide-react";
import { useLineasPreVenta } from "../../domains/preventa/selectors/preventa.selectors";
import { preVentaService } from "../../domains/preventa/services/preventa.service";
import { usePOS } from "../../context/POSContext";
import { printTicket, printTicketThermal, printTicketWithDispatch, printReceiptWithDispatchHTML, printDispatchTicket, type DispatchData } from "../../print/printTicket";

import { toCents, moneySum, moneySub, moneyRound, moneyGt, moneyGte, moneyEq } from "../../lib/money";
import { loadBusinessConfig } from "../../config/business";
import { despacharConFefo } from "../../domains/farmacia/fefo-despacho.service";
import {
  emitirComprobante,
  construirReceiptData
} from "../../domains/documents/bridge-comprobante";
import { validarComprobante } from "../../domains/documents/comprobante.validator";
import { correlativoStore } from "../../domains/documents/correlativo.store";
import type { Comprobante, TipoComprobante } from "../../domains/documents/comprobante.types";
import ClienteBuscador, { type ReceptorComprobante } from "../sales/ClienteBuscador";
import { SheetBody, SheetFooter, SheetHeader, SheetWork } from "../../components/sheet";

type DocType     = "nota" | "boleta" | "factura" | "cotizacion";
type PayMethod   = "efectivo" | "yape" | "tarjeta" | "mixto";
type CobroView   = "main" | "client";
type Affectation = "gravado-onerosa" | "exonerado-onerosa" | "inafecto-onerosa" | "gravado-retiro" | "inafecto-retiro";

function Helper({ text }: { text: string }) {
  return (
    <span
      title={text}
      className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full bg-[#e4e9f0] text-[8px] font-bold text-[#9ca3af] transition hover:bg-[#d1d9e1] hover:text-[#6b7280]"
    >
      ?
    </span>
  );
}

const DOC_SERIES: Record<DocType, { series: string }> = {
  nota:       { series: "T001" },
  boleta:     { series: "B001" },
  factura:    { series: "F001" },
  cotizacion: { series: "C001" },
};

const DOC_SHORT: Record<DocType, string> = {
  nota: "Tique", boleta: "Boleta", factura: "Factura", cotizacion: "Cotiza",
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
const CLIENTES_VARIOS    = "99999999 - CLIENTES VARIOS";

export function CobroPanel() {
  const lines = useLineasPreVenta();
  const { cobroOpen, closeCobro, cashSession, showNotice, recordSale, addComprobante, printFlow, activeOperator } = usePOS();
  const { cashBox } = cashSession;
  const isCtg = !!cashBox && cashBox.type !== "normal";
  const tasaIGV = loadBusinessConfig().tasaIGV;

  // ── main state ──────────────────────────────────────────────────────────────
  const [docType,       setDocType]       = useState<DocType>("nota");
  const [payMethod,     setPayMethod]     = useState<PayMethod>("efectivo");
  const [received,      setReceived]      = useState("");
  const [discount,      setDiscount]      = useState("");
  const [cobroView,     setCobroView]     = useState<CobroView>("main");
  const [affectation,   setAffectation]   = useState<Affectation>("gravado-onerosa");
  const [yapeRef, setYapeRef] = useState("");
  const [tarjetaRef, setTarjetaRef] = useState("");
  const [mixtoEfe, setMixtoEfe] = useState("");
  const [mixtoYap, setMixtoYap] = useState("");
  const [mixtoTar, setMixtoTar] = useState("");
  const [dispatchCorrelative, setDispatchCorrelative] = useState(1);
  const [confirmSheet, setConfirmSheet] = useState<{ accion: 'guardar' | 'enviar' | 'imprimir'; docNumber: string; total: number; metodo: string; canal?: string } | null>(null);

  // ── committed customer ───────────────────────────────────────────────────────
  const [customer, setCustomer] = useState<ReceptorComprobante | null>(null);

  const receivedRef    = useRef<HTMLInputElement>(null);
  const yapeRefInputRef = useRef<HTMLInputElement>(null);
  const tarjetaRefInputRef = useRef<HTMLInputElement>(null);
  const mixtoEfeRef    = useRef<HTMLInputElement>(null);
  const mixtoYapRef    = useRef<HTMLInputElement>(null);
  const mixtoTarRef    = useRef<HTMLInputElement>(null);
  const discountRef         = useRef<HTMLInputElement>(null);
  const confirmRef          = useRef<() => void>(() => {});
  const enviarRef           = useRef<() => void>(() => {});
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
  const baseImponible = isGravado ? moneyRound(netTotal / (1 + tasaIGV)) : netTotal;
  const igv           = isGravado ? moneySub(netTotal, baseImponible) : 0;
  const receivedNum = parseFloat(received) || 0;
  const mixtoEfeNum = parseFloat(mixtoEfe) || 0;
  const mixtoYapNum = parseFloat(mixtoYap) || 0;
  const mixtoTarNum = parseFloat(mixtoTar) || 0;
  const mixtoTotal  = moneySum([mixtoEfeNum, mixtoYapNum, mixtoTarNum]);
  const mixtoValid  = moneyGt(mixtoTotal, 0) && moneyEq(mixtoTotal, netTotal);
  const change           = moneySub(receivedNum, netTotal);
  const paidEnough       = moneyGte(receivedNum, netTotal);
  const needsCustomer = docType === "factura" || (docType === "boleta" && moneyGt(netTotal, BOLETA_THRESHOLD));
  const customerOk    = customer !== null && !customer.esGenerico;
  const canConfirm       = cashSession.isOpen && moneyGt(netTotal, 0)
    && (payMethod !== "efectivo" || paidEnough)
    && (payMethod !== "mixto"    || mixtoValid)
    && (!needsCustomer || customerOk);
  const puedeEnviar = canConfirm && docType !== "nota";
  netTotalRef.current = netTotal;

  // ── advertencias reactivas del validador ─────────────────────────────────────
  const advertenciasActivas: string[] = (() => {
    const fuenteReceptor: Parameters<typeof validarComprobante>[0]['receptor']['fuente'] =
      customer?.clienteId ? 'CLIENTE_REGISTRADO' : customer ? 'INGRESO_MANUAL' : 'SIN_RECEPTOR'
    const receptorParcial = {
      tipoDocumento: customer?.tipoDocumento ?? 'SIN_DOCUMENTO' as const,
      numeroDocumento: customer?.numeroDocumento ?? null,
      nombre: customer?.nombre ?? 'Clientes Varios',
      direccion: customer?.direccion ?? null,
      esGenerico: customer?.esGenerico ?? true,
      fuente: fuenteReceptor,
      clienteId: customer?.clienteId ?? null,
      validadoSunat: false,
      email: customer?.email ?? null,
      whatsapp: customer?.whatsapp ?? null,
      consentimientoContacto: false,
    }
    const tipoMapeado =
      docType === 'factura'   ? 'FACTURA'    :
      docType === 'boleta'    ? 'BOLETA'     :
      docType === 'cotizacion'? 'COTIZACION' :
      'TIQUE_VENTA'
    const inputValidacion = {
      tipo: tipoMapeado,
      pedidoId: null,
      emisor: {
        ruc: '',
        razonSocial: '',
        direccion: '',
      },
      receptor: receptorParcial,
      lineas: [],
      moneda: 'PEN',
      metodoPago: mapearMetodoPago(payMethod),
      tributario: {
        regimen: 'GENERAL',
        incluyeDetraccion: false,
        porcentajeDetraccion: null,
      },
      operadorId: activeOperator?.id ?? 'default',
    } satisfies Parameters<typeof validarComprobante>[0]
    try {
      const resultado = validarComprobante(
        inputValidacion,
        netTotal
      )
      return resultado.advertencias
    } catch {
      return []
    }
  })()

  // ── customer display ─────────────────────────────────────────────────────────
  function getCustomerDisplay(): string | null {
    if (!customer || customer.esGenerico) return null;
    const num = customer.numeroDocumento;
    const nom = customer.nombre;
    return num ? `${num} · ${nom}` : nom;
  }

  function getRowLabel(): { text: string; warn: boolean } {
    if (docType === "factura") return { text: "RUC requerido", warn: true };
    if (docType === "boleta" && moneyGt(netTotal, BOLETA_THRESHOLD)) return { text: "Datos requeridos", warn: true };
    return { text: CLIENTES_VARIOS, warn: false };
  }

  function buildComprobanteData(_: string): Comprobante {
    const tipo = mapearTipoComprobante(docType);
    const metodoPago = mapearMetodoPago(payMethod);
    const biz = loadBusinessConfig();
    const tipoAfectacionIGV =
      affectation === "exonerado-onerosa"
        ? "EXONERADO"
        : affectation === "inafecto-onerosa" || affectation === "inafecto-retiro"
        ? "INAFECTO"
        : "GRAVADO";
    // tipoDocumento resuelto desde customer.tipoDocumento — inferencia por longitud eliminada

    return {
      id: crypto.randomUUID(),
      tipo,
      serie: cfg.series,
      correlativo: nextCorrelative,
      codigoUnico: `${cfg.series}-${String(nextCorrelative).padStart(8, "0")}`,
      esFormal: tipo === "FACTURA" || tipo === "BOLETA",
      requiereEnvioSUNAT: tipo === "FACTURA" || tipo === "BOLETA",
      leyendaNoFormal: tipo === "TIQUE_VENTA"
        ? "ESTE DOCUMENTO NO ES UN COMPROBANTE DE PAGO CON VALOR TRIBUTARIO"
        : null,
      pedidoId: preVentaService.obtenerPedidoActivoOCrear?.("default", "default", "default") ?? null,
      comprobanteReferenciadoId: null,
      comprobanteOrigenId: null,
      emisor: {
        ruc: biz.ruc,
        razonSocial: biz.razonSocial,
        direccion: biz.direccion,
      },
      receptor: customer === null
        ? {
            tipoDocumento: "SIN_DOCUMENTO",
            numeroDocumento: null,
            nombre: "Clientes Varios",
            direccion: null,
            esGenerico: true,
            fuente: "SIN_RECEPTOR" as const,
            clienteId: null,
            validadoSunat: false,
            email: null,
            whatsapp: null,
            consentimientoContacto: false,
          }
        : {
            tipoDocumento: customer.tipoDocumento,
            numeroDocumento: customer.numeroDocumento,
            nombre: customer.nombre,
            direccion: customer.direccion,
            esGenerico: false,
            fuente: customer.clienteId ? "CLIENTE_REGISTRADO" as const : "INGRESO_MANUAL" as const,
            clienteId: customer.clienteId,
            validadoSunat: false,
            email: customer.email,
            whatsapp: customer.whatsapp,
            consentimientoContacto: false,
          },
      lineas: lines.map(l => ({
        id: crypto.randomUUID(),
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        valorUnitario: l.valorUnitario,
        subtotal: l.subtotal,
        codigoProductoSUNAT: null,
        tipoAfectacionIGV,
        tasaIGV: tipoAfectacionIGV === "GRAVADO" ? tasaIGV : 0,
        montoISC: null,
        notaLinea: l.nota ?? null,
      })),
      subtotal: baseImponible,
      igv,
      isc: 0,
      total: netTotal,
      moneda: "PEN",
      metodoPago,
      tributario: {
        regimen: "GENERAL",
        incluyeDetraccion: false,
        porcentajeDetraccion: null,
      },
      estado: "EMITIDO",
      estadoSUNAT: tipo === "FACTURA" || tipo === "BOLETA" ? "PENDIENTE" : "NO_APLICA",
      cdr: null,
      fechaEnvioSUNAT: null,
      motivoAnulacion: null,
      emitidoEn: new Date().toISOString(),
      operadorId: activeOperator?.id ?? "default",
      enviadoPorCanal: "NINGUNO",
    };
  }

  function mapearTipoComprobante(dt: DocType): TipoComprobante {
    switch (dt) {
      case 'factura':    return 'FACTURA'
      case 'boleta':     return 'BOLETA'
      case 'cotizacion': return 'COTIZACION'
      default:           return 'TIQUE_VENTA'
    }
  }

  const CHIP_FISCAL: Record<DocType, { label: string; color: string }> = {
    nota:       { label: 'No es comprobante de pago',        color: 'bg-[#f1f5f9] text-[#64748b]' },
    boleta:     { label: 'Consumidor final · IGV incluido',  color: 'bg-[#eff6ff] text-[#2154d8]' },
    factura:    { label: 'Requiere RUC · Crédito fiscal',    color: 'bg-[#eef2ff] text-[#4338ca]' },
    cotizacion: { label: 'Referencial · No descuenta stock', color: 'bg-amber-50 text-amber-700'  },
  }

  function mapearMetodoPago(payMethod: string) {
    if (payMethod === 'yape')    return 'YAPE' as const;
    if (payMethod === 'tarjeta') return 'TARJETA' as const;
    if (payMethod === 'mixto')   return 'MIXTO' as const;
    return 'EFECTIVO' as const;
  }

  function handleEnviar() {
    if (!cashSession.isOpen) { showNotice("Abre el turno antes de cobrar"); return; }
    if (!canConfirm) return;
    const tieneCanal = !customer?.esGenerico && !!(customer?.email || customer?.whatsapp);
    if (tieneCanal) {
      despacharPorCanal();
    } else {
      setCobroView("client");
    }
  }

  function despacharPorCanal() {
    const biz = loadBusinessConfig();
    const resumen = [
      `*${biz.nombreComercial}*`,
      `Comprobante: ${docNumber}`,
      `Total: S/ ${netTotal.toFixed(2)}`,
      `Gracias por su preferencia.`,
    ].join('\n');

    if (customer?.whatsapp && !customer.esGenerico) {
      const numero = customer.whatsapp.replace(/\D/g, '');
      const url = `https://wa.me/51${numero}?text=${encodeURIComponent(resumen)}`;
      window.open(url, '_blank');
    } else if (customer?.email && !customer.esGenerico) {
      const asunto = encodeURIComponent(`Comprobante ${docNumber} - ${biz.nombreComercial}`);
      const cuerpo = encodeURIComponent(resumen);
      window.open(`mailto:${customer.email}?subject=${asunto}&body=${cuerpo}`, '_blank');
    }

    confirmEmit({
      accion: 'enviar',
      canal: customer?.whatsapp ? 'WhatsApp' : 'Email',
    });
  }

  function confirmEmit(confirmacion?: { accion: 'guardar' | 'enviar'; canal?: string }) {
    if (!cashSession.isOpen) { showNotice("Abre el turno antes de cobrar"); return; }
    if (!canConfirm) return;
    const now = new Date();
    const p2  = (n: number) => String(n).padStart(2, "0");
    const dt  = `${p2(now.getDate())}/${p2(now.getMonth() + 1)}/${now.getFullYear()} ${p2(now.getHours())}:${p2(now.getMinutes())}`;
    if (printFlow === "comprobante-despacho") {
      printDispatchTicket({
        correlative: dispatchCorrelative,
        dateTime:    dt,
        lines:       lines.map(l => ({ description: l.descripcion, quantity: l.cantidad, note: l.nota })),
        opNumber:    docNumber,
      } satisfies DispatchData);
      setDispatchCorrelative(prev => prev + 1);
    }
    recordSale(netTotal, payMethod, docType, cfg.series, nextCorrelative,
      payMethod === "mixto" ? mixtoEfeNum : undefined,
      payMethod === "mixto" ? mixtoYapNum : undefined,
      payMethod === "mixto" ? mixtoTarNum : undefined);
    try {
      const pedidoId = preVentaService
        .obtenerPedidoActivoOCrear?.("default", "default", "default") ?? null;
      const comprobante = emitirComprobante({
        tipo: mapearTipoComprobante(docType),
        serie: cfg.series,
        tipoAfectacionIGV: affectation === "exonerado-onerosa"
          ? "EXONERADO"
          : affectation === "inafecto-onerosa" || affectation === "inafecto-retiro"
          ? "INAFECTO"
          : "GRAVADO",
        lineas: lines.map(l => ({
          description: l.descripcion,
          quantity:    l.cantidad,
          unitPrice:   l.valorUnitario,
          subtotal:    l.subtotal,
          note:        l.nota ?? null,
        })),
        subtotal:    baseImponible,
        igv:         igv,
        isc:         0,
        total:       total,
        metodoPago:  mapearMetodoPago(payMethod),
        mixtoBreakdown: payMethod === 'mixto'
          ? { efe: mixtoEfeNum, yap: mixtoYapNum, tar: mixtoTarNum }
          : undefined,
        customer:    customer && !customer.esGenerico
          ? {
              tipoDocumento: customer.tipoDocumento,
              docNumber:     customer.numeroDocumento ?? '',
              name:          customer.nombre,
              address:       customer.direccion ?? null,
              clienteId:     customer.clienteId,
              email:         customer.email,
              whatsapp:      customer.whatsapp,
              consentimientoContacto: false,
            }
          : null,
        operadorId:  activeOperator?.id ?? "default",
        pedidoId:    pedidoId,
      });
      addComprobante(comprobante);
    } catch {
      addComprobante(buildComprobanteData(dt));
    }
    if (docType !== "cotizacion") {
      void despacharConFefo(lines, docNumber, activeOperator?.id ?? 'default');
    }

    const pedidoActivo = preVentaService.obtenerPedidoActivoOCrear?.(
      "default",
      "default",
      "default"
    );
    if (pedidoActivo) {
      preVentaService.concretarVenta(pedidoActivo);
    }

    setConfirmSheet({
      accion: confirmacion?.accion ?? 'guardar',
      docNumber,
      total: netTotal,
      metodo: payMethod,
      canal: confirmacion?.canal,
    });
  }

  async function handleImprimir() {
    if (!cashSession.isOpen) { showNotice("Abre el turno antes de cobrar"); return; }
    if (!canConfirm) return;
    const now      = new Date();
    const p        = (n: number) => String(n).padStart(2, "0");
    const dateTime = `${p(now.getDate())}/${p(now.getMonth() + 1)}/${now.getFullYear()} ${p(now.getHours())}:${p(now.getMinutes())}`;
    let receiptData: Parameters<typeof printTicket>[0];
    try {
      const pedidoId = preVentaService
        .obtenerPedidoActivoOCrear?.("default", "default", "default") ?? null;
      const comprobante = emitirComprobante({
        tipo: mapearTipoComprobante(docType),
        serie: cfg.series,
        tipoAfectacionIGV: affectation === "exonerado-onerosa"
          ? "EXONERADO"
          : affectation === "inafecto-onerosa" || affectation === "inafecto-retiro"
          ? "INAFECTO"
          : "GRAVADO",
        lineas: lines.map(l => ({
          description: l.descripcion,
          quantity:    l.cantidad,
          unitPrice:   l.valorUnitario,
          subtotal:    l.subtotal,
          note:        l.nota ?? null,
        })),
        subtotal:    baseImponible,
        igv:         igv,
        isc:         0,
        total:       total,
        metodoPago:  mapearMetodoPago(payMethod),
        mixtoBreakdown: payMethod === 'mixto'
          ? { efe: mixtoEfeNum, yap: mixtoYapNum, tar: mixtoTarNum }
          : undefined,
        customer:    customer && !customer.esGenerico
          ? {
              tipoDocumento: customer.tipoDocumento,
              docNumber:     customer.numeroDocumento ?? '',
              name:          customer.nombre,
              address:       customer.direccion ?? null,
              clienteId:     customer.clienteId,
              email:         customer.email,
              whatsapp:      customer.whatsapp,
              consentimientoContacto: false,
            }
          : null,
        operadorId:  activeOperator?.id ?? "default",
        pedidoId:    pedidoId,
      });
      addComprobante(comprobante);
      receiptData = construirReceiptData(
        comprobante,
        dateTime,
        baseImponible,
        discountNum,
        netTotal,
        receivedNum,
        change,
        payMethod === 'mixto'
          ? { efe: mixtoEfeNum, yap: mixtoYapNum, tar: mixtoTarNum }
          : undefined
      ) as Parameters<typeof printTicket>[0];
    } catch {
      addComprobante(buildComprobanteData(dateTime));
      const biz = loadBusinessConfig();
      receiptData = {
        businessName:   biz.nombreComercial,
        businessRuc:    biz.ruc,
        businessAddr:   biz.direccion,
        businessPhone:  biz.telefono,
        docType,
        docSeries:      cfg.series,
        docCorrelative: nextCorrelative,
        dateTime,
        customer: customer && !customer.esGenerico
          ? {
              tipoDocumento: customer.tipoDocumento,
              docNumber: customer.numeroDocumento ?? '',
              name: customer.nombre,
            }
          : null,
        customerAddress: customer?.direccion ?? null,
        lines: lines.map(l => ({
          description: l.descripcion,
          quantity:    l.cantidad,
          unitPrice:   l.valorUnitario,
          subtotal:    l.subtotal,
          note:        l.nota,
        })),
        baseImponible, igv, discountNum, total, netTotal,
        payMethod, receivedNum, change,
        mixtoBreakdown: payMethod === 'mixto'
          ? { efe: mixtoEfeNum, yap: mixtoYapNum, tar: mixtoTarNum }
          : undefined,
      };
    }
    const dispatchData: DispatchData = {
      correlative: dispatchCorrelative,
      dateTime,
      lines:       lines.map(l => ({ description: l.descripcion, quantity: l.cantidad, note: l.nota })),
      opNumber:    docNumber,
    };
    setDispatchCorrelative(prev => prev + 1);
    if (printFlow === "comprobante-despacho") {
      try {
        await printTicketWithDispatch("TIQUE", receiptData, dispatchData);
      } catch {
        printReceiptWithDispatchHTML(receiptData, dispatchData);
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
    if (docType !== "cotizacion") {
      void despacharConFefo(lines, docNumber, activeOperator?.id ?? 'default');
    }

    const pedidoActivo = preVentaService.obtenerPedidoActivoOCrear?.(
      "default",
      "default",
      "default"
    );
    if (pedidoActivo) {
      preVentaService.concretarVenta(pedidoActivo);
    }

    setConfirmSheet({
      accion: 'imprimir',
      docNumber,
      total: netTotal,
      metodo: payMethod,
    });
  }

  function cerrarConConfirmacion(): void {
    preVentaService.limpiar();
    closeCobro();
    setConfirmSheet(null);
  }

  confirmRef.current    = confirmEmit;
  enviarRef.current     = handleEnviar;
  openClientRef.current = () => setCobroView("client");
  canConfirmRef.current = canConfirm;
  imprimirRef.current   = () => { void handleImprimir(); };

  // ── effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setCustomer(null);
    setCobroView("main");
  }, [docType]);

  useEffect(() => {
    if (!cobroOpen) return;
    activatedMethodsRef.current = new Set(["efectivo"]);
    setDocType("nota"); setPayMethod("efectivo"); setReceived(netTotalRef.current.toFixed(2)); setDiscount("");
    setYapeRef(""); setTarjetaRef("");
    setMixtoEfe(""); setMixtoYap(""); setMixtoTar("");
    setCustomer(null);
    setConfirmSheet(null);
    setCobroView("main"); setAffectation("gravado-onerosa");
    setDispatchCorrelative(1);
    const t = setTimeout(() => receivedRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [cobroOpen]);

  useEffect(() => {
    if (confirmSheet === null) return;
    const t = setTimeout(cerrarConConfirmacion, 3000);
    return () => clearTimeout(t);
  }, [confirmSheet]);

  // Ctrl+1-4 doc · E/Y/T/M pago · Ctrl+Insert guardar · Ctrl+Home enviar · Enter imprimir · Ctrl+Enter cliente
  useEffect(() => {
    if (!cobroOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (confirmSheet !== null) return;
      if (e.ctrlKey) {
        if      (e.key === "7") { e.preventDefault(); setDocType("nota"); }
        else if (e.key === "8") { e.preventDefault(); setDocType("boleta"); }
        else if (e.key === "9") { e.preventDefault(); setDocType("factura"); }
        else if (e.key === "4") { e.preventDefault(); setDocType("cotizacion"); }
        else if (e.key === "5") { e.preventDefault(); }
        else if (e.key === "6") { e.preventDefault(); }
        else if (e.key.toLowerCase() === "e" && cobroView === "main") { e.preventDefault(); setPayMethod("efectivo"); }
        else if (e.key.toLowerCase() === "y" && cobroView === "main") { e.preventDefault(); setPayMethod("yape"); }
        else if (e.key.toLowerCase() === "t" && cobroView === "main") { e.preventDefault(); setPayMethod("tarjeta"); }
        else if (e.key.toLowerCase() === "m" && cobroView === "main") { e.preventDefault(); setPayMethod("mixto"); }
        else if (e.key.toLowerCase() === "d" && cobroView === "main") { e.preventDefault(); discountRef.current?.focus(); }
        else if (e.key === "Insert") { e.preventDefault(); if (cobroView === "main") confirmRef.current(); }
        else if (e.key === "Home") { e.preventDefault(); if (cobroView === "main" && docType !== "nota") enviarRef.current(); }
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cobroOpen, cobroView, payMethod, confirmSheet, docType]);

  // Main view: Esc → close · Ctrl+Enter → cliente · Enter → imprimir si canConfirm
  useEffect(() => {
    if (!cobroOpen || cobroView !== "main") return;
    const handler = (e: KeyboardEvent) => {
      if (confirmSheet !== null) {
        if (e.key === "Enter" && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
          e.preventDefault();
          cerrarConConfirmacion();
        }
        return;
      }
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
  }, [cobroOpen, cobroView, closeCobro, confirmSheet]);

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
    if (payMethod === "yape") {
      const t = setTimeout(() => yapeRefInputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
    if (payMethod === "tarjeta") {
      const t = setTimeout(() => tarjetaRefInputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
    if (payMethod === "mixto") {
      const t = setTimeout(() => mixtoEfeRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [payMethod, cobroOpen, cobroView]);

  // ── render ───────────────────────────────────────────────────────────────────
  const cfg             = DOC_SERIES[docType];
  const nextCorrelative = correlativoStore.obtenerSiguiente(cfg.series);
  const docNumber       = `${cfg.series}-${String(nextCorrelative).padStart(8, "0")}`;
  const customerDisplay = getCustomerDisplay();
  const { text: rowLabel, warn: rowWarn } = getRowLabel();
  const confirmColor = confirmSheet?.accion === "guardar"
    ? "#F5A623"
    : confirmSheet?.accion === "enviar"
    ? "#4A90D9"
    : "#45b356";
  const ConfirmIcon = confirmSheet?.accion === "guardar"
    ? Save
    : confirmSheet?.accion === "enviar"
    ? Send
    : Printer;
  const confirmTitle = confirmSheet?.accion === "guardar"
    ? "SE GUARDÓ EL DOCUMENTO"
    : confirmSheet?.accion === "enviar"
    ? "SE ENVIÓ EL DOCUMENTO"
    : "SE IMPRIMIÓ EL DOCUMENTO";

  return (
    <SheetWork accent="#128C7E">

      {/* SheetHeader */}
      {cobroView === "main" && confirmSheet === null && (
        <SheetHeader icon={Receipt} label="COBRO" accent="#128C7E" />
      )}

      {/* BODY */}
      {confirmSheet !== null ? (
        <>
          <style>{`
            @keyframes cobroConfirmProgress {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ConfirmIcon size={64} strokeWidth={1.8} style={{ color: confirmColor }} />
            <h2 className="mt-5 text-[16px] font-bold uppercase text-[#2F3E46]">
              {confirmTitle}
            </h2>
            <p className="mt-2 text-[13px] font-semibold tabular-nums text-[#374151]">
              {confirmSheet.docNumber}
            </p>
            <p className="mt-1 text-[12px] uppercase text-[#9ca3af]">
              S/ {confirmSheet.total.toFixed(2)} · {confirmSheet.metodo.toUpperCase()}
            </p>
            {confirmSheet.accion === "enviar" && confirmSheet.canal ? (
              <p className="mt-1 text-[12px] uppercase text-[#9ca3af]">
                {confirmSheet.canal}
              </p>
            ) : null}
            <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-[#edf2f7]">
              <div
                className="h-full"
                style={{
                  backgroundColor: confirmColor,
                  animation: "cobroConfirmProgress 3000ms linear forwards",
                }}
              />
            </div>
          </div>
          <footer className="grid shrink-0 grid-cols-1 gap-2 border-t border-[#f0f4f8] px-4 py-3">
            <button
              type="button"
              onClick={cerrarConConfirmacion}
              className="rounded-xl py-3 text-[12px] font-bold uppercase tracking-wide text-white transition active:scale-[0.97]"
              style={{ backgroundColor: confirmColor }}
            >
              ACEPTAR →
            </button>
          </footer>
        </>
      ) : cobroView === "main" ? (
        <>
          {/* TIPO DE COMPROBANTE + CORRELATIVO */}
          <div className="shrink-0 flex flex-col px-4 pt-2 pb-0">
            <div className="flex gap-px rounded-lg bg-[#f1f5f9] p-0.5">
              {(["nota", "boleta", "factura", "cotizacion"] as DocType[]).map((dt) => (
                <button
                  key={dt}
                  title={`Tecla [Ctrl + ${dt === "nota" ? 7 : dt === "boleta" ? 8 : dt === "factura" ? 9 : 4}]`}
                  onClick={() => setDocType(dt)}
                  className={`flex-1 rounded-[5px] px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                    docType === dt
                      ? "bg-white text-[#2154d8] shadow-sm"
                      : "text-[#9ca3af] hover:text-[#374151]"
                  }`}
                >
                  {DOC_SHORT[dt]}
                </button>
              ))}
              <button
                disabled
                title="Nota de Crédito — disponible próximamente"
                className="rounded-[5px] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#c0cad4] cursor-not-allowed"
              >
                N. Crédito
              </button>
              <button
                disabled
                title="Nota de Débito — disponible próximamente"
                className="rounded-[5px] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#c0cad4] cursor-not-allowed"
              >
                N. Débito
              </button>
            </div>
            <div className="flex items-center gap-1.5 pt-1 pb-1">
              {isCtg && (
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-extrabold tracking-widest text-amber-500">CTG</span>
              )}
              <span className="tabular-nums text-[11px] font-semibold text-[#374151]">{docNumber}</span>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9.5px] font-semibold tracking-wide ${CHIP_FISCAL[docType].color}`}>
                {CHIP_FISCAL[docType].label}
              </span>
            </div>
          </div>

          {/* CLIENTE strip */}
          <div className="shrink-0 px-4 pt-3 pb-1">
            <button
              title="Tecla [Ctrl + Enter]"
              onClick={() => setCobroView("client")}
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
                {customerDisplay ? "editar" : "Agregar datos →"}
              </span>
            </button>
          </div>

          {/* ADVERTENCIAS — banner no bloqueante */}
          {advertenciasActivas.length > 0 && (
            <div className="shrink-0 px-4 pb-1 flex flex-col gap-1">
              {advertenciasActivas.map((msg, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2"
                >
                  <AlertCircle size={11} strokeWidth={2} className="shrink-0 mt-0.5 text-amber-500" />
                  <span className="text-[10.5px] font-medium leading-snug text-amber-700">
                    {msg}
                  </span>
                </div>
              ))}
            </div>
          )}

          <SheetBody className="px-4 pt-3 pb-3 flex flex-col gap-3">

            {/* AFECTACIÓN TRIBUTARIA */}
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Afect.</span>
              <Helper text="Tipo tributario de la operación. Para ventas normales: Gravado · Op. onerosa." />
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
                  title={`Tecla [Ctrl + ${fkey}]`}
                  onClick={() => setPayMethod(id)}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition ${
                    payMethod === id
                      ? "bg-[#45b356] text-white shadow-[0_2px_8px_rgba(69,179,86,0.20)]"
                      : "border border-[#e4e9f0] text-[#374151] hover:border-[#45b356]/30 hover:bg-[#F0FAF1] hover:text-[#2d5c33]"
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

            {/* YAPE */}
            {payMethod === "yape" && (
              <div className="flex items-center gap-2">
                <div className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                  <Smartphone size={14} strokeWidth={2} className="text-emerald-700" />
                  <span className="text-[10px] font-bold text-emerald-700">Yape</span>
                  <span className="text-[15px] font-bold tabular-nums text-emerald-700">S/ {netTotal.toFixed(2)}</span>
                </div>
                <input
                  ref={yapeRefInputRef}
                  value={yapeRef}
                  onChange={e => setYapeRef(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.ctrlKey && canConfirm) { e.preventDefault(); imprimirRef.current(); } }}
                  placeholder="N° operación Yape (opcional)"
                  className="flex-1 rounded-xl border border-[#e4e9f0] px-3 py-2 text-[13px] text-[#374151] outline-none focus:border-[#2154d8]"
                />
              </div>
            )}

            {/* TARJETA */}
            {payMethod === "tarjeta" && (
              <div className="flex items-center gap-2">
                <div className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-50 px-3 py-2">
                  <CreditCard size={14} strokeWidth={2} className="text-blue-600" />
                  <span className="text-[10px] font-bold text-blue-700">Tarjeta</span>
                  <span className="text-[15px] font-bold tabular-nums text-blue-700">S/ {netTotal.toFixed(2)}</span>
                </div>
                <input
                  ref={tarjetaRefInputRef}
                  value={tarjetaRef}
                  onChange={e => setTarjetaRef(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.ctrlKey && canConfirm) { e.preventDefault(); imprimirRef.current(); } }}
                  placeholder="N° operación Tarjeta (opcional)"
                  className="flex-1 rounded-xl border border-[#e4e9f0] px-3 py-2 text-[13px] text-[#374151] outline-none focus:border-[#2154d8]"
                />
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

          </SheetBody>
        </>

      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <ClienteBuscador
            docType={docType}
            onReceptorConfirmado={(receptor) => {
              setCustomer(receptor);
              setCobroView("main");
            }}
            onCancelar={() => setCobroView("main")}
          />
        </div>
      )}

      {/* FOOTER — condicional por sheet activa */}
      {cobroView === "main" && confirmSheet === null && (
        <SheetFooter className="border-amber-100/70 bg-[#fffdf8]">
          <div className="flex gap-1.5 items-stretch">
            <button
              title="Tecla [Ctrl + Insert]"
              onClick={() => confirmEmit()}
              disabled={!canConfirm}
              className="flex w-[25%] items-center justify-center gap-1.5 rounded-2xl bg-[#F5A623] py-3.5 text-[12px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(245,166,35,0.30)] transition hover:bg-[#e09610] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
            >
              <Save size={13} strokeWidth={2} />
              Guardar
            </button>
            <button
              title={docType === "nota" ? "Solo se envían documentos formales" : "Tecla [Ctrl + Inicio]"}
              onClick={handleEnviar}
              disabled={!puedeEnviar}
              className="flex w-[25%] items-center justify-center gap-1.5 rounded-2xl bg-[#4A90D9] py-3.5 text-[12px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(74,144,217,0.30)] transition hover:bg-[#3a7fc8] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
            >
              <Send size={13} strokeWidth={2} />
              Enviar
            </button>
            <button
              title="Tecla [Enter]"
              onClick={handleImprimir}
              disabled={!canConfirm}
              className="flex w-[50%] items-center justify-center gap-2 rounded-2xl bg-[#45b356] py-3.5 text-[13px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(76,175,80,0.30)] transition hover:bg-[#3d9e41] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
            >
              <Printer size={15} strokeWidth={2} />
              Imprimir
            </button>
          </div>
        </SheetFooter>
      )}

    </SheetWork>
  );
}
