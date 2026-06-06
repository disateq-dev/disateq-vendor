export type Rol = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  capacidades: string[];
  activo: boolean;
  creadoEn: string;
  creadoPor: string;
};

const LS_KEY      = "disateq:roles";
const LS_V_KEY    = "disateq:roles:v";
const SEED_VERSION = "2";

const SEED: Rol[] = [
  {
    id: "role-ven", codigo: "VEN", nombre: "Ventas",
    descripcion: "Operación normal de venta",
    capacidades: [],
    activo: true, creadoEn: "2024-01-15T09:00:00.000Z", creadoPor: "FERNANDO",
  },
  {
    id: "role-sup", codigo: "SUP", nombre: "Supervisión",
    descripcion: "Supervisión integral de la operación",
    capacidades: ["corregir_arqueos","reaperturar_cierres","regularizar_incidencias","observar_comprobantes_global","anular_comprobantes","observar_continuidad"],
    activo: true, creadoEn: "2024-01-10T08:30:00.000Z", creadoPor: "FERNANDO",
  },
  {
    id: "role-ges", codigo: "GES", nombre: "Gestión",
    descripcion: "Operación comercial ampliada",
    capacidades: ["observar_comprobantes_global","observar_continuidad"],
    activo: true, creadoEn: "2025-03-08T14:20:00.000Z", creadoPor: "CARLOS",
  },
  {
    id: "role-aud", codigo: "AUD", nombre: "Auditoría",
    descripcion: "Observación, revisión y validación operacional",
    capacidades: ["observar_comprobantes_global","observar_continuidad"],
    activo: true, creadoEn: "2025-11-22T10:05:00.000Z", creadoPor: "FERNANDO",
  },
  {
    id: "role-sop", codigo: "SOP", nombre: "Soporte",
    descripcion: "Asistencia, diagnóstico y continuidad operacional",
    capacidades: ["observar_continuidad"],
    activo: true, creadoEn: "2026-04-03T16:45:00.000Z", creadoPor: "ADMIN",
  },
];

export function cargarRoles(): Rol[] {
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
      id:          typeof o.id === "string" ? o.id : String(Date.now()),
      codigo:      typeof o.codigo === "string" ? o.codigo : (typeof o.code === "string" ? o.code : ""),
      nombre:      typeof o.nombre === "string" ? o.nombre : (typeof o.name === "string" ? o.name : ""),
      descripcion: typeof o.descripcion === "string" ? o.descripcion : (typeof o.description === "string" ? o.description : ""),
      capacidades: Array.isArray(o.capacidades) ? o.capacidades as string[] : (Array.isArray(o.capabilities) ? o.capabilities as string[] : []),
      activo:      typeof o.activo === "boolean" ? o.activo : (typeof o.active === "boolean" ? o.active : true),
      creadoEn:    typeof o.creadoEn === "string" ? o.creadoEn : (typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString()),
      creadoPor:   typeof o.creadoPor === "string" ? o.creadoPor : (typeof o.createdBy === "string" ? o.createdBy : ""),
    }));
  } catch { return SEED; }
}

export function guardarRoles(roles: Rol[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(roles)); } catch { }
}

export function establecerCapacidadesRol(roles: Rol[], id: string, capacidades: string[]): Rol[] {
  return roles.map(r => r.id === id ? { ...r, capacidades } : r);
}

export function estaCodigoRolOcupado(roles: Rol[], codigo: string, excludeId?: string): boolean {
  return roles.some(r => r.id !== excludeId && r.codigo === codigo);
}
