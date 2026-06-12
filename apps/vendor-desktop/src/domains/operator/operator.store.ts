export type EstadoOperador = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

export type AsignacionBloque = {
  assignedAt: string;
  releasedAt?: string;
};

export type Operador = {
  id: string;
  codigoOperador: string;
  codigo: string;
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

function esHash(s: string): boolean {
  return s.length === 64 && /^[0-9a-f]+$/.test(s);
}

const LS_KEY      = "disateq:operators";
const LS_V_KEY    = "disateq:operators:v";
const SEED_VERSION = "6";

const SEED: Operador[] = [
  {
    id: "op1", codigoOperador: "OP001", codigo: "FTEJADA", alias: "FTEJADA",
    apellidos: "TEJADA QUEVEDO", nombres: "FERNANDO MIGUEL", nombreCompleto: "FERNANDO MIGUEL TEJADA QUEVEDO",
    dni: "", telefono: "",
    codigoRol: "ADMIN", nombreRol: "Administrador",
    baseBloque: 900,
    estado: "ACTIVO", pin: "b9776d7ddf459c9ad5b0e1d6ac61e27befb5e99fd62446677600d7472e88a8cc",
    capacidades: [
      "corregir_arqueos","reaperturar_cierres","regularizar_incidencias",
      "observar_comprobantes_global","anular_comprobantes","observar_continuidad",
      "gestionar_operadores","gestionar_roles","gestionar_capacidades",
      "gestionar_cajas","gestionar_inventarios","gestionar_compras",
      "gestionar_clientes","ver_reportes","acceso_total"
    ],
    registradoEn: "2026-05-31T22:26:30.542Z", registradoPor: "SISTEMA",
  },
];

export function cargarOperadores(): Operador[] {
  try {
    if (localStorage.getItem(LS_V_KEY) !== SEED_VERSION) {
      localStorage.setItem(LS_KEY, JSON.stringify(SEED));
      localStorage.setItem(LS_V_KEY, SEED_VERSION);
      return SEED;
    }
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      localStorage.setItem(LS_KEY, JSON.stringify(SEED));
      return SEED;
    }
    const arr = JSON.parse(raw) as Array<Record<string, unknown>>;
    if (!Array.isArray(arr) || arr.length === 0) return SEED;
    return arr.map(o => ({
      id:               typeof o.id === "string" ? o.id : String(Date.now()),
      codigoOperador:   typeof o.codigoOperador === "string" ? o.codigoOperador : (typeof o.operatorCode === "string" ? o.operatorCode : ""),
      codigo:           typeof o.codigo === "string" ? o.codigo : (typeof o.code === "string" ? o.code : ""),
      alias:            typeof o.alias === "string" ? o.alias : (typeof o.codigo === "string" ? o.codigo : (typeof o.code === "string" ? o.code : "")),
      apellidos:        typeof o.apellidos === "string" ? o.apellidos : "",
      nombres:          typeof o.nombres === "string" ? o.nombres : (typeof o.name === "string" ? o.name : ""),
      nombreCompleto:   typeof o.nombreCompleto === "string" ? o.nombreCompleto : (typeof o.name === "string" ? o.name : ""),
      dni:              typeof o.dni === "string" ? o.dni : undefined,
      telefono:         typeof o.telefono === "string" ? o.telefono : undefined,
      codigoRol:        typeof o.codigoRol === "string" ? o.codigoRol : (typeof o.roleCode === "string" ? o.roleCode : "VEN"),
      nombreRol:        typeof o.nombreRol === "string" ? o.nombreRol : (typeof o.roleName === "string" ? o.roleName : "Ventas"),
      baseBloque:       typeof o.baseBloque === "number" ? o.baseBloque : (typeof o.blockBase === "number" ? o.blockBase : null),
      asignacionBloque: (o.asignacionBloque && typeof o.asignacionBloque === "object")
        ? o.asignacionBloque as AsignacionBloque
        : ((o.blockAssignment && typeof o.blockAssignment === "object") ? o.blockAssignment as AsignacionBloque : undefined),
      estado:           (o.estado === "ACTIVO" || o.estado === "INACTIVO" || o.estado === "SUSPENDIDO")
        ? o.estado as EstadoOperador
        : ((o.status === "ACTIVO" || o.status === "INACTIVO" || o.status === "SUSPENDIDO")
          ? o.status as EstadoOperador
          : (o.active === false ? "INACTIVO" : "ACTIVO")),
      motivoEstado:     typeof o.motivoEstado === "string" ? o.motivoEstado : (typeof o.statusReason === "string" ? o.statusReason : undefined),
      fechaEstado:      typeof o.fechaEstado === "string" ? o.fechaEstado : (typeof o.statusAt === "string" ? o.statusAt : undefined),
      pin:              typeof o.pin === "string" ? o.pin : "",
      _pinNeedsHash:    typeof o.pin === "string" && !esHash(o.pin) ? true : undefined,
      capacidades:      Array.isArray(o.capacidades) ? o.capacidades as string[] : (Array.isArray(o.capabilities) ? o.capabilities as string[] : []),
      registradoEn:     typeof o.registradoEn === "string" ? o.registradoEn : (typeof o.registeredAt === "string" ? o.registeredAt : ""),
      registradoPor:    typeof o.registradoPor === "string" ? o.registradoPor : (typeof o.registeredBy === "string" ? o.registeredBy : "SISTEMA"),
    }));
  } catch { return SEED; }
}

export function guardarOperadores(ops: Operador[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ops)); } catch { }
}

export async function migrarPinsOperadores(ops: Operador[]): Promise<Operador[]> {
  const sinHash = ops.filter(o => !esHash(o.pin) && o.pin.length > 0);
  if (sinHash.length === 0) return ops;
  const migrados = await Promise.all(
    ops.map(async o => {
      if (!esHash(o.pin) && o.pin.length > 0) {
        return { ...o, pin: await hashPinAsync(o.pin) };
      }
      return o;
    })
  );
  return migrados;
}

export function verificarPin(ops: Operador[], id: string, pinHash: string): boolean {
  const op = ops.find(o => o.id === id);
  return !!op && op.estado === "ACTIVO" && op.pin.length === 64 && op.pin === pinHash;
}

export function cambiarPin(ops: Operador[], id: string, currentPinHash: string, newPinHash: string): Operador[] | null {
  const op = ops.find(o => o.id === id);
  if (!op || op.estado !== "ACTIVO" || op.pin !== currentPinHash) return null;
  return ops.map(o => o.id === id ? { ...o, pin: newPinHash } : o);
}

export function establecerPin(ops: Operador[], id: string, newPinHash: string): Operador[] | null {
  const op = ops.find(o => o.id === id);
  if (!op || op.estado === "INACTIVO") return null;
  return ops.map(o => o.id === id ? { ...o, pin: newPinHash } : o);
}

export function establecerCapacidades(ops: Operador[], id: string, capacidades: string[]): Operador[] {
  return ops.map(o => o.id === id ? { ...o, capacidades } : o);
}

export function estaBloqueOcupado(ops: Operador[], baseBloque: number, excludeId?: string): boolean {
  return ops.some(o =>
    o.id !== excludeId &&
    o.baseBloque === baseBloque &&
    o.estado !== "INACTIVO"
  );
}

export function asignarBloque(ops: Operador[], id: string, baseBloque: number): Operador[] | null {
  if (estaBloqueOcupado(ops, baseBloque, id)) return null;
  return ops.map(o => o.id === id ? {
    ...o,
    baseBloque,
    asignacionBloque: { assignedAt: new Date().toISOString() },
  } : o);
}

export function liberarBloque(ops: Operador[], id: string): Operador[] {
  return ops.map(o => o.id === id ? {
    ...o,
    baseBloque: null,
    asignacionBloque: o.asignacionBloque
      ? { ...o.asignacionBloque, releasedAt: new Date().toISOString() }
      : { assignedAt: new Date().toISOString(), releasedAt: new Date().toISOString() },
  } : o);
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
