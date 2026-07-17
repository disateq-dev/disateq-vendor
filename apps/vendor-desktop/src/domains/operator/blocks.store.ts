export type TipoCaja = "PRINCIPAL" | "AUXILIAR" | "EXCEPCIONAL";

export interface DefinicionCaja {
  codigo: string;
  tipoCaja: TipoCaja;
}

export interface BloqueOperacional {
  id: string;
  base: number;
  auxiliares: number;
  activo: boolean;
  creadoEn: string;
  creadoPor: string;
  modificadoEn: string;
}

export const BLOCK_BASES: readonly number[] = [100, 200, 300, 400, 500, 900];

export function definirCajasDeBloque(bases: readonly number[] = BLOCK_BASES): DefinicionCaja[] {
  const auxiliares = 2;

  return bases.flatMap(base => [
    { codigo: String(base), tipoCaja: "PRINCIPAL" },
    ...Array.from({ length: auxiliares }, (_, indice) => ({
      codigo: String(base + indice + 1),
      tipoCaja: "AUXILIAR" as const,
    })),
    { codigo: String(base + 50), tipoCaja: "EXCEPCIONAL" },
  ]);
}
