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

const LS_KEY = "disateq.pos.roles";

const SEED: RoleRecord[] = [
  {
    id: "role-ven", code: "VEN", name: "Cajero",
    description: "Venta y cobro en caja",
    capabilities: [],
    active: true, createdAt: "2024-01-15T09:00:00.000Z", createdBy: "FERNANDO",
  },
  {
    id: "role-adm", code: "ADM", name: "Supervisión operacional",
    description: "Acceso transversal a todos los dominios operacionales",
    capabilities: ["corregir_arqueos","reaperturar_cierres","regularizar_incidencias","observar_comprobantes_global","anular_comprobantes","observar_continuidad"],
    active: true, createdAt: "2024-01-10T08:30:00.000Z", createdBy: "FERNANDO",
  },
  {
    id: "role-gst", code: "GST", name: "Gestor operacional",
    description: "Abastecimiento e inventarios",
    capabilities: ["observar_comprobantes_global","observar_continuidad"],
    active: true, createdAt: "2025-03-08T14:20:00.000Z", createdBy: "CARLOS",
  },
  {
    id: "role-cnt", code: "CNT", name: "Regularización operacional",
    description: "Arqueos, comprobantes y regularización",
    capabilities: ["corregir_arqueos","reaperturar_cierres","regularizar_incidencias","observar_comprobantes_global","anular_comprobantes"],
    active: true, createdAt: "2025-11-22T10:05:00.000Z", createdBy: "FERNANDO",
  },
  {
    id: "role-spt", code: "SPT", name: "Soporte operacional",
    description: "Configuración y sistema",
    capabilities: [],
    active: false, createdAt: "2026-04-03T16:45:00.000Z", createdBy: "ADMIN",
  },
];

export function loadRoles(): RoleRecord[] {
  try {
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
