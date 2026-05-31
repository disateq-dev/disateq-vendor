export type RoleRecord = {
  id: string;
  code: string;
  name: string;
  description: string;
  capabilities: string[];
  active: boolean;
  createdAt: string;
  createdBy: string;
};

const LS_KEY      = "disateq.pos.roles";
const LS_V_KEY    = "disateq.pos.roles.v";
const SEED_VERSION = "2";

const SEED: RoleRecord[] = [
  {
    id: "role-ven", code: "VEN", name: "Ventas",
    description: "Operación normal de venta",
    capabilities: [],
    active: true, createdAt: "2024-01-15T09:00:00.000Z", createdBy: "FERNANDO",
  },
  {
    id: "role-sup", code: "SUP", name: "Supervisión",
    description: "Supervisión integral de la operación",
    capabilities: ["corregir_arqueos","reaperturar_cierres","regularizar_incidencias","observar_comprobantes_global","anular_comprobantes","observar_continuidad"],
    active: true, createdAt: "2024-01-10T08:30:00.000Z", createdBy: "FERNANDO",
  },
  {
    id: "role-ges", code: "GES", name: "Gestión",
    description: "Operación comercial ampliada",
    capabilities: ["observar_comprobantes_global","observar_continuidad"],
    active: true, createdAt: "2025-03-08T14:20:00.000Z", createdBy: "CARLOS",
  },
  {
    id: "role-aud", code: "AUD", name: "Auditoría",
    description: "Observación, revisión y validación operacional",
    capabilities: ["observar_comprobantes_global","observar_continuidad"],
    active: true, createdAt: "2025-11-22T10:05:00.000Z", createdBy: "FERNANDO",
  },
  {
    id: "role-sop", code: "SOP", name: "Soporte",
    description: "Asistencia, diagnóstico y continuidad operacional",
    capabilities: ["observar_continuidad"],
    active: true, createdAt: "2026-04-03T16:45:00.000Z", createdBy: "ADMIN",
  },
];

export function loadRoles(): RoleRecord[] {
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
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return SEED;
    return arr.map(o => ({
      id:           typeof o.id          === "string" ? o.id          : String(Date.now()),
      code:         typeof o.code        === "string" ? o.code        : "",
      name:         typeof o.name        === "string" ? o.name        : "",
      description:  typeof o.description === "string" ? o.description : "",
      capabilities: Array.isArray(o.capabilities)     ? o.capabilities as string[] : [],
      active:       typeof o.active      === "boolean" ? o.active     : true,
      createdAt:    typeof o.createdAt   === "string" ? o.createdAt   : new Date().toISOString(),
      createdBy:    typeof o.createdBy   === "string" ? o.createdBy   : "",
    }));
  } catch { return SEED; }
}

export function saveRoles(roles: RoleRecord[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(roles)); } catch { }
}

export function setRoleCapabilities(roles: RoleRecord[], id: string, capabilities: string[]): RoleRecord[] {
  return roles.map(r => r.id === id ? { ...r, capabilities } : r);
}

export function isRoleCodeTaken(roles: RoleRecord[], code: string, excludeId?: string): boolean {
  return roles.some(r => r.id !== excludeId && r.code === code);
}
