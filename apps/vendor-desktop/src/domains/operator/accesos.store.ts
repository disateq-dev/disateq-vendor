const LS_KEY = "disateq:operator:accesos";
const MAX_EVENTOS = 200;

export type TipoEventoAcceso =
  | "LOGIN_OK"
  | "LOGIN_FAIL"
  | "PIN_CAMBIADO"
  | "PIN_RESETEADO"
  | "PIN_ADMIN_USADO"
  | "PIN_ADMIN_FALLIDO"
  | "PIN_ADMIN_CONFIGURADO";

export type EventoAcceso = {
  id: string;
  ts: string;
  tipo: TipoEventoAcceso;
  operadorAlias: string;
  operacion: string;
  detalle?: string;
};

function cargarEventos(): EventoAcceso[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr as EventoAcceso[] : [];
  } catch { return []; }
}

function persistirEventos(eventos: EventoAcceso[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(eventos)); } catch { }
}

export const accesosStore = {

  registrar(evento: Omit<EventoAcceso, "id" | "ts">): void {
    const eventos = cargarEventos();
    const nuevo: EventoAcceso = {
      id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: new Date().toISOString(),
      ...evento,
    };
    const actualizados = [...eventos, nuevo];
    persistirEventos(
      actualizados.length > MAX_EVENTOS
        ? actualizados.slice(actualizados.length - MAX_EVENTOS)
        : actualizados
    );
  },

  obtener(): EventoAcceso[] {
    return cargarEventos();
  },
};
