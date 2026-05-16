// Print module — HTML/CSS for PDF, ESC/POS thermal via Tauri invoke
import { invoke } from "@tauri-apps/api/core";

export interface PrintData {
  // Business (MVP: static config)
  businessName:   string;
  businessRuc:    string;
  businessAddr:   string;
  businessPhone?: string;

  // Document
  docType:        string;
  docSeries:      string;
  docCorrelative: number;
  dateTime:       string;

  // Customer (null → no customer section)
  customer: { docNumber: string; name: string } | null;

  // Lines
  lines: Array<{
    description: string;
    quantity:    number;
    unitPrice:   number;
    subtotal:    number;
    note?:       string;
  }>;

  // Totals
  baseImponible: number;
  igv:           number;
  discountNum:   number;
  total:         number;
  netTotal:      number;

  // Payment
  payMethod:   string;
  receivedNum: number;
  change:      number;
}

export interface VoucherMoveData {
  businessName: string;
  moveType: "ingreso" | "egreso";
  amount: number;
  motivo: string;
  observacion?: string;
  operator: string;
  cashBoxCode: string;
  terminal: string;
  dateTime: string;
}

const DOC_LABEL: Record<string, string> = {
  nota:       "NOTA DE VENTA",
  boleta:     "BOLETA DE VENTA",
  factura:    "FACTURA ELECTRÓNICA",
  cotizacion: "COTIZACIÓN",
};

const PAY_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  yape:     "Yape",
  tarjeta:  "Tarjeta",
  mixto:    "Pago Mixto",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function money(n: number): string {
  return `S/ ${n.toFixed(2)}`;
}

function buildHTML(d: PrintData): string {
  const docLabel = DOC_LABEL[d.docType] ?? d.docType.toUpperCase();
  const docNum   = `${d.docSeries}-${String(d.docCorrelative + 1).padStart(8, "0")}`;

  const linesHTML = d.lines.map(l =>
    `<div class="pt-item">
      <span class="pt-qty">${l.quantity}×</span>
      <span class="pt-desc">${esc(l.description)}${l.note ? `<br><span class="pt-note">↳ ${esc(l.note)}</span>` : ""}</span>
      <span class="pt-amt">${money(l.subtotal)}</span>
    </div>`
  ).join("");

  const customerHTML = d.customer
    ? `<div class="pt-dash"></div>
       <div class="pt-row"><span>Cliente</span><span>${esc(d.customer.name)}</span></div>
       ${d.customer.docNumber ? `<div class="pt-row"><span>Doc.</span><span>${esc(d.customer.docNumber)}</span></div>` : ""}`
    : "";

  const discountHTML = d.discountNum > 0
    ? `<div class="pt-sm"><span>Subtotal bruto</span><span>${money(d.total)}</span></div>
       <div class="pt-sm"><span>Descuento</span><span>−${money(d.discountNum)}</span></div>`
    : "";

  const taxHTML = d.igv > 0
    ? `<div class="pt-sm"><span>Op. Gravada</span><span>${money(d.baseImponible)}</span></div>
       <div class="pt-sm"><span>IGV 18%</span><span>${money(d.igv)}</span></div>`
    : "";

  const payHTML = d.payMethod === "efectivo" && d.receivedNum > 0
    ? `<div class="pt-row"><span>Efectivo</span><span>${money(d.receivedNum)}</span></div>
       <div class="pt-row"><span>Vuelto</span><span><b>${money(Math.max(0, d.change))}</b></span></div>`
    : `<div class="pt-row"><span>Método de pago</span><span>${PAY_LABEL[d.payMethod] ?? d.payMethod}</span></div>`;

  return `
<style>
@page { size: 80mm auto; margin: 0; }
@media print {
  body > *:not(#pt-overlay) { display: none !important; }
  #pt-overlay { display: block !important; }
}
#pt-overlay {
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
  color: #000;
  line-height: 1.5;
  background: #fff;
}
#pt-overlay .pt-ticket  { padding: 4mm 2mm 10mm; }
#pt-overlay .pt-center  { text-align: center; }
#pt-overlay .pt-biz     { font-size: 13px; font-weight: bold; letter-spacing: .5px; }
#pt-overlay .pt-meta    { font-size: 10px; color: #444; }
#pt-overlay .pt-doc     { font-size: 12px; font-weight: bold; text-align: center; margin: 3px 0 1px; }
#pt-overlay .pt-solid   { border-top: 1px solid #000; margin: 5px 0; }
#pt-overlay .pt-dash    { border-top: 1px dashed #555; margin: 4px 0; }
#pt-overlay .pt-double  { border-top: 3px double #000; margin: 5px 0; }
#pt-overlay .pt-row     { display: flex; justify-content: space-between; gap: 8px; font-size: 10.5px; }
#pt-overlay .pt-sm      { display: flex; justify-content: space-between; font-size: 10px; color: #333; }
#pt-overlay .pt-item    { display: flex; gap: 3px; align-items: flex-start; margin: 2px 0; font-size: 10.5px; }
#pt-overlay .pt-qty     { min-width: 22px; flex-shrink: 0; color: #555; }
#pt-overlay .pt-desc    { flex: 1; min-width: 0; word-break: break-word; }
#pt-overlay .pt-note    { font-size: 9.5px; color: #666; }
#pt-overlay .pt-amt     { min-width: 52px; text-align: right; font-weight: bold; flex-shrink: 0; }
#pt-overlay .pt-total   { display: flex; justify-content: space-between; align-items: baseline; }
#pt-overlay .pt-tlbl    { font-size: 12px; font-weight: bold; }
#pt-overlay .pt-tamt    { font-size: 18px; font-weight: bold; }
#pt-overlay .pt-foot    { text-align: center; font-size: 10px; color: #555; margin-top: 4px; }
</style>
<div class="pt-ticket">

  <div class="pt-center">
    <div class="pt-biz">${esc(d.businessName)}</div>
    <div class="pt-meta">RUC: ${esc(d.businessRuc)}</div>
    <div class="pt-meta">${esc(d.businessAddr)}</div>
    ${d.businessPhone ? `<div class="pt-meta">Tel: ${esc(d.businessPhone)}</div>` : ""}
  </div>

  <div class="pt-solid"></div>

  <div class="pt-doc">${docLabel}</div>
  <div class="pt-center pt-meta">${docNum}</div>
  <div class="pt-center pt-meta">${esc(d.dateTime)}</div>

  ${customerHTML}

  <div class="pt-dash"></div>

  ${linesHTML}

  <div class="pt-dash"></div>

  ${discountHTML}
  ${taxHTML}

  <div class="pt-double"></div>

  <div class="pt-total">
    <span class="pt-tlbl">TOTAL</span>
    <span class="pt-tamt">${money(d.netTotal)}</span>
  </div>

  <div class="pt-dash"></div>

  ${payHTML}

  <div class="pt-dash"></div>
  <div class="pt-foot">¡Gracias por su compra!</div>
  <div class="pt-foot" style="font-size:9px">Conserve su comprobante</div>

</div>`;
}

export function printTicket(data: PrintData): void {
  let overlay = document.getElementById("pt-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "pt-overlay";
    overlay.style.display = "none";
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = buildHTML(data);
  window.print();
}

export async function printTicketThermal(printer: string, data: PrintData): Promise<void> {
  await invoke("print_ticket", { printer, data });
}

export async function printTicketWithDispatch(
  printer: string,
  receipt: PrintData,
  dispatch: DispatchData,
): Promise<void> {
  await invoke("print_ticket_with_dispatch", { printer, receipt, dispatch });
}

function buildVoucherHTML(d: VoucherMoveData): string {
  const typeLabel  = d.moveType === "ingreso" ? "INGRESO" : "EGRESO";
  const typeColor  = d.moveType === "ingreso" ? "#065f46" : "#991b1b";
  const amtColor   = d.moveType === "ingreso" ? "#059669" : "#dc2626";
  return `
<style>
@page { size: 80mm auto; margin: 0; }
@media print {
  body > *:not(#pt-overlay) { display: none !important; }
  #pt-overlay { display: block !important; }
}
#pt-overlay { font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; line-height: 1.5; background: #fff; }
</style>
<div id="pt-ticket" style="padding: 4mm 2mm 10mm; font-family: 'Courier New', Courier, monospace;">
  <div style="text-align:center; margin-bottom:4px;">
    <div style="font-size:13px; font-weight:bold;">${esc(d.businessName)}</div>
    <div style="font-size:12px; font-weight:bold; margin:3px 0;">MOVIMIENTO DE CAJA</div>
    <div style="color:${typeColor}; font-weight:bold; font-size:12px; letter-spacing:1px;">${typeLabel}</div>
  </div>
  <div style="border-top:1px solid #000; margin:4px 0;"></div>
  <div style="display:flex; justify-content:space-between; align-items:baseline; margin:3px 0;">
    <span style="font-size:11px; font-weight:bold;">MONTO</span>
    <span style="font-size:20px; font-weight:bold; color:${amtColor};">S/ ${d.amount.toFixed(2)}</span>
  </div>
  <div style="border-top:1px dashed #555; margin:4px 0;"></div>
  <div style="display:flex; justify-content:space-between; font-size:10.5px; margin:2px 0;"><span>Motivo</span><span style="font-weight:bold;">${esc(d.motivo)}</span></div>
  ${d.observacion ? `<div style="font-size:10px; color:#555; margin:2px 0; padding-left:4px;">${esc(d.observacion)}</div>` : ""}
  <div style="display:flex; justify-content:space-between; font-size:10.5px; margin:2px 0;"><span>Operador</span><span>${esc(d.operator)}</span></div>
  <div style="display:flex; justify-content:space-between; font-size:10.5px; margin:2px 0;"><span>Caja</span><span>${esc(d.cashBoxCode)}</span></div>
  <div style="display:flex; justify-content:space-between; font-size:10.5px; margin:2px 0;"><span>Terminal</span><span>${esc(d.terminal)}</span></div>
  <div style="display:flex; justify-content:space-between; font-size:10.5px; margin:2px 0;"><span>Fecha/Hora</span><span>${esc(d.dateTime)}</span></div>
  <div style="border-top:1px dashed #555; margin:4px 0;"></div>
  <div style="text-align:center; font-size:9px; color:#555;">Conserve este comprobante</div>
</div>`;
}

// ─── DISPATCH TICKET ─────────────────────────────────────────────────────────

export interface DispatchData {
  correlative: number;
  dateTime:    string;
  lines: Array<{
    description: string;
    quantity:    number;
    note?:       string;
  }>;
  opNumber: string;
}

function buildDispatchHTML(d: DispatchData): string {
  const corrStr   = String(d.correlative).padStart(4, "0");
  const linesHTML = d.lines.map(l =>
    `<div class="dt-item">
       <span class="dt-qty">${l.quantity}×</span>
       <span class="dt-desc">${esc(l.description.toUpperCase())}${l.note ? `<br><span class="dt-note">↳ ${esc(l.note)}</span>` : ""}</span>
     </div>`
  ).join("");

  return `
<style>
@page { size: 58mm auto; margin: 0; }
@media print {
  body > *:not(#pt-overlay) { display: none !important; }
  #pt-overlay { display: block !important; }
}
#pt-overlay { font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000; line-height: 1.5; background: #fff; }
#pt-overlay .dt-ticket { padding: 3mm 2mm 8mm; text-align: center; }
#pt-overlay .dt-solid  { border-top: 2px solid #000; margin: 4px 0; }
#pt-overlay .dt-dash   { border-top: 1px dashed #555; margin: 3px 0; }
#pt-overlay .dt-label  { font-size: 9px; font-weight: bold; letter-spacing: 2px; }
#pt-overlay .dt-corr   { font-size: 32px; font-weight: bold; line-height: 1; margin: 2px 0; }
#pt-overlay .dt-meta   { font-size: 9px; color: #555; }
#pt-overlay .dt-items  { text-align: left; margin: 2px 0; }
#pt-overlay .dt-item   { display: flex; gap: 4px; align-items: flex-start; margin: 3px 0; }
#pt-overlay .dt-qty    { min-width: 22px; flex-shrink: 0; font-weight: bold; color: #555; }
#pt-overlay .dt-desc   { flex: 1; font-weight: bold; word-break: break-word; font-size: 12px; }
#pt-overlay .dt-note   { font-size: 9.5px; color: #333; font-weight: normal; }
#pt-overlay .dt-op     { font-size: 9px; color: #666; }
</style>
<div class="dt-ticket">
  <div class="dt-label">★  DESPACHO  ★</div>
  <div class="dt-corr">#${corrStr}</div>
  <div class="dt-meta">${esc(d.dateTime)}</div>
  <div class="dt-solid"></div>
  <div class="dt-items">${linesHTML}</div>
  <div class="dt-dash"></div>
  <div class="dt-op">OP: ${esc(d.opNumber)}</div>
</div>`;
}

export function printDispatchTicket(d: DispatchData): void {
  let overlay = document.getElementById("pt-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "pt-overlay";
    overlay.style.display = "none";
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = buildDispatchHTML(d);
  window.print();
}

// ─── COMBINED RECEIPT + DISPATCH (single print job, auto-cut) ────────────────
// Receipt section = buildHTML() as-is (source of truth, never duplicated).
// Dispatch section = appended CSS + content only — no @page or @media print
// override so the receipt's established rules remain authoritative.

function buildDispatchAppend(d: DispatchData): string {
  const corrStr   = String(d.correlative).padStart(4, "0");
  const linesHTML = d.lines.map(l =>
    `<div class="dt-item">
      <span class="dt-qty">${l.quantity}×</span>
      <span class="dt-desc">${esc(l.description.toUpperCase())}${l.note ? `<br><span class="dt-note">↳ ${esc(l.note)}</span>` : ""}</span>
    </div>`
  ).join("");

  return `
<style>
#pt-overlay .pt-cut        { display:flex; align-items:center; gap:4px; color:#999; font-size:9px; letter-spacing:1px; padding:3px 0; }
#pt-overlay .pt-cut::before, #pt-overlay .pt-cut::after { content:''; flex:1; border-top:1px dashed #bbb; }
#pt-overlay .dt-ticket     { padding: 3mm 2mm 10mm; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; line-height: 1.5; }
#pt-overlay .dt-center     { text-align: center; }
#pt-overlay .dt-title      { font-size: 13px; font-weight: bold; letter-spacing: 2px; }
#pt-overlay .dt-num        { font-size: 16px; font-weight: bold; margin: 1px 0; }
#pt-overlay .dt-meta       { font-size: 10px; color: #444; }
#pt-overlay .dt-solid      { border-top: 1px solid #000; margin: 5px 0; }
#pt-overlay .dt-dash       { border-top: 1px dashed #555; margin: 4px 0; }
#pt-overlay .dt-item       { display: flex; gap: 3px; align-items: flex-start; margin: 2px 0; font-size: 11px; }
#pt-overlay .dt-qty        { min-width: 22px; flex-shrink: 0; color: #555; font-weight: bold; }
#pt-overlay .dt-desc       { flex: 1; min-width: 0; font-weight: bold; word-break: break-word; }
#pt-overlay .dt-note       { font-size: 10px; color: #444; font-weight: normal; }
#pt-overlay .dt-foot       { text-align: center; font-size: 10px; color: #555; }
@media print { #pt-overlay .pt-cut { page-break-after: always; visibility: hidden; height: 1px; margin: 0; padding: 0; } }
</style>
<div class="pt-cut">✂ corte</div>
<div class="dt-ticket">
  <div class="dt-center">
    <div class="dt-title">TICKET DESPACHO</div>
    <div class="dt-num">#${corrStr}</div>
    <div class="dt-meta">${esc(d.dateTime)}</div>
  </div>
  <div class="dt-solid"></div>
  ${linesHTML}
  <div class="dt-dash"></div>
  <div class="dt-foot">OP: ${esc(d.opNumber)}</div>
</div>`;
}

export function printReceiptWithDispatch(r: PrintData, d: DispatchData): void {
  let overlay = document.getElementById("pt-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "pt-overlay";
    overlay.style.display = "none";
    document.body.appendChild(overlay);
  }
  // buildHTML is the validated receipt source of truth — never duplicated.
  // buildDispatchAppend appends only dispatch CSS + content after it.
  overlay.innerHTML = buildHTML(r) + buildDispatchAppend(d);
  window.print();
}

// ─── CASH MOVE VOUCHER ────────────────────────────────────────────────────────

export function printCashMoveVoucher(d: VoucherMoveData): void {
  let overlay = document.getElementById("pt-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "pt-overlay";
    overlay.style.display = "none";
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = buildVoucherHTML(d);
  window.print();
}
