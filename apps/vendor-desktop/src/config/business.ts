import type { Rubro } from "../data/catalogs";

const LS_KEY = "disateq.config.business";

export type BusinessConfig = {
  nombreComercial: string;
  alias:           string;
  ruc:             string;
  razonSocial:     string;
  direccion:       string;
  telefono:        string;
  tasaIGV:         number;
  rubro:           Rubro;
};

const DEFAULTS: BusinessConfig = {
  nombreComercial: "ALMACEN DE ABARROTES PEÑA",
  alias:           "Tienda Mercado Central",
  ruc:             "20608399349",
  razonSocial:     "CONSORCIO PEÑA S.A.C.",
  direccion:       "",
  telefono:        "",
  tasaIGV:         0.18,
  rubro:           "abarrotes",
};

export function loadBusinessConfig(): BusinessConfig {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<BusinessConfig>;
    return {
      nombreComercial: typeof p.nombreComercial === "string" ? p.nombreComercial : DEFAULTS.nombreComercial,
      alias:           typeof p.alias           === "string" ? p.alias           : DEFAULTS.alias,
      ruc:             typeof p.ruc             === "string" ? p.ruc             : DEFAULTS.ruc,
      razonSocial:     typeof p.razonSocial     === "string" ? p.razonSocial     : DEFAULTS.razonSocial,
      direccion:       typeof p.direccion       === "string" ? p.direccion       : DEFAULTS.direccion,
      telefono:        typeof p.telefono        === "string" ? p.telefono        : DEFAULTS.telefono,
      tasaIGV:         typeof p.tasaIGV         === "number" ? p.tasaIGV         : DEFAULTS.tasaIGV,
      rubro:           (p.rubro === "abarrotes" || p.rubro === "food-fast" || p.rubro === "panaderia" || p.rubro === "farmacia" || p.rubro === "optica" || p.rubro === "zapateria" || p.rubro === "reparacion" || p.rubro === "celulares") ? p.rubro as Rubro : DEFAULTS.rubro,
    };
  } catch { return DEFAULTS; }
}

export function saveBusinessConfig(c: BusinessConfig): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch { /* quota */ }
}
