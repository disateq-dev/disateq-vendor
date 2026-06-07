const LS_KEY = "disateq.config.business";

export type BusinessConfig = {
  nombreComercial: string;
  alias:           string;
  ruc:             string;
  razonSocial:     string;
  direccion:       string;
  telefono:        string;
  tasaIGV:         number;
};

const DEFAULTS: BusinessConfig = {
  nombreComercial: "ALMACEN DE ABARROTES PEÑA",
  alias:           "Tienda Mercado Central",
  ruc:             "20608399349",
  razonSocial:     "CONSORCIO PEÑA S.A.C.",
  direccion:       "",
  telefono:        "",
  tasaIGV:         0.18,
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
    };
  } catch { return DEFAULTS; }
}

export function saveBusinessConfig(c: BusinessConfig): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch { /* quota */ }
}
