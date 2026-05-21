export type OperatorRecord = {
  id: string;
  code: string;
  name: string;
  roleCode: string;
  roleName: string;
  blockBase: number | null;
  active: boolean;
  pin: string;
};

const LS_KEY = "disateq.pos.operators";

const SEED: OperatorRecord[] = [
  { id: "op1", code: "FER", name: "FERNANDO", roleCode: "VEN", roleName: "Vendedor",      blockBase: 100,  active: true,  pin: "1000" },
  { id: "op2", code: "CAR", name: "CARLOS",   roleCode: "VEN", roleName: "Vendedor",      blockBase: 200,  active: true,  pin: "2000" },
  { id: "op3", code: "LUC", name: "LUCÍA",    roleCode: "VEN", roleName: "Vendedor",      blockBase: 300,  active: false, pin: ""     },
  { id: "op4", code: "ADM", name: "ADMIN",    roleCode: "ADM", roleName: "Administrador", blockBase: null, active: true,  pin: "9999" },
];

export function loadOperators(): OperatorRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      localStorage.setItem(LS_KEY, JSON.stringify(SEED));
      return SEED;
    }
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length > 0 ? (arr as OperatorRecord[]) : SEED;
  } catch { return SEED; }
}

export function saveOperators(ops: OperatorRecord[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ops)); } catch { }
}

export function checkPin(ops: OperatorRecord[], id: string, pin: string): boolean {
  const op = ops.find(o => o.id === id);
  return !!op && op.active && op.pin.length >= 4 && op.pin === pin;
}

export function changePin(ops: OperatorRecord[], id: string, currentPin: string, newPin: string): OperatorRecord[] | null {
  const op = ops.find(o => o.id === id);
  if (!op || !op.active || op.pin !== currentPin) return null;
  return ops.map(o => o.id === id ? { ...o, pin: newPin } : o);
}

export function setOperatorPin(ops: OperatorRecord[], id: string, newPin: string): OperatorRecord[] | null {
  const op = ops.find(o => o.id === id);
  if (!op || !op.active) return null;
  return ops.map(o => o.id === id ? { ...o, pin: newPin } : o);
}
