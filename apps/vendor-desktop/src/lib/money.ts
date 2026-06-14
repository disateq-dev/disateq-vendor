// Monetary utilities — SUNAT-compatible HALF-UP rounding, cent-based arithmetic
// Rule: never compare or accumulate monetary floats directly. Use these helpers.

// ── core precision ──────────────────────────────────────────────────────────

/** Integer cents. Math.round gives HALF-UP for positive amounts. */
export function toCents(n: number): number {
  return Math.round(n * 100);
}

/** Cents back to decimal — exact for any value produced by toCents. */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * SUNAT HALF-UP round to 2 decimals.
 * 10.124 → 10.12  |  10.125 → 10.13
 */
export function moneyRound(n: number): number {
  return fromCents(toCents(n));
}

// ── safe arithmetic ─────────────────────────────────────────────────────────

/** Cent-safe addition. */
export function moneyAdd(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

/** Cent-safe subtraction. */
export function moneySub(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}

/**
 * Multiply amount by a factor then round.
 * Use for: unitPrice * quantity, rate * base, etc.
 * Round happens AFTER multiplication, not before.
 */
export function moneyMul(amount: number, factor: number): number {
  return moneyRound(amount * factor);
}

/**
 * Sum an array via cents to avoid chain float drift.
 * Use instead of .reduce((acc, v) => acc + v) on monetary values.
 */
export function moneySum(values: number[]): number {
  return fromCents(values.reduce((acc, v) => acc + toCents(v), 0));
}

// ── safe comparisons ────────────────────────────────────────────────────────

export function moneyEq(a: number, b: number): boolean {
  return toCents(a) === toCents(b);
}

export function moneyGt(a: number, b: number): boolean {
  return toCents(a) > toCents(b);
}

export function moneyGte(a: number, b: number): boolean {
  return toCents(a) >= toCents(b);
}

export function moneyLt(a: number, b: number): boolean {
  return toCents(a) < toCents(b);
}

export function moneyLte(a: number, b: number): boolean {
  return toCents(a) <= toCents(b);
}

export function moneyIsZero(n: number): boolean {
  return toCents(n) === 0;
}

// ── formatting ───────────────────────────────────────────────────────────────

/** Format a monetary value as "S/ 0.00" for display. */
export function moneyFormat(n: number): string {
  return `S/ ${n.toFixed(2)}`;
}
