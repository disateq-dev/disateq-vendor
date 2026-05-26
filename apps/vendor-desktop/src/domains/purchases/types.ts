// COMPRAS CAPA 0 — Registro causal básico de abastecimiento
// Separaciones fundamentales (purchases-domain-boundaries.md):
//   compra ≠ pago · documento ≠ recepción · abastecimiento ≠ obligación financiera
//   INVENTARIOS conserva existencia/disponibilidad — COMPRAS conserva causalidad comercial

export type EstadoCompra = 'registrada' | 'recibida_parcial' | 'recibida';

// Línea de compra — snapshot denormalizado en el momento de captura
// nombreItem/unidadBase: no dependen del estado actual del ítem en INVENTARIOS
export interface LineaCompra {
  lineaId: string;
  itemId: string;
  nombreItem: string;   // snapshot — preserva historia si el ítem se da de baja
  unidadBase: string;   // snapshot
  cantidad: number;
  costoUnitario?: number;    // opcional — sin IGV, sin tributación aquí (CAPA 0)
  cantidadRecibida?: number; // acumulado recibido — undefined = sin recepción registrada
}

// Hecho operacional de abastecimiento (purchases-domain-foundations.md §"Hecho operacional")
// Puede existir antes del documento, antes del pago, antes de validación tributaria
export interface CompraOperacional {
  purchaseId: string;
  timestamp: number;
  runtimeId: string;
  causa: string;          // causalidad mínima: "abastecimiento", "urgente", etc.
  proveedor?: string;     // nombre libre — sin maestro enterprise en CAPA 0
  referencia?: string;    // boleta, factura, nota o referencia informal
  lineas: LineaCompra[];
  estado: EstadoCompra;
  observacion?: string;   // contexto libre adicional
}
