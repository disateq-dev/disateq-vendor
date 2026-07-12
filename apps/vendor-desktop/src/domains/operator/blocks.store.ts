export type TipoCaja = "PRINCIPAL" | "CONTINGENCIA_1" | "CONTINGENCIA_2" | "CONTINGENCIA";

export type DefinicionCaja = { codigo: string; type: TipoCaja };

// Única fuente de verdad para bloques operacionales disponibles.
// Agregar un bloque aquí lo registra automáticamente en cajas y en el selector de operadores.
export const BLOCK_BASES = [100, 200, 300, 400, 500, 900] as const;

export type BlockBase = (typeof BLOCK_BASES)[number];

// Deriva las definiciones de slots para un conjunto de bloques.
// Patrón fijo: base (principal), base+1 (secundaria-1), base+2 (secundaria-2), base+50 (contingencia).
export function definirCajasDeBloque(bases: readonly number[] = BLOCK_BASES): DefinicionCaja[] {
  return bases.flatMap(b => [
    { codigo: String(b),      type: "PRINCIPAL"      },
    { codigo: String(b + 1),  type: "CONTINGENCIA_1" },
    { codigo: String(b + 2),  type: "CONTINGENCIA_2" },
    { codigo: String(b + 50), type: "CONTINGENCIA"   },
  ]);
}
