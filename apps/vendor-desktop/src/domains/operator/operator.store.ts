export type OperatorStatus = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

export type BlockAssignment = {
  assignedAt: string;
  releasedAt?: string;
};

export type OperatorRecord = {
  id: string;
  code: string;
  name: string;
  roleCode: string;
  roleName: string;
  blockBase: number | null;
  blockAssignment?: BlockAssignment;
  status: OperatorStatus;
  pin: string;
};

const LS_KEY = "disateq.pos.operators";

const SEED: OperatorRecord[] = [
  { id: "op1", code: "FER", name: "FERNANDO", roleCode: "VEN", roleName: "Vendedor",      blockBase: 100,  blockAssignment: { assignedAt: "2024-01-10T08:00:00.000Z" }, status: "ACTIVO",   pin: "1000" },
  { id: "op2", code: "CAR", name: "CARLOS",   roleCode: "VEN", roleName: "Vendedor",      blockBase: 200,  blockAssignment: { assignedAt: "2024-03-15T09:30:00.000Z" }, status: "ACTIVO",   pin: "2000" },
  { id: "op3", code: "LUC", name: "LUCÍA",    roleCode: "VEN", roleName: "Vendedor",      blockBase: 300,  blockAssignment: { assignedAt: "2023-11-02T10:00:00.000Z", releasedAt: "2024-12-01T17:00:00.000Z" }, status: "INACTIVO", pin: "" },
  { id: "op4", code: "ADM", name: "ADMIN",    roleCode: "ADM", roleName: "Administrador", blockBase: null, status: "ACTIVO",   pin: "9999" },
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
      id:              typeof o.id       === "string"  ? o.id       : String(Date.now()),
      code:            typeof o.code     === "string"  ? o.code     : "",
      name:            typeof o.name     === "string"  ? o.name     : "",
      roleCode:        typeof o.roleCode === "string"  ? o.roleCode : "VEN",
      roleName:        typeof o.roleName === "string"  ? o.roleName : "Vendedor",
      blockBase:       typeof o.blockBase === "number" ? o.blockBase : null,
      blockAssignment: (o.blockAssignment && typeof o.blockAssignment === "object") ? o.blockAssignment as BlockAssignment : undefined,
      // Migration: if status missing but active present, derive
      status:          (o.status === "ACTIVO" || o.status === "INACTIVO" || o.status === "SUSPENDIDO")
                         ? o.status as OperatorStatus
                         : (o.active === false ? "INACTIVO" : "ACTIVO"),
      pin:             typeof o.pin === "string" ? o.pin : "",
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
