import type { CashBox } from "../../../context/POSContext";
import type { TipoCaja } from "../../../domains/operator/blocks.store";
import { moneyGt } from "../../../lib/money";

export function prereqCode(box: CashBox): string {
  const tipoCaja: TipoCaja = box.tipoCaja;

  if (tipoCaja === "AUXILIAR") return String(Number(box.code) - 1);
  if (tipoCaja === "EXCEPCIONAL") return box.code[0] + "00";
  return "";
}

export function isContingencyBox(box: CashBox | null): boolean {
  return !!box && box.tipoCaja !== "PRINCIPAL";
}

export type OpeningMode = "normal" | "contingency" | "exceptional";

export function detectOpeningMode(box: CashBox | null): OpeningMode {
  if (!box || box.tipoCaja === "PRINCIPAL") return "normal";
  if (box.tipoCaja === "EXCEPCIONAL") return "exceptional";
  if (box.tipoCaja === "AUXILIAR" && box.available) return "contingency";
  if (box.tipoCaja === "AUXILIAR" && !box.available && !box.used) return "exceptional";
  return "normal";
}

export const MIN_MOTIVO_LEN = 5;

export function canOpenSession(
  isOpen: boolean,
  box: CashBox | null,
  aperturaInput: string,
  mode: OpeningMode,
  ctgPin: string,
  ctgJustif: string,
  expectedCtgPin: string,
): boolean {
  if (isOpen) return false;
  if (!box) return false;
  if (box.tipoCaja === "EXCEPCIONAL") {
    if (!box.available || box.used) return false;
  } else {
    const boxOk = mode === "exceptional" ? (!box.used && !box.available) : box.available;
    if (!boxOk) return false;
  }
  if (aperturaInput.trim() === "") return false;
  const amt = parseFloat(aperturaInput);
  if (isNaN(amt) || amt < 0) return false;
  if (mode === "contingency") return ctgJustif.trim().length >= MIN_MOTIVO_LEN;
  if (mode === "exceptional") return ctgPin === expectedCtgPin && ctgJustif.trim().length >= MIN_MOTIVO_LEN;
  return true;
}

export function validateCanAddMove(totalAmt: number, motivo: string): boolean {
  return moneyGt(totalAmt, 0) && motivo.trim().length > 0;
}
