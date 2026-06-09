import { useState } from "react";
import { Settings2, Check, Store, ShieldCheck, Layers, Monitor, Sliders, Users, UserCog } from "lucide-react";
import { CapacidadesWorkspace } from "./CapacidadesWorkspace";
import { RolesOperacionalesWorkspace } from "./RolesOperacionalesWorkspace";
import { OperadoresWorkspace } from "../cash/OperadoresWorkspace";
import { usePOS } from "../../context/POSContext";
import { RUBROS, type Rubro, type VisualMode, type PrintFlow } from "../../data/catalogs";
import { loadBusinessConfig, saveBusinessConfig } from "../../config/business";
// ops.ts reservado para configuraciones futuras
import { pinAdminStore } from "../../config/pin-admin.store";
import { accesosStore } from "../../domains/operator/accesos.store";
import { type ConfigSubView } from "../../App";

const RUBRO_ORDER: Rubro[] = ["abarrotes", "food-fast", "panaderia", "farmacia", "optica", "zapateria", "reparacion", "celulares"];

const RUBRO_ICONS: Record<Rubro, string> = {
  abarrotes:   "",
  "food-fast": "",
  panaderia:   "",
  farmacia:    "",
  optica:      "️",
  zapateria:   "",
  reparacion:  "",
  celulares:   "",
};

const VISUAL_MODES: { id: VisualMode; label: string; desc: string }[] = [
  { id: "lista",  label: "Lista",   desc: "Scanner · teclado · densidad máxima"    },
  { id: "visual", label: "Visual",  desc: "Tiles · touch/mouse · selección rápida" },
  { id: "mixto",  label: "Mixto",   desc: "Lista + tiles simultáneos · híbrido"    },
];

const PRINT_FLOWS: { id: PrintFlow; label: string; desc: string; ready: boolean }[] = [
  { id: "solo-comprobante",     label: "Solo comprobante",        desc: "Imprime solo el ticket de venta",            ready: true  },
  { id: "comprobante-despacho", label: "Comprobante + Despacho",  desc: "Ticket venta + ticket interno de despacho",  ready: true  },
  { id: "comprobante-comanda",  label: "Comprobante + Comanda",   desc: "Ticket venta + orden de preparación",        ready: false },
  { id: "comprobante-precuenta",label: "Comprobante + Precuenta", desc: "Ticket venta + pre-cuenta al cliente",       ready: false },
  { id: "comprobante-turno",    label: "Comprobante + Turno",     desc: "Ticket venta + número de turno/cola",        ready: false },
  { id: "comprobante-embarque", label: "Comprobante + Embarque",  desc: "Ticket venta + etiqueta de despacho físico", ready: false },
];

export function ConfigWorkspace({ configSubView }: { configSubView: ConfigSubView }) {
  const { rubro, setRubro, visualMode, setVisualMode, printFlow, setPrintFlow } = usePOS();
  const rubroConfig = RUBROS[rubro];

  // ── NEGOCIO ───────────────────────────────────────────────────
  const [nombreComercial, setNombreComercial] = useState(() => loadBusinessConfig().nombreComercial);
  const [razonSocial,     setRazonSocial]     = useState(() => loadBusinessConfig().razonSocial);
  const [ruc,             setRuc]             = useState(() => loadBusinessConfig().ruc);
  const [direccion,       setDireccion]       = useState(() => loadBusinessConfig().direccion);
  const [telefono,        setTelefono]        = useState(() => loadBusinessConfig().telefono);
  const [bizSaved,        setBizSaved]        = useState(false);

  function handleSaveNegocio() {
    if (!nombreComercial.trim()) return;
    saveBusinessConfig({
      nombreComercial: nombreComercial.trim(),
      razonSocial:     razonSocial.trim(),
      ruc:             ruc.trim(),
      direccion:       direccion.trim(),
      telefono:        telefono.trim(),
      alias:           loadBusinessConfig().alias,
      tasaIGV:         loadBusinessConfig().tasaIGV,
      rubro,
    });
    setBizSaved(true);
    setTimeout(() => setBizSaved(false), 2000);
  }

  // ── OPERACIÓN ─────────────────────────────────────────────────
  const { activeOperator } = usePOS();
  const [adminConfigured,   setAdminConfigured]   = useState(() => pinAdminStore.estaConfigurado());
  const [adminMeta,         setAdminMeta]         = useState(() => pinAdminStore.obtenerMeta());
  const [adminPinNuevo,     setAdminPinNuevo]     = useState("");
  const [adminPinConfirm,   setAdminPinConfirm]   = useState("");
  const [adminPinError,     setAdminPinError]     = useState<string | null>(null);
  const [adminSaved,        setAdminSaved]        = useState(false);

  async function handleSavePinAdmin() {
    setAdminPinError(null);
    if (!/^\d{6}$/.test(adminPinNuevo))           { setAdminPinError("Exactamente 6 dígitos numéricos"); return; }
    if (adminPinNuevo !== adminPinConfirm)         { setAdminPinError("Los PINes no coinciden"); return; }
    const codigo = activeOperator?.codigoOperador ?? activeOperator?.alias ?? "ADMIN";
    await pinAdminStore.configurar(adminPinNuevo, codigo);
    accesosStore.registrar({
      tipo: "PIN_ADMIN_CONFIGURADO",
      operadorAlias: codigo,
      operacion: "Configuración PIN Admin",
    });
    setAdminConfigured(true);
    setAdminMeta(pinAdminStore.obtenerMeta());
    setAdminPinNuevo("");
    setAdminPinConfirm("");
    setAdminSaved(true);
    setTimeout(() => setAdminSaved(false), 2500);
  }

  const SUB_ICONS: Record<ConfigSubView, React.ReactNode> = {
    negocio:     <Store       size={13} strokeWidth={2} className="text-[#697387]" />,
    operacion:   <ShieldCheck size={13} strokeWidth={2} className="text-[#697387]" />,
    roles:       <Users       size={13} strokeWidth={2} className="text-[#697387]" />,
    operadores:  <UserCog     size={13} strokeWidth={2} className="text-[#697387]" />,
    capacidades: <Sliders     size={13} strokeWidth={2} className="text-[#697387]" />,
    experiencia: <Monitor     size={13} strokeWidth={2} className="text-[#697387]" />,
    rubro:       <Layers      size={13} strokeWidth={2} className="text-[#697387]" />,
  };
  const SUB_LABELS: Record<ConfigSubView, string> = {
    negocio:     "Negocio",
    operacion:   "Operación",
    roles:       "Roles operacionales",
    operadores:  "Operadores",
    capacidades: "Capacidades operacionales",
    experiencia: "Experiencia",
    rubro:       "Rubro",
  };

  if (configSubView === "operadores")  return <OperadoresWorkspace />;
  if (configSubView === "roles")       return <RolesOperacionalesWorkspace />;
  if (configSubView === "capacidades") return <CapacidadesWorkspace />;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#697387]/50 bg-[#FDFCF9]">

      {/* ── SheetHeader ── */}
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#697387]/15 bg-[#F3F4F6] px-4">
        <Settings2 size={13} strokeWidth={2} className="text-[#697387]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">AJUSTES</span>
        <span className="text-[#697387]/30 mx-0.5">·</span>
        {SUB_ICONS[configSubView]}
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#697387] leading-none">
          {SUB_LABELS[configSubView]}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-5">

        {/* ── NEGOCIO ── */}
        {configSubView === "negocio" && (
          <div className="flex flex-col gap-4 max-w-lg">
            <p className="text-[11px] text-[#9ca3af]">
              Datos que aparecen en impresiones, arqueos y comprobantes.
            </p>
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                value={nombreComercial}
                onChange={e => setNombreComercial(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveNegocio()}
                maxLength={60}
                autoFocus
                className="flex-1 rounded-xl border border-[#E9E4DC] bg-white px-3 py-2.5 text-[13px] text-[#374151] placeholder:text-[#c4cdd8] focus:border-[#697387]/40 focus:outline-none focus:ring-1 focus:ring-[#697387]/20"
                placeholder="Nombre comercial"
              />
              <input
                type="text"
                value={razonSocial}
                onChange={e => setRazonSocial(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveNegocio()}
                maxLength={80}
                className="flex-1 rounded-xl border border-[#E9E4DC] bg-white px-3 py-2.5 text-[13px] text-[#374151] placeholder:text-[#c4cdd8] focus:border-[#697387]/40 focus:outline-none focus:ring-1 focus:ring-[#697387]/20"
                placeholder="Razón social"
              />
              <input
                type="text"
                value={ruc}
                onChange={e => setRuc(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveNegocio()}
                maxLength={11}
                className="flex-1 rounded-xl border border-[#E9E4DC] bg-white px-3 py-2.5 text-[13px] text-[#374151] placeholder:text-[#c4cdd8] focus:border-[#697387]/40 focus:outline-none focus:ring-1 focus:ring-[#697387]/20"
                placeholder="RUC"
              />
              <input
                type="text"
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveNegocio()}
                maxLength={100}
                className="flex-1 rounded-xl border border-[#E9E4DC] bg-white px-3 py-2.5 text-[13px] text-[#374151] placeholder:text-[#c4cdd8] focus:border-[#697387]/40 focus:outline-none focus:ring-1 focus:ring-[#697387]/20"
                placeholder="Dirección"
              />
              <input
                type="text"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveNegocio()}
                maxLength={30}
                className="flex-1 rounded-xl border border-[#E9E4DC] bg-white px-3 py-2.5 text-[13px] text-[#374151] placeholder:text-[#c4cdd8] focus:border-[#697387]/40 focus:outline-none focus:ring-1 focus:ring-[#697387]/20"
                placeholder="Teléfono"
              />
              <button
                onClick={handleSaveNegocio}
                disabled={!nombreComercial.trim()}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide transition ${
                  bizSaved
                    ? "bg-[#45b356]/15 text-[#45b356]"
                    : "bg-[#697387]/10 text-[#697387] hover:bg-[#697387]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                {bizSaved ? <><Check size={12} strokeWidth={2.5} /> Aplicado</> : "Aplicar"}
              </button>
            </div>
          </div>
        )}

        {/* ── OPERACIÓN ── */}
        {configSubView === "operacion" && (
          <div className="flex flex-col gap-5 max-w-sm">

            {/* Estado actual */}
            <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
              adminConfigured
                ? "border-emerald-200 bg-[#f0fdf4]"
                : "border-amber-200 bg-amber-50"
            }`}>
              <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${adminConfigured ? "bg-emerald-500" : "bg-amber-400"}`} />
              <div className="flex flex-col gap-0.5">
                <p className={`text-[11px] font-bold uppercase tracking-wide ${adminConfigured ? "text-emerald-700" : "text-amber-700"}`}>
                  {adminConfigured ? "PIN Admin configurado" : "PIN Admin no configurado"}
                </p>
                {adminConfigured && adminMeta ? (
                  <p className="text-[10px] text-emerald-600">
                    Por {adminMeta.configuradoPor} · {new Date(adminMeta.configuradoEn).toLocaleDateString("es-PE")}
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-600 leading-snug">
                    Las operaciones sensibles del sistema están bloqueadas hasta configurarlo.
                  </p>
                )}
              </div>
            </div>

            {/* Formulario */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                {adminConfigured ? "Cambiar PIN Admin" : "Configurar PIN Admin"}
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#b0bac8]">
                  Nuevo PIN (6 dígitos)
                </label>
                <input
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={adminPinNuevo}
                  onChange={e => { setAdminPinNuevo(e.target.value.replace(/\D/g, "").slice(0, 6)); setAdminPinError(null); }}
                  onKeyDown={e => e.key === "Enter" && handleSavePinAdmin()}
                  placeholder="••••••"
                  className={`w-full rounded-xl border px-3 py-2.5 text-[18px] font-bold tracking-[0.4em] text-[#1a2d4e] outline-none placeholder:tracking-normal placeholder:font-normal placeholder:text-[13px] placeholder:text-[#d1d9e1] focus:ring-2 transition ${
                    adminPinError
                      ? "border-red-300 focus:border-red-400 focus:ring-red-200/30"
                      : "border-[#E9E4DC] focus:border-[#697387]/50 focus:ring-[#697387]/15"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#b0bac8]">
                  Confirmar PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={adminPinConfirm}
                  onChange={e => { setAdminPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6)); setAdminPinError(null); }}
                  onKeyDown={e => e.key === "Enter" && handleSavePinAdmin()}
                  placeholder="••••••"
                  className={`w-full rounded-xl border px-3 py-2.5 text-[18px] font-bold tracking-[0.4em] text-[#1a2d4e] outline-none placeholder:tracking-normal placeholder:font-normal placeholder:text-[13px] placeholder:text-[#d1d9e1] focus:ring-2 transition ${
                    adminPinError
                      ? "border-red-300 focus:border-red-400 focus:ring-red-200/30"
                      : "border-[#E9E4DC] focus:border-[#697387]/50 focus:ring-[#697387]/15"
                  }`}
                />
              </div>

              {adminPinError && (
                <p className="text-[10px] font-semibold text-red-500">{adminPinError}</p>
              )}

              <button
                onClick={handleSavePinAdmin}
                disabled={adminPinNuevo.length < 6 || adminPinConfirm.length < 6}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide transition ${
                  adminSaved
                    ? "bg-emerald-500/15 text-emerald-600"
                    : adminPinNuevo.length === 6 && adminPinConfirm.length === 6
                      ? "bg-[#697387]/10 text-[#697387] hover:bg-[#697387]/20"
                      : "bg-[#697387]/5 text-[#697387]/30 cursor-not-allowed"
                }`}
              >
                {adminSaved
                  ? <><Check size={12} strokeWidth={2.5} /> PIN Admin guardado</>
                  : adminConfigured ? "Cambiar PIN Admin" : "Configurar PIN Admin"
                }
              </button>
            </div>

            <p className="text-[10px] text-[#b0bac8] leading-relaxed">
              El PIN Admin autoriza operaciones sensibles en todo el sistema.
              Solo operadores con acceso total pueden configurarlo.
            </p>
          </div>
        )}

        {/* ── RUBRO ── */}
        {configSubView === "rubro" && (
          <div className="flex flex-col gap-3 max-w-xl">
            <p className="text-[11px] text-[#9ca3af]">
              Define el catálogo activo y los defaults operacionales del turno.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {RUBRO_ORDER.map(r => {
                const cfg      = RUBROS[r];
                const isActive = rubro === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      setRubro(r);
                      saveBusinessConfig({ ...loadBusinessConfig(), rubro: r });
                    }}
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] ${
                      isActive
                        ? "border-[#697387]/30 bg-[#697387]/8 shadow-[0_2px_6px_rgba(105,115,135,0.10)]"
                        : "border-[#E9E4DC] bg-white hover:border-[#697387]/30 hover:bg-[#697387]/5"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 text-[20px] leading-none">{RUBRO_ICONS[r]}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[12px] font-bold ${isActive ? "text-[#3d4554]" : "text-[#2F3E46]"}`}>
                        {cfg.label}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#9ca3af] leading-snug">{cfg.description}</p>
                      <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-wide text-[#c4a87c]">
                        default: {cfg.defaultVisualMode} · {cfg.defaultPrintFlow.replace("comprobante-", "c+")}
                      </p>
                    </div>
                    {isActive && <div className="ml-auto shrink-0 mt-1 h-2 w-2 rounded-full bg-[#697387]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── EXPERIENCIA ── */}
        {configSubView === "experiencia" && (
          <div className="flex flex-col gap-6 max-w-xl">

            {/* modo visual */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9ca3af]">Modo visual</p>
              <div className="flex flex-col gap-1.5">
                {VISUAL_MODES.map(m => {
                  const isActive  = visualMode === m.id;
                  const isDefault = rubroConfig.defaultVisualMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setVisualMode(m.id)}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition active:scale-[0.98] ${
                        isActive
                          ? "border-[#697387]/30 bg-[#697387]/8"
                          : "border-[#E9E4DC] bg-white hover:border-[#697387]/30 hover:bg-[#697387]/5"
                      }`}
                    >
                      <div className={`h-2 w-2 shrink-0 rounded-full ${isActive ? "bg-[#697387]" : "bg-[#e4e9f0]"}`} />
                      <div className="flex-1 min-w-0">
                        <span className={`text-[12px] font-semibold ${isActive ? "text-[#3d4554]" : "text-[#374151]"}`}>
                          {m.label}
                        </span>
                        <span className="ml-2 text-[10.5px] text-[#9ca3af]">{m.desc}</span>
                      </div>
                      {isDefault && (
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-[#c4a87c]">
                          default {rubroConfig.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* flujo impresión */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9ca3af]">Flujo de impresión</p>
              <div className="flex flex-col gap-1.5">
                {PRINT_FLOWS.map(f => {
                  const isActive  = printFlow === f.id;
                  const isDefault = rubroConfig.defaultPrintFlow === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => f.ready && setPrintFlow(f.id)}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition ${
                        !f.ready
                          ? "border-[#f1f4f7] bg-[#f8fafc] cursor-not-allowed opacity-50"
                          : isActive
                            ? "border-[#697387]/30 bg-[#697387]/8 active:scale-[0.98]"
                            : "border-[#E9E4DC] bg-white hover:border-[#697387]/30 hover:bg-[#697387]/5 active:scale-[0.98]"
                      }`}
                    >
                      <div className={`h-2 w-2 shrink-0 rounded-full ${isActive && f.ready ? "bg-[#697387]" : "bg-[#e4e9f0]"}`} />
                      <div className="flex-1 min-w-0">
                        <span className={`text-[12px] font-semibold ${isActive && f.ready ? "text-[#3d4554]" : "text-[#374151]"}`}>
                          {f.label}
                        </span>
                        <span className="ml-2 text-[10.5px] text-[#9ca3af]">{f.desc}</span>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isDefault && (
                          <span className="text-[9px] font-bold uppercase tracking-wide text-[#c4a87c]">
                            default {rubroConfig.label}
                          </span>
                        )}
                        {!f.ready && (
                          <span className="text-[9px] font-bold uppercase tracking-wide text-[#9ca3af]">pronto</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* status strip */}
            <div className="rounded-2xl border border-[#E9E4DC] bg-[#f8fafc] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Contexto activo</p>
              <p className="mt-1 text-[11px] text-[#6b7280]">
                {rubroConfig.label} · {rubroConfig.catalog.length}p · {visualMode} · {printFlow}
              </p>
            </div>

            {/* DEV tools */}
            {import.meta.env.DEV && (
              <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 flex flex-col gap-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-600">DEV · Herramientas de testing</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      localStorage.removeItem("disateq.pos.usedCodes");
                      localStorage.removeItem("disateq.pos.usedDate");
                      window.location.reload();
                    }}
                    className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-700 hover:bg-amber-100 transition"
                  >
                    RESET CAJAS DÍA
                  </button>
                  <button
                    onClick={() => {
                      const keys = [
                        "disateq.pos.cashSession",
                        "disateq.pos.usedCodes",
                        "disateq.pos.usedDate",
                        "disateq.pos.sessionStats",
                        "disateq.pos.cashMoves",
                        "disateq.pos.opLogs",
                        "disateq.pos.correlatives",
                        "disateq.pos.comprobantes",
                        "disateq.pos.sessionHistory",
                        "disateq.pos.currentSessionId",
                        "disateq.pos.turnEvents",
                        "disateq.pos.lastArqueo",
                        "disateq.pos.ui.closingStage",
                        "disateq.pos.ui.contado",
                      ];
                      keys.forEach(k => localStorage.removeItem(k));
                      window.location.reload();
                    }}
                    className="rounded-xl border border-red-300 bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-red-600 hover:bg-red-50 transition"
                  >
                    RESET OPERACIONAL COMPLETO
                  </button>
                </div>
                <p className="text-[9px] text-amber-500 leading-snug">
                  Solo visible en modo DEV · RESET COMPLETO limpia sesión, caja, stats y stages.
                </p>
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
}

