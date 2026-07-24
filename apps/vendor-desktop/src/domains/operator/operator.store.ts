export type EstadoOperador = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

export type AsignacionBloque = {
  assignedAt: string;
  releasedAt?: string;
};

export type Operador = {
  id: string;
  codigoOperador: string;
  alias: string;
  apellidos: string;
  nombres: string;
  nombreCompleto: string;
  dni?: string;
  telefono?: string;
  codigoRol: string;
  nombreRol: string;
  baseBloque: number | null;
  asignacionBloque?: AsignacionBloque;
  estado: EstadoOperador;
  motivoEstado?: string;
  fechaEstado?: string;
  pin: string;
  capacidades?: string[];
  registradoEn: string;
  registradoPor: string;
};

export async function hashPinAsync(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin + ":disateq-vendor");
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export function verificarPin(ops: Operador[], id: string, pinHash: string): boolean {
  const op = ops.find(o => o.id === id);
  return !!op && op.estado === "ACTIVO" && op.pin.length === 64 && op.pin === pinHash;
}

export function estaBloqueOcupado(ops: Operador[], baseBloque: number, excludeId?: string): boolean {
  return ops.some(o =>
    o.id !== excludeId &&
    o.baseBloque === baseBloque &&
    o.estado !== "INACTIVO"
  );
}

export function siguienteCodigoOperador(existingOps: Operador[]): string {
  const max = existingOps.reduce((acc, op) => {
    const m = op.codigoOperador.match(/^OP(\d+)$/);
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc;
  }, 0);
  return `OP${String(max + 1).padStart(3, "0")}`;
}

export function estaCodigoOperadorOcupado(ops: Operador[], codigoOperador: string, excludeId?: string): boolean {
  return ops.some(o => o.id !== excludeId && o.codigoOperador === codigoOperador && o.codigoOperador !== "");
}

export function generarAlias(nombres: string, apellidos: string): string {
  const n = nombres.trim().toUpperCase().split(/\s+/);
  const a = apellidos.trim().toUpperCase().split(/\s+/);
  const inicial        = n[0]?.[0] ?? "";
  const primerApellido = a[0] ?? "";
  return inicial + primerApellido;
}

export function resolverAlias(
  base: string,
  apellidos: string,
  existingAliases: string[],
): string {
  if (!existingAliases.includes(base)) return base;
  const a = apellidos.trim().toUpperCase().split(/\s+/);
  const inicialSegundo = a[1]?.[0] ?? "";
  if (inicialSegundo) {
    const candidate = `${base}_${inicialSegundo}`;
    if (!existingAliases.includes(candidate)) return candidate;
  }
  return base;
}

export function estaAliasOcupado(ops: Operador[], alias: string, excludeId?: string): boolean {
  return ops.some(o => o.id !== excludeId && o.alias === alias && o.estado !== "INACTIVO");
}
