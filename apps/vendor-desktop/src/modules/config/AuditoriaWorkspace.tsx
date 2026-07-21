import { useCallback, useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search, Shield, X } from "lucide-react";
import {
  auditoriaService,
  type DominioAuditoria,
  type RegistroAuditoria,
  type ResumenAuditoriaDominio,
  type ResultadoAuditoria,
} from "../../domains/auditoria/auditoria.service";

type FiltroDominio = DominioAuditoria | "TODOS";
type FiltroResultado = ResultadoAuditoria | "TODOS";
type DetalleFormateado = Array<[string, string]> | string | null;

const DOMINIOS: DominioAuditoria[] = [
  "IDENTIDAD",
  "CAJA",
  "COMPROBANTE",
  "INVENTARIO",
  "CONFIGURACION",
  "CATALOGO",
];

const RESULTADOS: ResultadoAuditoria[] = ["EXITOSO", "FALLIDO"];

function formatDateTime(dt: string): string {
  const date = new Date(dt);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return dt.length > 16 ? dt.slice(0, 16) : dt;
}

function formatDetalle(json: string | null): DetalleFormateado {
  if (json === null) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return Object.entries(parsed).map(([key, value]) => [
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      ]);
    }
    return json;
  } catch {
    return json;
  }
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
        active
          ? "bg-[#7B6EA0] text-white"
          : "border border-[#e4e9f0] bg-white text-[#6b7280] hover:border-[#7B6EA0]/40 hover:text-[#7B6EA0]"
      }`}
    >
      {children}
    </button>
  );
}

function ResultadoBadge({ resultado }: { resultado: ResultadoAuditoria }) {
  return (
    <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold tracking-widest ${
      resultado === "EXITOSO"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-[#FEF2F2] text-[#DC2626]"
    }`}>
      {resultado}
    </span>
  );
}

function PanelDetalle({ registro }: { registro: RegistroAuditoria | null }) {
  if (!registro) {
    return <p className="text-[12px] text-[#c0cad4]">Seleccione un registro para ver el detalle</p>;
  }

  const detalle = formatDetalle(registro.detalle);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-[#e4e9f0] bg-white px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Operación</p>
            <p className="mt-0.5 break-words text-[15px] font-extrabold text-[#121416]">{registro.tipoOperacion}</p>
          </div>
          <ResultadoBadge resultado={registro.resultado} />
        </div>
      </div>

      <div className="rounded-2xl border border-[#e4e9f0] bg-white px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Contexto</p>
        <div className="mt-2 space-y-1">
          <p className="text-[11px] text-[#6b7280]">Rubro <span className="font-semibold text-[#374151]">{registro.rubro}</span></p>
          <p className="text-[11px] text-[#6b7280]">Dominio <span className="font-semibold text-[#374151]">{registro.dominio}</span></p>
          <p className="text-[11px] text-[#6b7280]">Ejecutado por <span className="font-semibold text-[#374151]">{registro.ejecutadoPor}</span></p>
          <p className="text-[11px] text-[#6b7280]">Operador <span className="font-semibold text-[#374151]">{registro.operadorAlias}</span></p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e4e9f0] bg-white px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Registro</p>
        <div className="mt-2 space-y-1">
          <p className="text-[11px] text-[#374151]">{formatDateTime(registro.registradoEn)}</p>
          {registro.ipTerminal && <p className="text-[11px] text-[#6b7280]">{registro.ipTerminal}</p>}
        </div>
      </div>

      {detalle !== null && (
        <div className="rounded-2xl border border-[#e4e9f0] bg-white px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Detalle</p>
          {typeof detalle === "string" ? (
            <p className="mt-2 break-words text-[11px] text-[#374151]">{detalle}</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {detalle.map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-3 rounded-xl bg-[#f8fafc] px-2.5 py-2 text-[11px]">
                  <span className="font-semibold text-[#6b7280]">{key}</span>
                  <span className="break-all text-right text-[#374151]">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AuditoriaWorkspace() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [resumen, setResumen] = useState<ResumenAuditoriaDominio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [filtroDominio, setFiltroDominio] = useState<FiltroDominio>("TODOS");
  const [filtroResultado, setFiltroResultado] = useState<FiltroResultado>("TODOS");
  const [busqueda, setBusqueda] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [registrosCargados, resumenCargado] = await Promise.all([
        auditoriaService.obtenerRegistros(),
        auditoriaService.obtenerResumen(),
      ]);
      setRegistros(registrosCargados);
      setResumen(resumenCargado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los registros de auditoría");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const registrosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return registros.filter(registro => {
      if (filtroDominio !== "TODOS" && registro.dominio !== filtroDominio) return false;
      if (filtroResultado !== "TODOS" && registro.resultado !== filtroResultado) return false;
      if (!query) return true;
      return [
        registro.operadorAlias,
        registro.tipoOperacion,
        registro.dominio,
      ].some(valor => valor.toLowerCase().includes(query));
    });
  }, [busqueda, filtroDominio, filtroResultado, registros]);

  const seleccionado = registros.find(registro => registro.id === seleccionadoId) ?? null;

  return (
    <section className="flex min-h-0 flex-1 gap-3 p-3">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#7B6EA0]/50 bg-[#FDFCF9]">
        <header className="flex h-[42px] shrink-0 items-center justify-between border-b border-[#7B6EA0]/15 bg-[#F5F3FB] px-4">
          <div className="flex items-center gap-2">
            <Shield size={13} strokeWidth={2} className="shrink-0 text-[#7B6EA0]" />
            <span className="text-[13px] font-semibold uppercase tracking-tight leading-none text-[#121416]">AUDITORÍA</span>
          </div>
          <span className="text-[10px] font-semibold tabular-nums text-[#7B6EA0]">{registros.length} registros</span>
        </header>

        <div className="shrink-0 border-b border-[#7B6EA0]/15 px-3 py-2">
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={filtroDominio === "TODOS"} onClick={() => setFiltroDominio("TODOS")}>Todos</FilterChip>
            {DOMINIOS.map(dominio => (
              <FilterChip key={dominio} active={filtroDominio === dominio} onClick={() => setFiltroDominio(dominio)}>
                {dominio}
              </FilterChip>
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <FilterChip active={filtroResultado === "TODOS"} onClick={() => setFiltroResultado("TODOS")}>Todos</FilterChip>
            {RESULTADOS.map(resultado => (
              <FilterChip key={resultado} active={filtroResultado === resultado} onClick={() => setFiltroResultado(resultado)}>
                {resultado}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="shrink-0 px-3 pt-2.5 pb-1.5">
          <div className="flex items-center gap-2 rounded-xl border border-[#e4e9f0] bg-white px-3 py-1.5">
            <Search size={12} className="shrink-0 text-[#9ca3af]" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar operador, operación, dominio..."
              className="flex-1 bg-transparent text-[12px] text-[#374151] outline-none placeholder:text-[#c0cad4]"
            />
            {busqueda && (
              <button onClick={() => setBusqueda("")} className="shrink-0 text-[#9ca3af] hover:text-[#374151]">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {resumen.length > 0 && (
          <div className="shrink-0 flex flex-wrap gap-1 px-3 pb-1.5">
            {resumen.map(item => (
              <span key={item.dominio} className="rounded bg-[#7B6EA0]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#7B6EA0]">
                {item.dominio} {item.total}
              </span>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-3">
          {cargando ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <LoaderCircle size={18} className="animate-spin text-[#7B6EA0]" />
              <p className="text-[12px] font-semibold text-[#9ca3af]">Cargando registros de auditoría...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <p className="text-[12px] font-semibold text-[#DC2626]">{error}</p>
              <button onClick={() => void cargar()} className="rounded-xl border border-[#7B6EA0]/40 bg-white px-3 py-2 text-[11px] font-bold text-[#7B6EA0] hover:bg-[#F5F3FB]">
                Reintentar
              </button>
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Shield size={24} className="text-[#7B6EA0]/40" />
              <p className="text-[13px] font-semibold text-[#c0cad4]">Sin operaciones registradas</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {registrosFiltrados.map(registro => {
                const seleccionado = registro.id === seleccionadoId;
                return (
                  <article
                    key={registro.id}
                    onClick={() => setSeleccionadoId(registro.id)}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-2.5 transition-colors ${
                      seleccionado ? "bg-[#F5F3FB] ring-1 ring-[#7B6EA0]/20" : "hover:bg-white"
                    }`}
                  >
                    <span className="shrink-0 rounded bg-[#7B6EA0]/10 px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest text-[#7B6EA0]">
                      {registro.dominio}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-[#374151]">{registro.tipoOperacion}</p>
                      <p className="mt-0.5 truncate text-[11px] text-[#9ca3af]">
                        {registro.operadorAlias} · {formatDateTime(registro.registradoEn)}
                      </p>
                    </div>
                    <ResultadoBadge resultado={registro.resultado} />
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#7B6EA0]/50 bg-[#FDFCF9]">
        <header className="flex h-[42px] shrink-0 items-center gap-2 border-b border-[#7B6EA0]/15 bg-[#F5F3FB] px-4">
          <Shield size={13} strokeWidth={2} className="shrink-0 text-[#7B6EA0]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight leading-none text-[#121416]">DETALLE</span>
        </header>
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3">
          <PanelDetalle registro={seleccionado} />
        </div>
      </div>
    </section>
  );
}
