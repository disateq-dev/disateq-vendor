import { usePOS } from "../context/POSContext";

export type ContextoOperacional = "bloque" | "general";

/**
 * Determina el contexto operacional del operador activo.
 *
 * "bloque"  → opera sobre su propia caja y turno (VEN, o GES con bloque asignado)
 * "general" → supervisa o gestiona el sistema completo (GES sin bloque, ADMIN, SOP)
 *
 * VEN siempre es bloque.
 * GES es bloque si tiene baseBloque asignado, general si no.
 * ADMIN y SOP siempre son general.
 * null si no hay operador activo.
 */
export function useContextoOperacional(): ContextoOperacional | null {
  const { activeOperator, roles } = usePOS();
  if (!activeOperator) return null;

  const rol = roles.find(r => r.codigo === activeOperator.codigoRol);
  if (!rol) return null;

  if (rol.requiereBloque) return "bloque";
  if (activeOperator.baseBloque !== null) return "bloque";
  return "general";
}
