import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react";
import { Search, X, ChevronRight, Users, UserPlus } from "lucide-react";
import { usePOS } from "../../context/POSContext";
import { useCapacidad } from "../../hooks/useCapacidad";
import { clienteStore } from "../../domains/clients/cliente.store";
import { crearCliente, suspenderCliente, reactivarCliente, inactivarCliente } from "../../domains/clients/cliente.service";
import type { Cliente, EstadoCliente, TipoCliente } from "../../domains/clients/cliente.types";

type FiltroEstado = "TODOS" | "ACTIVO" | "SUSPENDIDO" | "INACTIVO";
type FiltroTipo = "TODOS" | "OCASIONAL" | "FRECUENTE" | "CONVENIO";
type Accion = "none" | "suspender" | "inactivar" | "crear";
type TipoDocumentoForm = "DNI" | "RUC" | "CE" | "PASAPORTE";

const STATUS_STYLES: Record<EstadoCliente, string> = {
  ACTIVO: "bg-emerald-50 text-emerald-700",
  SUSPENDIDO: "bg-amber-50 text-amber-700",
  INACTIVO: "bg-slate-100 text-slate-700",
};

function EstadoBadge({ estado }: { estado: EstadoCliente }) {
  return (
    <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold tracking-widest ${STATUS_STYLES[estado]}`}>
      {estado}
    </span>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7aa48f]">{label}</p>
      <p className={`mt-1 text-[14px] font-extrabold tabular-nums ${accent ?? "text-[#121416]"}`}>{value}</p>
    </div>
  );
}

function StatsBar({ clientes, puedeGestionar, handleOpenCreate }: { clientes: Cliente[]; puedeGestionar: boolean; handleOpenCreate: () => void }) {
  const stats = useMemo(() => {
    return {
      activos: clientes.filter(cliente => cliente.estado === "ACTIVO").length,
      frecuentes: clientes.filter(cliente => cliente.tipo === "FRECUENTE").length,
      convenio: clientes.filter(cliente => cliente.tipo === "CONVENIO").length,
      ocasional: clientes.filter(cliente => cliente.tipo === "OCASIONAL").length,
      suspendidos: clientes.filter(cliente => cliente.estado === "SUSPENDIDO").length,
    };
  }, [clientes]);

  return (
    <div className="shrink-0 px-3 pb-2 flex flex-col gap-2">
      <div className="flex items-center gap-2 pt-2">
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest text-emerald-700">
          {stats.activos} ACTIVOS
        </span>
        <button
          disabled={!puedeGestionar}
          onClick={handleOpenCreate}
          className={`ml-auto flex items-center gap-1.5 rounded-xl bg-[#1e7e4f] px-3 py-1.5 text-[11px] font-bold text-white transition ${
            !puedeGestionar ? "cursor-not-allowed opacity-40" : "hover:bg-[#16663f]"
          }`}
          title={!puedeGestionar ? "Sin capacidad para gestionar clientes" : undefined}
        >
          <UserPlus size={13} />
          NUEVO CLIENTE
        </button>
      </div>
      <div className="grid grid-cols-5 gap-2 rounded-2xl bg-[#f0faf4] p-2">
        <StatCard label="Total activos" value={String(stats.activos)} accent="text-[#1e7e4f]" />
        <StatCard label="Frecuente" value={String(stats.frecuentes)} accent="text-[#1e7e4f]" />
        <StatCard label="Convenio" value={String(stats.convenio)} accent="text-[#1e7e4f]" />
        <StatCard label="Ocasional" value={String(stats.ocasional)} accent="text-[#1e7e4f]" />
        <StatCard label="Suspendidos" value={String(stats.suspendidos)} accent="text-red-600" />
      </div>
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
          ? "bg-[#1e7e4f] text-white"
          : "border border-[#dce9e1] bg-white text-[#5f7668] hover:border-[#b6d3c1] hover:text-[#274739]"
      }`}
    >
      {children}
    </button>
  );
}

function formatCustomerTaxDocument(cliente: Cliente): string {
  const { tipoDocumento, numeroDocumento } = cliente.identificacionFiscal;
  return numeroDocumento ? `${tipoDocumento} · ${numeroDocumento}` : tipoDocumento;
}

function getDocumentoFiscalSugerido(tipoDocumento: TipoDocumentoForm): "BOLETA" | "FACTURA" | "NINGUNO" {
  if (tipoDocumento === "RUC") return "FACTURA";
  return "BOLETA";
}

export function ClientesWorkspace() {
  const { showNotice } = usePOS();
  const puedeGestionar = useCapacidad("gestionar_clientes");

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("TODOS");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("TODOS");
  const [accion, setAccion] = useState<Accion>("none");
  const [motivoAccion, setMotivoAccion] = useState("");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<TipoCliente>("FRECUENTE");
  const [nuevoTipoDocumento, setNuevoTipoDocumento] = useState<TipoDocumentoForm>("DNI");
  const [nuevoNumeroDocumento, setNuevoNumeroDocumento] = useState("");
  const [createError, setCreateError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const motivoRef = useRef<HTMLInputElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);

  const clientes = useMemo(() => {
    return clienteStore
      .getTodos()
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
  }, [refreshNonce]);

  const clientesFiltrados = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clientes.filter(cliente => {
      const byEstado = filtroEstado === "TODOS" || cliente.estado === filtroEstado;
      const byTipo = filtroTipo === "TODOS" || cliente.tipo === filtroTipo;
      const byQuery = !query
        || cliente.nombre.toLowerCase().includes(query)
        || (cliente.identificacionFiscal.numeroDocumento ?? "").toLowerCase().includes(query);

      return byEstado && byTipo && byQuery;
    });
  }, [clientes, filtroEstado, filtroTipo, search]);

  const selected = clientes.find(cliente => cliente.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId && !clientesFiltrados.some(cliente => cliente.id === selectedId)) {
      setSelectedId(null);
      setAccion("none");
      setMotivoAccion("");
    }
  }, [clientesFiltrados, selectedId]);

  useEffect(() => {
    if (accion === "suspender" || accion === "inactivar") {
      setTimeout(() => motivoRef.current?.focus(), 30);
    }

    if (accion === "crear") {
      setTimeout(() => nombreRef.current?.focus(), 30);
    }
  }, [accion]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA";

      if (!inInput && e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if ((accion === "suspender" || accion === "inactivar") && e.key === "Escape") {
        e.preventDefault();
        setAccion("none");
        setMotivoAccion("");
        return;
      }

      if ((accion === "suspender" || accion === "inactivar") && e.key === "Enter" && motivoAccion.trim()) {
        e.preventDefault();
        if (accion === "suspender") {
          handleSuspenderConfirm();
        } else {
          handleInactivarConfirm();
        }
        return;
      }

      if (accion === "crear" && e.key === "Escape") {
        e.preventDefault();
        resetCreateForm();
      }

      if (!inInput && e.key === "Escape" && selectedId) {
        e.preventDefault();
        setSelectedId(null);
        setAccion("none");
        setMotivoAccion("");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const resetCreateForm = useCallback(() => {
    setAccion("none");
    setNuevoNombre("");
    setNuevoTipo("FRECUENTE");
    setNuevoTipoDocumento("DNI");
    setNuevoNumeroDocumento("");
    setCreateError("");
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
    setAccion("none");
    setMotivoAccion("");
    setCreateError("");
  }, []);

  const handleOpenCreate = useCallback(() => {
    setSelectedId(null);
    setAccion("crear");
    setMotivoAccion("");
    setNuevoNombre("");
    setNuevoTipo("FRECUENTE");
    setNuevoTipoDocumento("DNI");
    setNuevoNumeroDocumento("");
    setCreateError("");
  }, []);

  const handleSuspenderConfirm = useCallback(() => {
    if (!selected || !motivoAccion.trim()) return;

    try {
      suspenderCliente(selected.id, motivoAccion.trim());
      setRefreshNonce(prev => prev + 1);
      setSelectedId(null);
      setAccion("none");
      setMotivoAccion("");
      showNotice("Cliente suspendido correctamente");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo suspender el cliente");
    }
  }, [motivoAccion, selected, showNotice]);

  const handleInactivarConfirm = useCallback(() => {
    if (!selected || !motivoAccion.trim()) return;

    try {
      inactivarCliente(selected.id, motivoAccion.trim());
      setRefreshNonce(prev => prev + 1);
      setSelectedId(null);
      setAccion("none");
      setMotivoAccion("");
      showNotice("Cliente inactivado correctamente");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo inactivar el cliente");
    }
  }, [motivoAccion, selected, showNotice]);

  const handleReactivar = useCallback(() => {
    if (!selected) return;

    try {
      reactivarCliente(selected.id);
      setRefreshNonce(prev => prev + 1);
      setSelectedId(null);
      setAccion("none");
      setMotivoAccion("");
      showNotice("Cliente reactivado correctamente");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "No se pudo reactivar el cliente");
    }
  }, [selected, showNotice]);

  const handleGuardarCliente = useCallback(() => {
    try {
      const nuevoCliente = crearCliente({
        nombre: nuevoNombre.trim(),
        tipo: nuevoTipo,
        identificacionFiscal: {
          tipoDocumento: nuevoTipoDocumento,
          numeroDocumento: nuevoNumeroDocumento.trim() ? nuevoNumeroDocumento.trim() : null,
          razonSocial: null,
          direccionFiscal: null,
          documentoFiscalSugerido: getDocumentoFiscalSugerido(nuevoTipoDocumento),
          validadoEn: null,
        },
        canales: {
          email: null,
          whatsapp: null,
          preferenciaEnvio: "NINGUNO",
          consentimiento: false,
        },
        condiciones: {
          tipoValorPreferente: null,
          creditoHabilitado: false,
          limiteCredito: null,
          sujetoADetraccion: false,
          observaciones: null,
        },
      });

      setRefreshNonce(prev => prev + 1);
      setSelectedId(nuevoCliente.id);
      setAccion("none");
      setMotivoAccion("");
      setNuevoNombre("");
      setNuevoTipo("FRECUENTE");
      setNuevoTipoDocumento("DNI");
      setNuevoNumeroDocumento("");
      setCreateError("");
      showNotice("Cliente creado correctamente");
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "No se pudo crear el cliente");
    }
  }, [nuevoNombre, nuevoNumeroDocumento, nuevoTipo, nuevoTipoDocumento, showNotice]);

  const renderConditionsBlock = selected && (
    <div className="rounded-2xl border border-[#dce9e1] bg-white px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7aa48f]">Condiciones</p>
      <div className="mt-2 space-y-1.5 text-[11px] text-[#4c6356]">
        {selected.condiciones.tipoValorPreferente !== null && (
          <p><span className="font-semibold text-[#2f4a3a]">Tipo valor preferente:</span> {selected.condiciones.tipoValorPreferente}</p>
        )}
        {selected.condiciones.creditoHabilitado && (
          <p>
            <span className="font-semibold text-[#2f4a3a]">Crédito habilitado:</span>{" "}
            {selected.condiciones.limiteCredito !== null ? `S/ ${selected.condiciones.limiteCredito.toFixed(2)}` : "Sin límite"}
          </p>
        )}
        {selected.condiciones.sujetoADetraccion && (
          <p><span className="font-semibold text-[#2f4a3a]">Sujeto a detracción:</span> Sí</p>
        )}
        {selected.condiciones.observaciones && (
          <p><span className="font-semibold text-[#2f4a3a]">Observaciones:</span> {selected.condiciones.observaciones}</p>
        )}
        {selected.condiciones.tipoValorPreferente === null
          && !selected.condiciones.creditoHabilitado
          && !selected.condiciones.sujetoADetraccion
          && !selected.condiciones.observaciones && (
          <p className="text-[#89a195]">Sin condiciones especiales</p>
        )}
      </div>
    </div>
  );

  return (
    <section className="flex h-full w-full gap-3">
      <div className="flex flex-1 flex-col overflow-hidden rounded-[28px] border border-[#1e7e4f]/50 bg-[#FDFCF9]">
        <header className="flex shrink-0 h-[42px] items-center gap-2 border-b border-[#1e7e4f]/15 bg-[#f0faf4] px-4">
          <Users size={13} strokeWidth={2} className="shrink-0 text-[#1e7e4f]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight leading-none text-[#121416]">CLIENTES</span>
        </header>

        <StatsBar clientes={clientes} puedeGestionar={puedeGestionar} handleOpenCreate={handleOpenCreate} />

        <div className="shrink-0 border-b border-[#e4efe8] px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip active={filtroEstado === "TODOS"} onClick={() => setFiltroEstado("TODOS")}>Todos</FilterChip>
              <FilterChip active={filtroEstado === "ACTIVO"} onClick={() => setFiltroEstado("ACTIVO")}>Activos</FilterChip>
              <FilterChip active={filtroEstado === "SUSPENDIDO"} onClick={() => setFiltroEstado("SUSPENDIDO")}>Suspendidos</FilterChip>
              <FilterChip active={filtroEstado === "INACTIVO"} onClick={() => setFiltroEstado("INACTIVO")}>Inactivos</FilterChip>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip active={filtroTipo === "TODOS"} onClick={() => setFiltroTipo("TODOS")}>Todos</FilterChip>
              <FilterChip active={filtroTipo === "FRECUENTE"} onClick={() => setFiltroTipo("FRECUENTE")}>Frecuente</FilterChip>
              <FilterChip active={filtroTipo === "CONVENIO"} onClick={() => setFiltroTipo("CONVENIO")}>Convenio</FilterChip>
              <FilterChip active={filtroTipo === "OCASIONAL"} onClick={() => setFiltroTipo("OCASIONAL")}>Ocasional</FilterChip>
            </div>
          </div>
        </div>

        <div className="shrink-0 px-3 pt-2.5 pb-1.5">
          <div className="flex items-center gap-2 rounded-xl border border-[#dce9e1] bg-white px-3 py-1.5">
            <Search size={12} className="shrink-0 text-[#8aa294]" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o documento... [F2]"
              className="flex-1 bg-transparent text-[12px] text-[#374151] outline-none placeholder:text-[#c0cad4]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="shrink-0 text-[#9ca3af] hover:text-[#374151]">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-3">
          {clientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-16 text-center">
              <Users size={24} className="text-[#b9c9bf]" />
              <p className="text-[13px] font-semibold text-[#9eb1a5]">Sin clientes registrados</p>
              <p className="text-[11px] text-[#c1cec6]">Ajusta los filtros o registra un nuevo cliente</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {clientesFiltrados.map(cliente => {
                const isSelected = cliente.id === selectedId;
                return (
                  <article
                    key={cliente.id}
                    onClick={() => handleSelect(cliente.id)}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-2.5 transition-colors ${
                      isSelected ? "bg-[#f0faf4] ring-1 ring-[#1e7e4f]/20" : "hover:bg-white"
                    }`}
                  >
                    <EstadoBadge estado={cliente.estado} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[#1e293b]">{cliente.nombre}</p>
                      <p className="mt-0.5 truncate text-[11px] text-[#7b8794]">
                        {cliente.tipo} · {cliente.identificacionFiscal.numeroDocumento ?? "Sin documento"}
                      </p>
                    </div>

                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#4b6355]">
                      {cliente.codigo}
                    </span>

                    <ChevronRight size={14} className={`${isSelected ? "text-[#1e7e4f]" : "text-[#c0cad4]"}`} />
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#1e7e4f]/50 bg-[#FDFCF9]">
        <header className="flex shrink-0 h-[42px] items-center gap-2 border-b border-[#1e7e4f]/15 bg-[#f0faf4] px-4">
          <Users size={13} strokeWidth={2} className="shrink-0 text-[#1e7e4f]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight leading-none text-[#121416]">DETALLE</span>
        </header>

        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3">
          {accion === "crear" ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-[#dce9e1] bg-white px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7aa48f]">Nuevo cliente</p>
                <div className="mt-3 flex flex-col gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#40564a]">Nombre</label>
                    <input
                      ref={nombreRef}
                      autoFocus
                      type="text"
                      value={nuevoNombre}
                      onChange={e => setNuevoNombre(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#dce9e1] bg-white px-3 py-2 text-[12px] text-[#374151] outline-none focus:border-[#1e7e4f]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#40564a]">Tipo</label>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {(["FRECUENTE", "CONVENIO", "OCASIONAL"] as const).map(tipo => (
                        <FilterChip key={tipo} active={nuevoTipo === tipo} onClick={() => setNuevoTipo(tipo)}>
                          {tipo}
                        </FilterChip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#40564a]">Tipo documento</label>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {(["DNI", "RUC", "CE", "PASAPORTE"] as const).map(tipo => (
                        <FilterChip key={tipo} active={nuevoTipoDocumento === tipo} onClick={() => setNuevoTipoDocumento(tipo)}>
                          {tipo}
                        </FilterChip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#40564a]">Número de documento</label>
                    <input
                      type="text"
                      value={nuevoNumeroDocumento}
                      onChange={e => setNuevoNumeroDocumento(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#dce9e1] bg-white px-3 py-2 text-[12px] text-[#374151] outline-none focus:border-[#1e7e4f]"
                    />
                  </div>
                </div>
              </div>

              {createError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">
                  {createError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={resetCreateForm}
                  className="flex-1 rounded-xl border border-[#dce9e1] bg-white py-2 text-[11px] font-bold text-[#40564a] transition hover:bg-[#f7fbf8]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarCliente}
                  className="flex-1 rounded-xl bg-[#1e7e4f] py-2 text-[11px] font-bold text-white transition hover:bg-[#16663f]"
                >
                  Guardar
                </button>
              </div>
            </div>
          ) : !selected ? (
            <p className="text-[12px] text-[#b3c1b8]">Seleccione un cliente para ver su detalle</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-[#dce9e1] bg-white px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-extrabold text-[#121416]">{selected.nombre}</p>
                    <p className="mt-1 text-[11px] text-[#6f8076]">{selected.codigo} · {selected.tipo}</p>
                  </div>
                  <EstadoBadge estado={selected.estado} />
                </div>
              </div>

              <div className="rounded-2xl border border-[#dce9e1] bg-white px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7aa48f]">Identificación fiscal</p>
                <div className="mt-2 space-y-1.5 text-[11px] text-[#4c6356]">
                  <p>{formatCustomerTaxDocument(selected)}</p>
                  {selected.identificacionFiscal.razonSocial && <p>{selected.identificacionFiscal.razonSocial}</p>}
                  {selected.identificacionFiscal.direccionFiscal && <p>{selected.identificacionFiscal.direccionFiscal}</p>}
                  <p>
                    <span className="font-semibold text-[#2f4a3a]">Documento fiscal sugerido:</span>{" "}
                    {selected.identificacionFiscal.documentoFiscalSugerido}
                  </p>
                </div>
              </div>

              {(selected.canales.email || selected.canales.whatsapp) && (
                <div className="rounded-2xl border border-[#dce9e1] bg-white px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7aa48f]">Canales</p>
                  <div className="mt-2 space-y-1.5 text-[11px] text-[#4c6356]">
                    {selected.canales.email && <p><span className="font-semibold text-[#2f4a3a]">Email:</span> {selected.canales.email}</p>}
                    {selected.canales.whatsapp && <p><span className="font-semibold text-[#2f4a3a]">WhatsApp:</span> {selected.canales.whatsapp}</p>}
                    <p><span className="font-semibold text-[#2f4a3a]">Preferencia de envío:</span> {selected.canales.preferenciaEnvio}</p>
                  </div>
                </div>
              )}

              {renderConditionsBlock}

              {selected.fidelizacion !== null && (
                <div className="rounded-2xl border border-[#dce9e1] bg-white px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7aa48f]">Fidelización</p>
                  <div className="mt-2 space-y-1.5 text-[11px] text-[#4c6356]">
                    <p><span className="font-semibold text-[#2f4a3a]">Programa ID:</span> {selected.fidelizacion.programaId}</p>
                    <p><span className="font-semibold text-[#2f4a3a]">Puntos acumulados:</span> {selected.fidelizacion.puntosAcumulados}</p>
                    {selected.fidelizacion.nivelActual && (
                      <p><span className="font-semibold text-[#2f4a3a]">Nivel actual:</span> {selected.fidelizacion.nivelActual}</p>
                    )}
                    <p><span className="font-semibold text-[#2f4a3a]">Estado del programa:</span> {selected.fidelizacion.estado}</p>
                  </div>
                </div>
              )}

              {accion === "none" && selected.estado === "ACTIVO" && (
                <div className="flex gap-2">
                  <button
                    disabled={!puedeGestionar}
                    onClick={() => {
                      setAccion("suspender");
                      setMotivoAccion("");
                    }}
                    className={`flex-1 rounded-xl border border-amber-200 bg-amber-50 py-2 text-[11px] font-bold text-amber-700 transition ${
                      !puedeGestionar ? "cursor-not-allowed opacity-40" : "hover:bg-amber-100"
                    }`}
                    title={!puedeGestionar ? "Sin capacidad para gestionar clientes" : undefined}
                  >
                    SUSPENDER
                  </button>
                  <button
                    disabled={!puedeGestionar}
                    onClick={() => {
                      setAccion("inactivar");
                      setMotivoAccion("");
                    }}
                    className={`flex-1 rounded-xl border border-slate-200 bg-slate-100 py-2 text-[11px] font-bold text-slate-700 transition ${
                      !puedeGestionar ? "cursor-not-allowed opacity-40" : "hover:bg-slate-200"
                    }`}
                    title={!puedeGestionar ? "Sin capacidad para gestionar clientes" : undefined}
                  >
                    INACTIVAR
                  </button>
                </div>
              )}

              {accion === "none" && selected.estado === "SUSPENDIDO" && (
                <div className="flex gap-2">
                  <button
                    disabled={!puedeGestionar}
                    onClick={handleReactivar}
                    className={`flex-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-[11px] font-bold text-emerald-700 transition ${
                      !puedeGestionar ? "cursor-not-allowed opacity-40" : "hover:bg-emerald-100"
                    }`}
                    title={!puedeGestionar ? "Sin capacidad para gestionar clientes" : undefined}
                  >
                    REACTIVAR
                  </button>
                  <button
                    disabled={!puedeGestionar}
                    onClick={() => {
                      setAccion("inactivar");
                      setMotivoAccion("");
                    }}
                    className={`flex-1 rounded-xl border border-slate-200 bg-slate-100 py-2 text-[11px] font-bold text-slate-700 transition ${
                      !puedeGestionar ? "cursor-not-allowed opacity-40" : "hover:bg-slate-200"
                    }`}
                    title={!puedeGestionar ? "Sin capacidad para gestionar clientes" : undefined}
                  >
                    INACTIVAR
                  </button>
                </div>
              )}

              {(accion === "suspender" || accion === "inactivar") && (
                <div className={`flex flex-col gap-2 rounded-2xl px-3 py-3 ${
                  accion === "suspender"
                    ? "border border-amber-200 bg-amber-50/70"
                    : "border border-slate-200 bg-slate-100/80"
                }`}>
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${
                    accion === "suspender" ? "text-amber-700" : "text-slate-700"
                  }`}>
                    {accion === "suspender" ? "Confirmar suspensión" : "Confirmar inactivación"}
                  </p>
                  <input
                    ref={motivoRef}
                    type="text"
                    value={motivoAccion}
                    onChange={e => setMotivoAccion(e.target.value)}
                    placeholder="Motivo requerido..."
                    className="w-full rounded-xl border border-white/70 bg-white px-3 py-2 text-[12px] text-[#374151] outline-none focus:border-[#1e7e4f]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setAccion("none");
                        setMotivoAccion("");
                      }}
                      className="flex-1 rounded-xl border border-[#dce9e1] bg-white py-2 text-[11px] font-bold text-[#40564a] transition hover:bg-[#f7fbf8]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={accion === "suspender" ? handleSuspenderConfirm : handleInactivarConfirm}
                      disabled={!motivoAccion.trim()}
                      className={`flex-1 rounded-xl py-2 text-[11px] font-bold text-white transition ${
                        motivoAccion.trim() ? "bg-[#1e7e4f] hover:bg-[#16663f]" : "cursor-not-allowed bg-[#91b8a4]"
                      }`}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
