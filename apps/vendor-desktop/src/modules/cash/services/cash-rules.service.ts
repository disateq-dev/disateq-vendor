import type { CashBox, MoveSource } from "../../../context/POSContext";

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
  if (box.type === "contingency-1") return box.code.slice(0, 2) + "0";
  if (box.type === "contingency-2") return box.code.slice(0, 2) + "1";
  return "";
}

export function isContingencyBox(box: CashBox | null): boolean {
  return !!box && box.type !== "normal";
}

// ── secondary box authorization ────────────────────────────────

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
  isContingency: boolean,
  ctgPin: string,
  ctgJustif: string,
): boolean {
  if (isOpen || !box?.available) return false;
  if (parseFloat(aperturaInput) < 0) return false;
  if (isContingency && !validateCtgAuth(ctgPin, ctgJustif)) return false;
  return true;
}

// ── move form validation ────────────────────────────────────────

export function validateMixto(totalAmt: number, mixAptNum: number, mixVndNum: number): boolean {
  return Math.abs(mixAptNum + mixVndNum - totalAmt) < 0.005;
}

export function validateCanAddMove(
  totalAmt: number,
  motivo: string,
  sourceType: MoveSource,
  mixAptNum: number,
  mixVndNum: number,
): boolean {
  if (totalAmt <= 0 || !motivo.trim()) return false;
  if (sourceType !== "mixto") return true;
  return validateMixto(totalAmt, mixAptNum, mixVndNum) && (mixAptNum > 0 || mixVndNum > 0);
}
