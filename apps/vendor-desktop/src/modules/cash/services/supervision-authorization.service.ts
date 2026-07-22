import { invoke } from "@tauri-apps/api/core";

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
  postponedMotivo?: string;
  postponedAt?:     string;
  postponedBy?:     string;
};

type RawAutorizacion = {
  id:               string;
  caja_code:        string;
  session_id:       string;
  type:             string;
  motivo:           string;
  authorized_by:    string;
  authorized_at:    string;
  status:           string;
  executed_by:      string | null;
  executed_at:      string | null;
  validated_by:     string | null;
  validated_at:     string | null;
  postponed_motivo: string | null;
  postponed_at:     string | null;
  postponed_by:     string | null;
};

function mapRaw(r: RawAutorizacion): CajaAuthorization {
  return {
    id:              r.id,
    cajaCode:        r.caja_code.replace(/^'|'$/g, ""),
    sessionId:       r.session_id,
    type:            r.type as AuthorizationType,
    motivo:          r.motivo,
    authorizedBy:    r.authorized_by,
    authorizedAt:    r.authorized_at,
    status:          r.status as CajaAuthorization["status"],
    executedBy:      r.executed_by      ?? undefined,
    executedAt:      r.executed_at      ?? undefined,
    validatedBy:     r.validated_by     ?? undefined,
    validatedAt:     r.validated_at     ?? undefined,
    postponedMotivo: r.postponed_motivo ?? undefined,
    postponedAt:     r.postponed_at     ?? undefined,
    postponedBy:     r.postponed_by     ?? undefined,
  };
}

function emitChanged(): void {
  window.dispatchEvent(new CustomEvent("disateq:autorizaciones-changed"));
}

export async function loadAuthorizations(): Promise<CajaAuthorization[]> {
  const raw = await invoke<RawAutorizacion[]>("cargar_autorizaciones_supervision");
  return raw.map(mapRaw);
}

export async function recordAuthorization(
  data: Omit<CajaAuthorization, "id" | "status">,
): Promise<CajaAuthorization> {
  const id = `sa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await invoke("registrar_autorizacion_supervision", {
    input: {
      id,
      cajaCode:     data.cajaCode,
      sessionId:    data.sessionId,
      type:          data.type,
      motivo:        data.motivo,
      authorizedBy: data.authorizedBy,
      authorizedAt: data.authorizedAt,
    },
  });
  emitChanged();
  const all = await loadAuthorizations();
  return all.find(a => a.id === id) ?? { ...data, id, status: "emitida" };
}

export async function markAuthorizationExecuted(id: string, executedBy: string): Promise<void> {
  await invoke("ejecutar_autorizacion_supervision", { id, executedBy });
  emitChanged();
}

export async function markAuthorizationValidated(id: string, validatedBy: string): Promise<void> {
  await invoke("validar_autorizacion_supervision", { id, validatedBy });
  emitChanged();
}

export async function markAuthorizationPostponed(id: string, motivo: string, postponedBy: string): Promise<void> {
  await invoke("postergar_autorizacion_supervision", { id, motivo, postponedBy });
  emitChanged();
}

export async function getAuthorizationForSession(sessionId: string): Promise<CajaAuthorization | null> {
  const all = await loadAuthorizations();
  return all.find(a => a.sessionId === sessionId) ?? null;
}

export async function getActiveAuthorizationsForBlock(blockPrefix: string): Promise<CajaAuthorization[]> {
  const raw = await invoke<RawAutorizacion[]>("obtener_autorizaciones_activas_bloque", { blockPrefix });
  return raw.map(mapRaw);
}
