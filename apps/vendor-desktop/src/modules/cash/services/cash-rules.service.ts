import type { CashBox, MoveSource } from "../../../context/POSContext";
import { moneyEq, moneyGt, moneySum } from "../../../lib/money";

// ── block operator assignment ───────────────────────────────────

const BLOCK_OPERATORS: Record<string, string> = {
  "1": "Ricardo Aguinaga",
  "2": "Lucía Rebaza",
  "3": "Administrador",
};

export function operatorFromCode(code: string): string {
  return BLOCK_OPERATORS[code[0]] ?? "Operador";
}

// ── contingency prerequisites ───────────────────────────────────

export function prereqCode(box: CashBox): string {
  if (box.type === "contingency-1") return box.code.slice(0, 2) + "0"; // 101 → 100
  if (box.type === "contingency-2") return box.code.slice(0, 2) + "1"; // 102 → 101
  if (box.type === "contingencia")  return box.code[0] + "00";          // 150 → 100
  return "";
}

export function isContingencyBox(box: CashBox | null): boolean {
  return !!box && box.type !== "normal";
}

// ── opening mode classification ─────────────────────────────────
//
// normal:      caja principal — sin autorización adicional
// contingency: caja contingente con prerequisito cumplido (principal usada/cerrada) — motivo obligatorio
// exceptional: caja contingente sin prerequisito (principal NUNCA usada hoy) — PIN + motivo obligatorio

export type OpeningMode = "normal" | "contingency" | "exceptional";

export function detectOpeningMode(box: CashBox | null): OpeningMode {
  if (!box || box.type === "normal") return "normal";
  if (box.type === "contingencia") return "exceptional"; // apertura excepcional: siempre PIN + motivo
  if (box.available) return "contingency";               // secundaria con prereq cumplido: solo motivo
  if (!box.available && !box.used && box.type === "contingency-1") return "exceptional";
  return "normal";
}

// ── authorization constants ─────────────────────────────────────

export const CTG_PIN = "1234";
export const MIN_MOTIVO_LEN = 5;

export function validateCtgAuth(pin: string, motivo: string): boolean {
  return pin === CTG_PIN && motivo.trim().length >= MIN_MOTIVO_LEN;
}

// ── apertura validation ─────────────────────────────────────────

export function canOpenSession(
  isOpen: boolean,
  box: CashBox | null,
  aperturaInput: string,
  mode: OpeningMode,
  ctgPin: string,
  ctgJustif: string,
): boolean {
  if (isOpen) return false;
  if (!box) return false;
  // "contingencia" type: available=true cuando principal no usada; siempre requiere PIN
  if (box.type === "contingencia") {
    if (!box.available || box.used) return false;
  } else {
    const boxOk = mode === "exceptional" ? (!box.used && !box.available) : box.available;
    if (!boxOk) return false;
  }
  if (aperturaInput.trim() === "") return false;
  const amt = parseFloat(aperturaInput);
  if (isNaN(amt) || amt < 0) return false;
  if (mode === "contingency") return ctgJustif.trim().length >= MIN_MOTIVO_LEN;
  if (mode === "exceptional") return ctgPin === CTG_PIN && ctgJustif.trim().length >= MIN_MOTIVO_LEN;
  return true;
}

// ── move form validation ────────────────────────────────────────

export function validateMixto(totalAmt: number, mixAptNum: number, mixVndNum: number): boolean {
  return moneyEq(moneySum([mixAptNum, mixVndNum]), totalAmt);
}

export function validateCanAddMove(
  totalAmt: number,
  motivo: string,
  sourceType: MoveSource,
  mixAptNum: number,
  mixVndNum: number,
): boolean {
  if (!moneyGt(totalAmt, 0) || !motivo.trim()) return false;
  if (sourceType !== "mixto") return true;
  return validateMixto(totalAmt, mixAptNum, mixVndNum) && (moneyGt(mixAptNum, 0) || moneyGt(mixVndNum, 0));
}
