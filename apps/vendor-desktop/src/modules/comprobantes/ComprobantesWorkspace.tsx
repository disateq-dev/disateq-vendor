import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react";
import { Search, X, AlertTriangle, ChevronRight, FileText, ReceiptText } from "lucide-react";
import { usePOS } from "../../context/POSContext";
import { convertirAFormal } from "../../domains/documents/comprobante.service";
import { comprobanteStore } from "../../domains/documents/comprobante.store";
import type { Comprobante, TipoComprobante } from "../../domains/documents/comprobante.types";

type FiltroTipo = "TODOS" | TipoComprobante;
type FiltroEstado = "TODOS" | "EMITIDO" | "ANULADO" | "REFERENCIADO";
type Vista = "sesion" | "historial";
type AccionDetalle = "none" | "anular" | "convertir";

const DOC_LABELS: Record<TipoComprobante, string> = {
  TIQUE_VENTA: "NOTA",
  BOLETA: "BOL",
  FACTURA: "FAC",
  COTIZACION: "COT",
  NOTA_CREDITO: "N/C",
  NOTA_DEBITO: "N/D",
};

const METHOD_LABELS: Record<string, string> = {
  EFECTIVO: "EFE",
  YAPE: "YAP",
  TARJETA: "TAR",
  MIXTO: "MIX",
};

const METHOD_COLORS: Record<string, string> = {
  EFECTIVO: "bg-emerald-50 text-emerald-700",
  YAPE: "bg-violet-50 text-violet-700",
  TARJETA: "bg-blue-50 text-blue-700",
  MIXTO: "bg-amber-50 text-amber-700",
};

const STATUS_COLORS: Record<string, string> = {
  EMITIDO: "bg-emerald-50 text-emerald-700",
  ANULADO: "bg-red-50 text-red-600",
  REFERENCIADO: "bg-amber-50 text-amber-700",
};

function pad8(n: number) {
  return String(n).padStart(8, "0");
}

function formatMoney(value: number) {
  return `S/ ${value.toFixed(2)}`;
}

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

function loadAllComprobantes(): Comprobante[] {
  return [
    ...comprobanteStore.getComprobantesPorTipo("TIQUE_VENTA"),
    ...comprobanteStore.getComprobantesPorTipo("BOLETA"),
    ...comprobanteStore.getComprobantesPorTipo("FACTURA"),
    ...comprobanteStore.getComprobantesPorTipo("COTIZACION"),
    ...comprobanteStore.getComprobantesPorTipo("NOTA_CREDITO"),
    ...comprobanteStore.getComprobantesPorTipo("NOTA_DEBITO"),
  ].sort((a, b) => b.emitidoEn.localeCompare(a.emitidoEn));
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">{label}</p>
      <p className={`mt-1 text-[14px] font-extrabold tabular-nums ${accent ?? "text-[#121416]"}`}>{value}</p>
    </div>
  );
}

function StatsBar({ docs }: { docs: Comprobante[] }) {
  const stats = useMemo(() => {
    const emitidos = docs.filter(doc => doc.estado === "EMITIDO");
    return {
      total: emitidos.reduce((sum, doc) => sum + doc.total, 0),
      efe: emitidos.filter(doc => doc.metodoPago === "EFECTIVO").reduce((sum, doc) => sum + doc.total, 0),
      yap: emitidos.filter(doc => doc.metodoPago === "YAPE").reduce((sum, doc) => sum + doc.total, 0),
      tar: emitidos.filter(doc => doc.metodoPago === "TARJETA").reduce((sum, doc) => sum + doc.total, 0),
      anulados: docs.filter(doc => doc.estado === "ANULADO").length,
    };
  }, [docs]);

  return (
    <div className="shrink-0 px-3 pb-2">
      <div className="grid grid-cols-5 gap-2 rounded-2xl bg-[#FBF4F4] p-2">
        <StatCard label="Total vendido" value={formatMoney(stats.total)} accent="text-[#111827]" />
        <StatCard label="EFE" value={formatMoney(stats.efe)} accent="text-emerald-700" />
        <StatCard label="YAP" value={formatMoney(stats.yap)} accent="text-violet-700" />
        <StatCard label="TAR" value={formatMoney(stats.tar)} accent="text-blue-700" />
        <StatCard label="Anulados" value={String(stats.anulados)} accent="text-red-600" />
      </div>
    </div>
  );
}

type PanelDetalleProps = {
  selected: Comprobante | null;
  onVoid: (motivo: string) => void;
  onConvertir: (tipo: "BOLETA" | "FACTURA") => void;
};

function PanelDetalle({ selected, onVoid, onConvertir }: PanelDetalleProps) {
  const [accion, setAccion] = useState<AccionDetalle>("none");
  const [motivo, setMotivo] = useState("");
  const [tipoFormal, setTipoFormal] = useState<"BOLETA" | "FACTURA">("BOLETA");
  const motivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAccion("none");
    setMotivo("");
    setTipoFormal("BOLETA");
  }, [selected?.id]);

  useEffect(() => {
    if (accion === "anular") {
      setTimeout(() => motivoRef.current?.focus(), 30);
    }
  }, [accion]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selected || accion === "none") return;

      if (e.key === "Escape") {
        e.preventDefault();
        setAccion("none");
        setMotivo("");
      }

      if (e.key === "Enter" && accion === "anular" && motivo.trim()) {
        e.preventDefault();
        onVoid(motivo.trim());
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [accion, motivo, onVoid, selected]);

  if (!selected) {
    return <p className="text-[12px] text-[#c0cad4]">Seleccione un comprobante para ver su detalle</p>;
  }

  const isEmitido = selected.estado === "EMITIDO";
  const canConvertir = isEmitido && (selected.tipo === "TIQUE_VENTA" || selected.tipo === "COTIZACION");

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-[#eef2f7] bg-white px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Comprobante</p>
            <p className="mt-0.5 text-[15px] font-extrabold text-[#121416]">
              {selected.serie}-{pad8(selected.correlativo)}
            </p>
            <p className="mt-1 text-[11px] text-[#6b7280]">
              {selected.tipo} · {formatDateTime(selected.emitidoEn)}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold tracking-widest ${STATUS_COLORS[selected.estado] ?? "bg-slate-100 text-slate-700"}`}>
            {selected.estado}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-[#eef2f7] bg-white px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Emisor</p>
        <div className="mt-2 space-y-1">
          <p className="text-[12px] font-semibold text-[#374151]">{selected.emisor.razonSocial}</p>
          <p className="text-[11px] text-[#6b7280]">RUC {selected.emisor.ruc}</p>
          <p className="text-[11px] text-[#6b7280]">{selected.emisor.direccion}</p>
          <p className="text-[11px] text-[#9ca3af]">Emitido por {selected.emitidoPor || "—"}</p>
        </div>
      </div>

      {!selected.receptor.esGenerico && (
        <div className="rounded-2xl border border-[#eef2f7] bg-white px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Receptor</p>
          <div className="mt-2 space-y-1">
            <p className="text-[12px] font-semibold text-[#374151]">{selected.receptor.nombre}</p>
            <p className="text-[11px] text-[#6b7280]">
              {selected.receptor.tipoDocumento}
              {selected.receptor.numeroDocumento ? ` ${selected.receptor.numeroDocumento}` : ""}
            </p>
            {selected.receptor.direccion && (
              <p className="text-[11px] text-[#6b7280]">{selected.receptor.direccion}</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#eef2f7] bg-white px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Lineas</p>
        <div className="mt-2 flex flex-col gap-2">
          {selected.lineas.map(linea => (
            <div key={linea.id} className="rounded-xl bg-[#f8fafc] px-2.5 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-[#374151]">
                    {linea.cantidad}x {linea.descripcion}
                  </p>
                  {linea.notaLinea && (
                    <p className="mt-1 text-[10px] text-[#9ca3af]">{linea.notaLinea}</p>
                  )}
                </div>
                <span className="shrink-0 text-[11px] font-bold tabular-nums text-[#111827]">
                  {formatMoney(linea.subtotal)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-[#f4f7fb] px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Totales tributarios</p>
        <div className="mt-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
            <span>Base imponible</span>
            <span className="font-semibold tabular-nums text-[#374151]">{formatMoney(selected.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
            <span>IGV</span>
            <span className="font-semibold tabular-nums text-[#374151]">{formatMoney(selected.igv)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#dbe3ee] pt-2">
            <span className="text-[12px] font-bold text-[#374151]">Total</span>
            <span className="text-[15px] font-extrabold tabular-nums text-[#111827]">{formatMoney(selected.total)}</span>
          </div>
        </div>
      </div>

      {selected.estado === "ANULADO" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Anulado</p>
          <p className="mt-1 text-[11px] text-red-600">{selected.motivoAnulacion || "Sin motivo registrado"}</p>
        </div>
      )}

      {selected.estado === "REFERENCIADO" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Referenciado</p>
          <p className="mt-1 text-[11px] text-amber-700">Este comprobante ya fue convertido a un documento formal.</p>
        </div>
      )}

      {isEmitido && accion === "none" && (
        <div className="flex flex-col gap-2">
          {canConvertir && (
            <button
              onClick={() => setAccion("convertir")}
              className="rounded-xl border border-[#dbe6ff] bg-[#edf4ff] px-3 py-2 text-[12px] font-bold text-[#2154d8] transition hover:bg-[#e3efff]"
            >
              CONVERTIR A FORMAL
            </button>
          )}
          <button
            onClick={() => setAccion("anular")}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600 transition hover:bg-red-100"
          >
            <AlertTriangle size={13} />
            ANULAR
          </button>
        </div>
      )}

      {isEmitido && accion === "anular" && (
        <div className="flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50/70 px-3 py-3">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={12} className="shrink-0 text-red-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Confirmar anulacion</span>
          </div>
          <input
            ref={motivoRef}
            type="text"
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Motivo requerido..."
            className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#c0cad4] focus:border-red-400"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setAccion("none");
                setMotivo("");
              }}
              className="flex-1 rounded-xl border border-[#e4e9f0] bg-white py-2 text-[11px] font-bold text-[#374151] transition hover:bg-[#f4f7fb]"
            >
              Cancelar
            </button>
            <button
              onClick={() => onVoid(motivo.trim())}
              disabled={!motivo.trim()}
              className={`flex-1 rounded-xl py-2 text-[11px] font-bold text-white transition ${
                motivo.trim() ? "bg-red-600 hover:bg-red-700" : "cursor-not-allowed bg-red-300"
              }`}
            >
              Anular
            </button>
          </div>
        </div>
      )}

      {isEmitido && accion === "convertir" && (
        <div className="flex flex-col gap-2 rounded-2xl border border-[#dbe6ff] bg-[#edf4ff] px-3 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#2154d8]">Convertir a formal</p>
          <div className="grid grid-cols-2 gap-2">
            {(["BOLETA", "FACTURA"] as const).map(tipo => (
              <button
                key={tipo}
                onClick={() => setTipoFormal(tipo)}
                className={`rounded-xl px-3 py-2 text-[11px] font-bold transition ${
                  tipoFormal === tipo
                    ? "bg-[#2154d8] text-white"
                    : "border border-[#c9d8ff] bg-white text-[#2154d8] hover:bg-[#f8fbff]"
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAccion("none")}
              className="flex-1 rounded-xl border border-[#c9d8ff] bg-white py-2 text-[11px] font-bold text-[#2154d8] transition hover:bg-[#f8fbff]"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConvertir(tipoFormal)}
              className="flex-1 rounded-xl bg-[#2154d8] py-2 text-[11px] font-bold text-white transition hover:bg-[#1d4cc2]"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
        active
          ? "bg-[#2154d8] text-white"
          : "border border-[#e4e9f0] bg-white text-[#6b7280] hover:border-[#cbd5e1] hover:text-[#374151]"
      }`}
    >
      {children}
    </button>
  );
}

export function ComprobantesWorkspace() {
  const { comprobantes, voidComprobante, cashSession, showNotice } = usePOS();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>("sesion");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("TODOS");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("TODOS");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const sessionKey = cashSession.isOpen && cashSession.cashBox && cashSession.openedAt
    ? `${cashSession.cashBox.code}-${cashSession.openedAt.toISOString()}`
    : null;

  const docsBase = useMemo(() => loadAllComprobantes(), [comprobantes, refreshNonce]);

  const docsPorVista = useMemo(() => {
    if (vista === "sesion") {
      if (!sessionKey) return [];
      return docsBase.filter(doc => doc.sessionKey === sessionKey);
    }

    if (!sessionKey) return docsBase;
    return docsBase.filter(doc => doc.sessionKey !== sessionKey);
  }, [docsBase, sessionKey, vista]);

  const docsFiltrados = useMemo(() => {
    const query = search.trim().toLowerCase();

    return docsPorVista
      .filter(doc => filtroTipo === "TODOS" || doc.tipo === filtroTipo)
      .filter(doc => filtroEstado === "TODOS" || doc.estado === filtroEstado)
      .filter(doc => {
        if (!query) return true;

        return [
          `${doc.serie}-${pad8(doc.correlativo)}`,
          doc.receptor.nombre,
          doc.receptor.numeroDocumento ?? "",
          doc.metodoPago,
          doc.tipo,
          doc.total.toFixed(2),
          formatDateTime(doc.emitidoEn),
        ].some(value => value.toLowerCase().includes(query));
      })
      .sort((a, b) => b.emitidoEn.localeCompare(a.emitidoEn));
  }, [docsPorVista, filtroEstado, filtroTipo, search]);

  const selected = docsFiltrados.find(doc => doc.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId && !docsFiltrados.some(doc => doc.id === selectedId)) {
      setSelectedId(null);
    }
  }, [docsFiltrados, selectedId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA";

      if (e.key === "Escape" && !inInput && selectedId) {
        e.preventDefault();
        setSelectedId(null);
      }

      if (!inInput && e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  const handleVoid = useCallback((motivo: string) => {
    if (!selectedId || !motivo.trim()) return;
    voidComprobante(selectedId, motivo.trim());
    setSelectedId(null);
  }, [selectedId, voidComprobante]);

  const handleConvertir = useCallback((tipo: "BOLETA" | "FACTURA") => {
    if (!selected) return;

    try {
      const serie = tipo === "BOLETA" ? "B001" : "F001";
      const operador = cashSession.operator || "default";
      const nuevo = convertirAFormal(selected.id, tipo, serie, selected.receptor, operador);
      setRefreshNonce(prev => prev + 1);
      setSelectedId(null);
      showNotice(`${nuevo.serie}-${pad8(nuevo.correlativo)} generado correctamente`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo convertir el comprobante");
    }
  }, [cashSession.operator, selected, showNotice]);

  const emptyTitle = vista === "sesion"
    ? (cashSession.isOpen ? "Sin comprobantes en esta sesion" : "Sin sesion activa")
    : "Sin comprobantes en historial";

  const emptyText = vista === "sesion"
    ? (cashSession.isOpen ? "Los documentos emitidos en este turno apareceran aqui" : "Abra una caja para consultar la sesion")
    : "No hay documentos fuera de la sesion actual con los filtros seleccionados";

  return (
    <section className="flex h-full w-full gap-3">
      <div className="flex flex-1 flex-col overflow-hidden rounded-[28px] border border-[#C05050]/50 bg-[#FDFCF9]">
        <header className="flex shrink-0 items-center gap-2 border-b border-[#C05050]/15 bg-[#FBF4F4] px-4 py-2.5">
          <span className="text-[14px] font-semibold uppercase tracking-tight leading-none text-[#121416]">COMPROBANTES</span>
          {cashSession.isOpen && (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest text-emerald-700">
              SESION ACTIVA
            </span>
          )}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center rounded-full border border-[#e4e9f0] bg-white p-1">
              <button
                onClick={() => setVista("sesion")}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                  vista === "sesion" ? "bg-[#2154d8] text-white" : "text-[#6b7280] hover:text-[#374151]"
                }`}
              >
                <ReceiptText size={12} />
                Sesion
              </button>
              <button
                onClick={() => setVista("historial")}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                  vista === "historial" ? "bg-[#2154d8] text-white" : "text-[#6b7280] hover:text-[#374151]"
                }`}
              >
                <FileText size={12} />
                Historial
              </button>
            </div>
            <span className="text-[11px] text-[#9ca3af]">{docsFiltrados.length} docs</span>
          </div>
        </header>

        <div className="shrink-0 border-b border-[#f0e4e4] px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip active={filtroTipo === "TODOS"} onClick={() => setFiltroTipo("TODOS")}>Todos</FilterChip>
              <FilterChip active={filtroTipo === "TIQUE_VENTA"} onClick={() => setFiltroTipo("TIQUE_VENTA")}>Nota</FilterChip>
              <FilterChip active={filtroTipo === "BOLETA"} onClick={() => setFiltroTipo("BOLETA")}>Boleta</FilterChip>
              <FilterChip active={filtroTipo === "FACTURA"} onClick={() => setFiltroTipo("FACTURA")}>Factura</FilterChip>
              <FilterChip active={filtroTipo === "COTIZACION"} onClick={() => setFiltroTipo("COTIZACION")}>Cotiza</FilterChip>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip
                active={filtroEstado === "EMITIDO"}
                onClick={() => setFiltroEstado(prev => prev === "EMITIDO" ? "TODOS" : "EMITIDO")}
              >
                Emitidos
              </FilterChip>
              <FilterChip
                active={filtroEstado === "ANULADO"}
                onClick={() => setFiltroEstado(prev => prev === "ANULADO" ? "TODOS" : "ANULADO")}
              >
                Anulados
              </FilterChip>
              <FilterChip
                active={filtroEstado === "REFERENCIADO"}
                onClick={() => setFiltroEstado(prev => prev === "REFERENCIADO" ? "TODOS" : "REFERENCIADO")}
              >
                Referenciados
              </FilterChip>
            </div>
          </div>
        </div>

        <div className="shrink-0 px-3 pt-2.5 pb-1.5">
          <div className="flex items-center gap-2 rounded-xl border border-[#e4e9f0] bg-white px-3 py-1.5">
            <Search size={12} className="shrink-0 text-[#9ca3af]" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar numero, monto, cliente... [F2]"
              className="flex-1 bg-transparent text-[12px] text-[#374151] outline-none placeholder:text-[#c0cad4]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="shrink-0 text-[#9ca3af] hover:text-[#374151]">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {vista === "sesion" && cashSession.isOpen && <StatsBar docs={docsPorVista} />}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-3">
          {docsFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-16 text-center">
              <p className="text-[13px] font-semibold text-[#c0cad4]">{emptyTitle}</p>
              <p className="text-[11px] text-[#d1d9e1]">{emptyText}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {docsFiltrados.map(doc => {
                const isSelected = doc.id === selectedId;
                const isCancelled = doc.estado === "ANULADO";
                const secondary = doc.receptor.esGenerico ? formatDateTime(doc.emitidoEn) : doc.receptor.nombre;

                return (
                  <article
                    key={doc.id}
                    onClick={() => handleSelect(doc.id)}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-2.5 transition-colors ${
                      isSelected ? "bg-[#EDF4FF] ring-1 ring-[#2154d8]/20" : "hover:bg-white"
                    } ${isCancelled ? "opacity-50" : ""}`}
                  >
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest ${
                      STATUS_COLORS[doc.estado] ?? "bg-slate-100 text-slate-700"
                    }`}>
                      {doc.estado === "EMITIDO" ? (DOC_LABELS[doc.tipo] ?? doc.tipo) : doc.estado.slice(0, 4)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#374151]">
                          {doc.serie}-{pad8(doc.correlativo)}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          METHOD_COLORS[doc.metodoPago] ?? "bg-[#f1f5f9] text-[#374151]"
                        }`}>
                          {METHOD_LABELS[doc.metodoPago] ?? doc.metodoPago.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-[#9ca3af]">{secondary}</p>
                    </div>

                    <span className={`shrink-0 w-16 text-right text-[12px] font-bold tabular-nums ${
                      isSelected ? "text-[#2154d8]" : "text-[#2F3E46]"
                    }`}>
                      {formatMoney(doc.total)}
                    </span>

                    <ChevronRight size={14} className={`shrink-0 ${isSelected ? "text-[#2154d8]" : "text-[#c0cad4]"}`} />
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#C05050]/50 bg-[#FDFCF9]">
        <header className="flex shrink-0 items-center gap-2 border-b border-[#C05050]/15 bg-[#FBF4F4] px-4 py-2.5">
          <span className="text-[14px] font-semibold uppercase tracking-tight leading-none text-[#121416]">DETALLE</span>
          {selected && (
            <span className="truncate text-[11px] font-semibold tabular-nums text-[#6b7280]">
              {selected.serie}-{pad8(selected.correlativo)}
            </span>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3">
          <PanelDetalle selected={selected} onVoid={handleVoid} onConvertir={handleConvertir} />
        </div>
      </div>
    </section>
  );
}
