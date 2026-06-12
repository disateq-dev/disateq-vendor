export type BoxSlotType = "normal" | "contingency-1" | "contingency-2" | "contingencia";

export type BoxSlotDef = { code: string; type: BoxSlotType };

// Única fuente de verdad para bloques operacionales disponibles.
// Agregar un bloque aquí lo registra automáticamente en cajas y en el selector de operadores.
export const BLOCK_BASES = [100, 200, 300, 400, 500, 900] as const;

export type BlockBase = (typeof BLOCK_BASES)[number];

// Deriva las definiciones de slots para un conjunto de bloques.
// Patrón fijo: base (principal), base+1 (secundaria-1), base+2 (secundaria-2), base+50 (contingencia).
export function blockBoxDefs(bases: readonly number[] = BLOCK_BASES): BoxSlotDef[] {
  return bases.flatMap(b => [
    { code: String(b),      type: "normal"        },
    { code: String(b + 1),  type: "contingency-1" },
    { code: String(b + 2),  type: "contingency-2" },
    { code: String(b + 50), type: "contingencia"  },
  ]);
}
