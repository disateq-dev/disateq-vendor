const LS_KEY = "disateq.config.ops";

export type OpsConfig = {
  ctgPin: string;
};

const DEFAULTS: OpsConfig = {
  ctgPin: "1234",
};

export function loadOpsConfig(): OpsConfig {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<OpsConfig>;
    return {
      ctgPin: typeof p.ctgPin === "string" && /^\d{4,8}$/.test(p.ctgPin) ? p.ctgPin : DEFAULTS.ctgPin,
    };
  } catch { return DEFAULTS; }
}

export function saveOpsConfig(c: OpsConfig): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch { /* quota */ }
}
