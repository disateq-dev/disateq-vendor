export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

// 0.1 — Identidad mínima de ítem
export interface ItemOperacional {
  itemId: string;
  nombre: string;
  unidadBase: string;
}

// 0.2 — Movimiento operacional con causalidad mínima
export interface MovimientoOperacional {
  movementId: string;
  itemId: string;
  tipo: TipoMovimiento;
  cantidad: number; // entrada/salida: positivo; ajuste: delta firmado
  timestamp: number;
  runtimeId: string;
  causa: string;
}

// 1.1 — Estado operacional derivado de existencia + contexto de umbral
export type EstadoDisponibilidad = 'disponible' | 'bajo_stock' | 'agotado';

// 1.2 — Contexto operacional por ítem (umbralMinimo=0 → sin umbral configurado)
export interface ContextoItem {
  itemId: string;
  umbralMinimo: number;
}
