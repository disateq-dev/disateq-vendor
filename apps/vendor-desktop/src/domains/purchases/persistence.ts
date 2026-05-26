import type { CompraOperacional } from './types';

// Persistencia local edge-first — prefijo purch_v0_ para evitar colisión
const K = {
  compras:   'purch_v0_compras',
  runtimeId: 'purch_v0_runtime_id',
} as const;

function tryParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function loadCompras(): CompraOperacional[] {
  return tryParse(localStorage.getItem(K.compras), []);
}

export function saveCompras(compras: CompraOperacional[]): void {
  localStorage.setItem(K.compras, JSON.stringify(compras));
}

export function loadOrCreateRuntimeId(): string {
  const existing = localStorage.getItem(K.runtimeId);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(K.runtimeId, id);
  return id;
}
