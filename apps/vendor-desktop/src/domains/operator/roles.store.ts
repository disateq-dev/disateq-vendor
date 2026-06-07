export type Rol = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  capacidades: string[];
  requiereBloque: boolean;
  activo: boolean;
  creadoEn: string;
  creadoPor: string;
};

const LS_KEY      = "disateq:roles";
const LS_V_KEY    = "disateq:roles:v";
const SEED_VERSION = "3";

const SEED: Rol[] = [
  {
    id: "role-ven", codigo: "VEN", nombre: "Ventas",
    descripcion: "Operación de venta — apertura de turno, cobro, emisión de comprobantes",
    capacidades: ["gestionar_clientes"],
    requiereBloque: true,
    activo: true, creadoEn: "2024-01-15T09:00:00.000Z", creadoPor: "SISTEMA",
  },
  {
    id: "role-ges", codigo: "GES", nombre: "Gestor",
    descripcion: "Gestión integral de la operación — supervisa, interviene y puede operar en emergencia",
    capacidades: [
      "observar_comprobantes_global","anular_comprobantes",
      "corregir_arqueos","reaperturar_cierres","regularizar_incidencias",
      "observar_continuidad","ver_reportes",
      "gestionar_clientes","gestionar_inventarios","gestionar_compras"
    ],
    requiereBloque: false,
    activo: true, creadoEn: "2024-01-10T08:30:00.000Z", creadoPor: "SISTEMA",
  },
  {
    id: "role-sop", codigo: "SOP", nombre: "Soporte",
    descripcion: "Asistencia técnica y diagnóstico operacional",
    capacidades: ["observar_continuidad"],
    requiereBloque: false,
    activo: true, creadoEn: "2026-04-03T16:45:00.000Z", creadoPor: "SISTEMA",
  },
  {
    id: "role-adm", codigo: "ADMIN", nombre: "Administrador",
    descripcion: "Acceso total al sistema — crea operadores, define roles y asigna capacidades",
    capacidades: ["acceso_total"],
    requiereBloque: false,
    activo: true, creadoEn: "2024-01-01T00:00:00.000Z", creadoPor: "SISTEMA",
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
      id:             typeof o.id === "string" ? o.id : String(Date.now()),
      codigo:         typeof o.codigo === "string" ? o.codigo : (typeof o.code === "string" ? o.code : ""),
      nombre:         typeof o.nombre === "string" ? o.nombre : (typeof o.name === "string" ? o.name : ""),
      descripcion:    typeof o.descripcion === "string" ? o.descripcion : (typeof o.description === "string" ? o.description : ""),
      capacidades:    Array.isArray(o.capacidades) ? o.capacidades as string[] : (Array.isArray(o.capabilities) ? o.capabilities as string[] : []),
      requiereBloque: typeof o.requiereBloque === "boolean" ? o.requiereBloque : false,
      activo:         typeof o.activo === "boolean" ? o.activo : (typeof o.active === "boolean" ? o.active : true),
      creadoEn:       typeof o.creadoEn === "string" ? o.creadoEn : (typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString()),
      creadoPor:      typeof o.creadoPor === "string" ? o.creadoPor : (typeof o.createdBy === "string" ? o.createdBy : ""),
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
