import { usePOS } from "../context/POSContext";

/**
 * Evalúa si el operador activo tiene una capacidad específica.
 * El valor "acceso_total" es bypass universal.
 */
export function useCapacidad(capacidad: string): boolean {
  const { activeOperator } = usePOS();
  if (!activeOperator) return false;
  const caps = activeOperator.capacidades ?? [];
  return caps.includes("acceso_total") || caps.includes(capacidad);
}

/**
 * Evalúa si el operador activo tiene TODAS las capacidades indicadas.
 * El valor "acceso_total" es bypass universal.
 */
export function useCapacidades(capacidades: string[]): boolean {
  const { activeOperator } = usePOS();
  if (!activeOperator) return false;
  const caps = activeOperator.capacidades ?? [];
  if (caps.includes("acceso_total")) return true;
  return capacidades.every(c => caps.includes(c));
}
