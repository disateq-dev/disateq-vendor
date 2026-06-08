const LS_KEY = "disateq.config.ops";

export type OpsConfig = Record<string, never>;

export function loadOpsConfig(): OpsConfig {
  return {};
}

export function saveOpsConfig(_c: OpsConfig): void {
  try { localStorage.removeItem(LS_KEY); } catch { }
}
