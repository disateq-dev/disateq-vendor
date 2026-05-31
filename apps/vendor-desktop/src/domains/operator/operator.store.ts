export type OperatorStatus = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

export type BlockAssignment = {
  assignedAt: string;
  releasedAt?: string;
};

export type OperatorRecord = {
  id: string;
  operatorCode: string;   // OP001, OP023... — referencia documental estable, inmutable
  code: string;
  alias: string;          // FTEJADA, CRAMIREZ... — representación operacional visible
  apellidos: string;
  nombres: string;
  name: string;           // derivado: "${nombres} ${apellidos}"
  dni?: string;
  telefono?: string;
  roleCode: string;
  roleName: string;
  blockBase: number | null;
  blockAssignment?: BlockAssignment;
  status: OperatorStatus;
  statusReason?: string;
  statusAt?: string;
  pin: string;
  capabilities?: string[];
  registeredAt: string;
  registeredBy: string;
};

const LS_KEY = "disateq.pos.operators";

const SEED: OperatorRecord[] = [
  {
    id: "op1", operatorCode: "OP001", code: "FER", alias: "FER",
    apellidos: "TORRES GUZMÁN", nombres: "GABRIEL", name: "GABRIEL TORRES GUZMÁN",
    dni: "", telefono: "",
    roleCode: "VEN", roleName: "Cajero",
    blockBase: 100, blockAssignment: { assignedAt: "2024-01-10T08:00:00.000Z" },
    status: "ACTIVO", pin: "1000", capabilities: [],
    registeredAt: "2024-01-10T08:00:00.000Z", registeredBy: "SISTEMA",
  },
  {
    id: "op2", operatorCode: "OP002", code: "CAR", alias: "CAR",
    apellidos: "SALINAS PÉREZ", nombres: "CARLOS ALBERTO", name: "CARLOS ALBERTO SALINAS PÉREZ",
    dni: "", telefono: "",
    roleCode: "VEN", roleName: "Cajero",
    blockBase: 200, blockAssignment: { assignedAt: "2024-03-15T09:30:00.000Z" },
    status: "ACTIVO", pin: "2000", capabilities: [],
    registeredAt: "2024-03-15T09:30:00.000Z", registeredBy: "SISTEMA",
  },
  {
    id: "op3", operatorCode: "OP003", code: "LUC", alias: "LUC",
    apellidos: "MENDOZA QUISPE", nombres: "LUCÍA ELENA", name: "LUCÍA ELENA MENDOZA QUISPE",
    dni: "", telefono: "",
    roleCode: "VEN", roleName: "Cajero",
    blockBase: null, blockAssignment: { assignedAt: "2023-11-02T10:00:00.000Z", releasedAt: "2024-12-01T17:00:00.000Z" },
    status: "INACTIVO", statusReason: "Renuncia voluntaria", statusAt: "2024-12-01T17:00:00.000Z",
    pin: "", capabilities: [],
    registeredAt: "2023-11-02T10:00:00.000Z", registeredBy: "SISTEMA",
  },
  {
    id: "op4", operatorCode: "OP004", code: "ADM", alias: "ADM",
    apellidos: "", nombres: "ADMIN", name: "ADMIN",
    dni: "", telefono: "",
    roleCode: "ADM", roleName: "Supervisión operacional",
    blockBase: null,
    status: "ACTIVO", pin: "9999", capabilities: [],
    registeredAt: "2024-01-10T08:00:00.000Z", registeredBy: "SISTEMA",
  },
  {
    id: "op5", operatorCode: "OP005", code: "MDELGADO", alias: "MDELGADO",
    apellidos: "DELGADO SALAZAR", nombres: "MIGUEL ÁNGEL", name: "MIGUEL ÁNGEL DELGADO SALAZAR",
    dni: "73456789", telefono: "+51 987 123 456",
    roleCode: "CNT", roleName: "Regularización operacional",
    blockBase: 500, blockAssignment: { assignedAt: "2026-05-31T10:00:00.000Z" },
    status: "ACTIVO", pin: "5000",
    capabilities: ["observar_continuidad"],
    registeredAt: "2026-05-31T10:00:00.000Z", registeredBy: "OP004",
  },
];

export function loadOperators(): OperatorRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      localStorage.setItem(LS_KEY, JSON.stringify(SEED));
      return SEED;
    }
    const arr = JSON.parse(raw) as Array<Record<string, unknown>>;
    if (!Array.isArray(arr) || arr.length === 0) return SEED;
    return arr.map(o => ({
      id:              typeof o.id           === "string"  ? o.id           : String(Date.now()),
      operatorCode:    typeof o.operatorCode === "string"  ? o.operatorCode  : "",
      code:            typeof o.code         === "string"  ? o.code         : "",
      alias:           typeof o.alias        === "string"  ? o.alias        : (typeof o.code === "string" ? o.code : ""),
      apellidos:       typeof o.apellidos    === "string"  ? o.apellidos    : "",
      nombres:         typeof o.nombres      === "string"  ? o.nombres      : (typeof o.name === "string" ? o.name : ""),
      name:            typeof o.name         === "string"  ? o.name         : "",
      dni:             typeof o.dni          === "string"  ? o.dni          : undefined,
      telefono:        typeof o.telefono     === "string"  ? o.telefono     : undefined,
      roleCode:        typeof o.roleCode === "string"  ? o.roleCode : "VEN",
      roleName:        typeof o.roleName === "string"  ? o.roleName : "Cajero",
      blockBase:       typeof o.blockBase === "number" ? o.blockBase : null,
      blockAssignment: (o.blockAssignment && typeof o.blockAssignment === "object") ? o.blockAssignment as BlockAssignment : undefined,
      // Migration: if status missing but active present, derive
      status:          (o.status === "ACTIVO" || o.status === "INACTIVO" || o.status === "SUSPENDIDO")
                         ? o.status as OperatorStatus
                         : (o.active === false ? "INACTIVO" : "ACTIVO"),
      statusReason:    typeof o.statusReason === "string" ? o.statusReason : undefined,
      statusAt:        typeof o.statusAt     === "string" ? o.statusAt     : undefined,
      pin:             typeof o.pin === "string" ? o.pin : "",
      capabilities:    Array.isArray(o.capabilities) ? o.capabilities as string[] : [],
      registeredAt:    typeof o.registeredAt === "string" ? o.registeredAt : "",
      registeredBy:    typeof o.registeredBy === "string" ? o.registeredBy : "SISTEMA",
    }));
  } catch { return SEED; }
}

export function saveOperators(ops: OperatorRecord[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ops)); } catch { }
}

export function checkPin(ops: OperatorRecord[], id: string, pin: string): boolean {
  const op = ops.find(o => o.id === id);
  return !!op && op.status === "ACTIVO" && op.pin.length >= 4 && op.pin === pin;
}

export function changePin(ops: OperatorRecord[], id: string, currentPin: string, newPin: string): OperatorRecord[] | null {
  const op = ops.find(o => o.id === id);
  if (!op || op.status !== "ACTIVO" || op.pin !== currentPin) return null;
  return ops.map(o => o.id === id ? { ...o, pin: newPin } : o);
}

export function setOperatorPin(ops: OperatorRecord[], id: string, newPin: string): OperatorRecord[] | null {
  const op = ops.find(o => o.id === id);
  if (!op || op.status === "INACTIVO") return null;
  return ops.map(o => o.id === id ? { ...o, pin: newPin } : o);
}

export function setCapabilities(ops: OperatorRecord[], id: string, capabilities: string[]): OperatorRecord[] {
  return ops.map(o => o.id === id ? { ...o, capabilities } : o);
}

// Returns true if blockBase is already assigned to another active/suspended operator (excludeId = self)
export function isBlockTaken(ops: OperatorRecord[], blockBase: number, excludeId?: string): boolean {
  return ops.some(o =>
    o.id !== excludeId &&
    o.blockBase === blockBase &&
    o.status !== "INACTIVO"
  );
}

// Assign blockBase to operator — fails if taken by another active/suspended operator
export function assignBlock(ops: OperatorRecord[], id: string, blockBase: number): OperatorRecord[] | null {
  if (isBlockTaken(ops, blockBase, id)) return null;
  return ops.map(o => o.id === id ? {
    ...o,
    blockBase,
    blockAssignment: { assignedAt: new Date().toISOString() },
  } : o);
}

// Release block from operator — sets blockAssignment.releasedAt, clears blockBase
export function releaseBlock(ops: OperatorRecord[], id: string): OperatorRecord[] {
  return ops.map(o => o.id === id ? {
    ...o,
    blockBase: null,
    blockAssignment: o.blockAssignment
      ? { ...o.blockAssignment, releasedAt: new Date().toISOString() }
      : { assignedAt: new Date().toISOString(), releasedAt: new Date().toISOString() },
  } : o);
}

// ── código operador ─────────────────────────────────────────────────────────

// Genera el siguiente código operador: OP001, OP002... hasta OP999.
// Deriva desde el máximo existente — resiliente ante reset de localStorage.
export function nextOperatorCode(existingOps: OperatorRecord[]): string {
  const max = existingOps.reduce((acc, op) => {
    const m = op.operatorCode.match(/^OP(\d+)$/);
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc;
  }, 0);
  return `OP${String(max + 1).padStart(3, "0")}`;
}

export function isOperatorCodeTaken(ops: OperatorRecord[], operatorCode: string, excludeId?: string): boolean {
  return ops.some(o => o.id !== excludeId && o.operatorCode === operatorCode && o.operatorCode !== "");
}

// ── alias operacional ───────────────────────────────────────────────────────

// Genera alias base: <InicialPrimerNombre><PrimerApellido>
// Requiere nombres y apellidos separados para derivación correcta.
// Ejemplo: nombres="Fernando Miguel" apellidos="Tejada Quevedo" → "FTEJADA"
export function generateAlias(nombres: string, apellidos: string): string {
  const n = nombres.trim().toUpperCase().split(/\s+/);
  const a = apellidos.trim().toUpperCase().split(/\s+/);
  const inicial       = n[0]?.[0] ?? "";
  const primerApellido = a[0] ?? "";
  return inicial + primerApellido;
}

// Resuelve colisión usando la inicial del segundo apellido.
// Si la colisión persiste, devuelve el base — resolución manual requerida.
// No genera sufijos numéricos: FTEJADA_2 reduce legibilidad operacional.
export function resolveAlias(
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

export function isAliasTaken(ops: OperatorRecord[], alias: string, excludeId?: string): boolean {
  return ops.some(o => o.id !== excludeId && o.alias === alias && o.status !== "INACTIVO");
}
