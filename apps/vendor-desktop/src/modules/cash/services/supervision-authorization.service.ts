const LS_KEY = "disateq.pos.cajaAuthorizations";

export type AuthorizationType =
  | "cierre_activo"
  | "cierre_extemporaneo"
  | "correccion_cierre"
  | "correccion_apertura";

export type CajaAuthorization = {
  id:           string;
  cajaCode:     string;
  sessionId:    string;
  type:         AuthorizationType;
  motivo:       string;
  authorizedBy: string;
  authorizedAt: string;
  status:       "emitida" | "ejecutada" | "validada";
  executedBy?:  string;
  executedAt?:  string;
  validatedBy?: string;
  validatedAt?: string;
};

export function loadAuthorizations(): CajaAuthorization[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as CajaAuthorization[]) : [];
  } catch { return []; }
}

function save(auths: CajaAuthorization[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(auths)); } catch { /* quota */ }
}

export function recordAuthorization(
  data: Omit<CajaAuthorization, "id" | "status">,
): CajaAuthorization {
  const auth: CajaAuthorization = {
    ...data,
    id: `sa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    status: "emitida",
  };
  save([auth, ...loadAuthorizations()]);
  return auth;
}

export function markAuthorizationExecuted(id: string, executedBy: string): void {
  save(loadAuthorizations().map(a =>
    a.id === id
      ? { ...a, status: "ejecutada" as const, executedBy, executedAt: new Date().toISOString() }
      : a,
  ));
}

export function markAuthorizationValidated(id: string, validatedBy: string): void {
  save(loadAuthorizations().map(a =>
    a.id === id
      ? { ...a, status: "validada" as const, validatedBy, validatedAt: new Date().toISOString() }
      : a,
  ));
}

export function getAuthorizationForSession(sessionId: string): CajaAuthorization | null {
  return loadAuthorizations().find(a => a.sessionId === sessionId) ?? null;
}

export function getActiveAuthorizationsForBlock(blockPrefix: string): CajaAuthorization[] {
  return loadAuthorizations().filter(
    a => a.cajaCode[0] === blockPrefix && a.status === "emitida",
  );
}
