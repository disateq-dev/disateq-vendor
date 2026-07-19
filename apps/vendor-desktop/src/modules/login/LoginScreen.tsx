import { useState, useEffect, useRef } from "react";
import { Shield, LogIn, Lock, CheckCircle2, X, Check, Settings } from "lucide-react";
import logoImg from "../../assets/branding/disateq-vendor-login.png";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { usePOS } from "../../context/POSContext";
import { pinAutorizacionStore } from "../../config/pin-autorizacion.store";
import { auditoriaService } from "../../domains/auditoria/auditoria.service";

type LoginStep = "alias" | "pin";
type LoginView  = "keypad" | "pin-change" | "acceso-tecnico";
type LoginOperador = ReturnType<typeof usePOS>["operators"][number];
type OperadorSistemaRow = {
  id: string;
  codigo_operador: string;
  alias: string;
  apellidos: string;
  nombres: string;
  nombre_completo: string;
  dni?: string | null;
  telefono?: string | null;
  codigo_rol: string;
  nombre_rol: string;
  base_bloque?: number | null;
  asignacion_bloque_en?: string | null;
  liberacion_bloque_en?: string | null;
  estado: string;
  motivo_estado?: string | null;
  fecha_estado?: string | null;
  pin: string;
  capacidades: string;
  registrado_en: string;
  registrado_por: string;
};

const PC_MOTIVOS = [
  "OPERADOR OLVIDÓ SU PIN",
  "CAMBIO POR POLÍTICA DE SEGURIDAD",
  "PIN CONOCIDO POR TERCEROS",
  "SOLICITUD DEL GESTOR",
] as const;

const DAYS = ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];
function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtDate(d: Date) {
  return `${DAYS[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
}
function fmtTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function validatePin(p: string): string | null {
  if (!p)                return "Requerido";
  if (!/^\d+$/.test(p)) return "Solo números";
  if (p.length < 4)     return "Mínimo 4 dígitos";
  return null;
}

export function LoginScreen() {
  const { operators, loginOperator, cashSession, resetOperatorPin } = usePOS();
  const [operadoresSistema, setOperadoresSistema] = useState<LoginOperador[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(t); }, []);
  useEffect(() => {
    invoke<OperadorSistemaRow[]>("obtener_operadores").then(rows => {
      setOperadoresSistema(rows.filter(row => row.estado === "SISTEMA").map(row => ({
        id: row.id,
        codigoOperador: row.codigo_operador,
        alias: row.alias,
        apellidos: row.apellidos,
        nombres: row.nombres,
        nombreCompleto: row.nombre_completo,
        dni: row.dni ?? undefined,
        telefono: row.telefono ?? undefined,
        codigoRol: row.codigo_rol,
        nombreRol: row.nombre_rol,
        baseBloque: row.base_bloque ?? null,
        asignacionBloque: row.asignacion_bloque_en
          ? { assignedAt: row.asignacion_bloque_en, releasedAt: row.liberacion_bloque_en ?? undefined }
          : undefined,
        estado: row.estado as LoginOperador["estado"],
        motivoEstado: row.motivo_estado ?? undefined,
        fechaEstado: row.fecha_estado ?? undefined,
        pin: row.pin,
        capacidades: (() => { try { return JSON.parse(row.capacidades) as string[]; } catch { return []; } })(),
        registradoEn: row.registrado_en,
        registradoPor: row.registrado_por,
      })));
    }).catch(() => setOperadoresSistema([]));
  }, []);

  // Vista y paso de login
  const [view,       setView]       = useState<LoginView>("keypad");
  const [step,       setStep]       = useState<LoginStep>("alias");
  const [selectedId, setSelectedId] = useState("");
  const [pin,        setPin]        = useState("");
  const [error,      setError]      = useState<string | null>(null);
  const [now,        setNow]        = useState(new Date());

  // Estado formulario cambio PIN
  const [pcMotivo,     setPcMotivo]     = useState("");
  const [pcAuthCode,   setPcAuthCode]   = useState("");
  const [pcPinNuevo,   setPcPinNuevo]   = useState("");
  const [pcPinConfirm, setPcPinConfirm] = useState("");
  const [pcError,      setPcError]      = useState<string | null>(null);
  const [pcSuccess,    setPcSuccess]    = useState(false);

  // Estado acceso tecnico
  const [selectedSistemaId, setSelectedSistemaId] = useState("");
  const [pinSistema,        setPinSistema]        = useState("");
  const [errorSistema,      setErrorSistema]      = useState<string | null>(null);

  // Operadores normales -- SISTEMA nunca aparece en vista principal
  const activeOps = operators.filter(o => o.estado === "ACTIVO");

  // DOM refs
  const aliasSelectRef   = useRef<HTMLSelectElement>(null);
  const pinInputRef      = useRef<HTMLInputElement>(null);
  const sistemaSelectRef = useRef<HTMLSelectElement>(null);
  const sistemaInputRef  = useRef<HTMLInputElement>(null);
  const pcMotivoRef      = useRef<HTMLSelectElement>(null);
  const pcAuthCodeRef    = useRef<HTMLInputElement>(null);
  const pcPinNuevoRef    = useRef<HTMLInputElement>(null);
  const pcPinConfRef     = useRef<HTMLInputElement>(null);

  // Stable refs
  const pinStateRef     = useRef("");
  const selectedIdRef   = useRef("");
  const loginRef        = useRef(loginOperator);
  const stepRef         = useRef<LoginStep>("alias");
  const viewRef         = useRef<LoginView>("keypad");
  const activeOpsRef    = useRef<LoginOperador[]>([]);
  pinStateRef.current   = pin;
  selectedIdRef.current = selectedId;
  loginRef.current      = loginOperator;
  stepRef.current       = step;
  viewRef.current       = view;
  activeOpsRef.current  = activeOps;

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { try { getCurrentWindow().show().catch(() => {}); } catch { /* no-tauri */ } }, []);
  useEffect(() => { aliasSelectRef.current?.focus(); }, []);
  useEffect(() => { if (view === "pin-change")      setTimeout(() => aliasSelectRef.current?.focus(),   0); }, [view]);
  useEffect(() => { if (view === "acceso-tecnico")  setTimeout(() => sistemaSelectRef.current?.focus(), 0); }, [view]);
  useEffect(() => {
    if (pcSuccess) { const t = setTimeout(() => switchToKeypad(), 3500); return () => clearTimeout(t); }
  }, [pcSuccess]);

  const selected = activeOps.find(o => o.id === selectedId) ?? null;
  const hasTurn  = cashSession.isOpen && cashSession.cashBox !== null;

  const pcCanSave =
    !!selectedId && !!pcMotivo &&
    /^\d{6}$/.test(pcAuthCode) &&
    pcPinNuevo.length >= 4 && pcPinConfirm.length >= 4;

  // Transiciones
  function switchToPinChange() {
    setPcMotivo(""); setPcAuthCode(""); setPcPinNuevo(""); setPcPinConfirm("");
    setPcError(null); setPcSuccess(false);
    setView("pin-change");
  }

  function switchToAccesoTecnico() {
    setSelectedSistemaId(""); setPinSistema(""); setErrorSistema(null);
    setView("acceso-tecnico");
  }

  function switchToKeypad() {
    setView("keypad"); setStep("alias");
    setPin(""); setError(null);
    setSelectedSistemaId(""); setPinSistema(""); setErrorSistema(null);
    setTimeout(() => aliasSelectRef.current?.focus(), 0);
  }

  // Login flow
  function focusPin() {
    setStep("pin");
    setTimeout(() => pinInputRef.current?.focus(), 0);
  }

  function resetToAlias() {
    setStep("alias"); setPin(""); setError(null);
    setTimeout(() => aliasSelectRef.current?.focus(), 0);
  }

  async function attemptLogin(p: string) {
    const id = selectedIdRef.current;
    if (!id || p.length < 4) return;
    const ok = await loginRef.current(id, p);
    if (!ok) { setError("PIN incorrecto"); setPin(""); }
  }

  async function attemptLoginSistema() {
    if (!selectedSistemaId || pinSistema.length < 1) return;
    const ok = await loginRef.current(selectedSistemaId, pinSistema);
    if (!ok) { setErrorSistema("Contraseña incorrecta"); setPinSistema(""); }
  }

  function addDigit(d: string) {
    if (stepRef.current === "alias") focusPin();
    const curr = pinStateRef.current;
    if (curr.length >= 6) return;
    const next = curr + d;
    setPin(next); setError(null);
    if (next.length === 6) {
      const id = selectedIdRef.current;
      setTimeout(async () => {
        if (!id) return;
        const ok = await loginRef.current(id, next);
        if (!ok) { setError("PIN incorrecto"); setPin(""); }
      }, 0);
    }
  }

  function removeLast() { setPin(p => p.slice(0, -1)); setError(null); }
  function selectOp(id: string) { setSelectedId(id); setStep("alias"); setPin(""); setError(null); }

  async function handlePinChange() {
    setPcError(null);
    const id = selectedIdRef.current;
    if (!id)       { setPcError("Seleccione un operador");           aliasSelectRef.current?.focus(); return; }
    if (!pcMotivo) { setPcError("Seleccione un motivo");             pcMotivoRef.current?.focus();    return; }
    if (!/^\d{6}$/.test(pcAuthCode)) {
      setPcError("El código de autorización debe ser exactamente 6 dígitos numéricos");
      pcAuthCodeRef.current?.focus();
      return;
    }
    const errNuevo = validatePin(pcPinNuevo);
    if (errNuevo)  { setPcError(`Nuevo PIN: ${errNuevo}`);           pcPinNuevoRef.current?.focus();  return; }
    if (pcPinNuevo !== pcPinConfirm) { setPcError("Los PINes no coinciden"); pcPinConfRef.current?.focus(); return; }

    // Verificar PIN de autorización contra SQLite
    const pinValido = await pinAutorizacionStore.verificar(pcAuthCode);
    const operador = activeOps.find(o => o.id === id) ?? null;
    const operadorAlias = operador?.alias ?? id;
    const ejecutadoPor = operadorAlias; // quien está en pantalla es quien solicita el cambio

    if (!pinValido) {
      setPcAuthCode("");
      setPcError("Código de autorización incorrecto");
      pcAuthCodeRef.current?.focus();
      // Registrar intento fallido en auditoría
      void auditoriaService.registrar({
        rubro:         "SISTEMA",
        dominio:       "IDENTIDAD",
        tipoOperacion: "CAMBIO_PIN_OPERADOR",
        operadorId:    id,
        operadorAlias: operadorAlias,
        ejecutadoPor:  ejecutadoPor,
        detalle:       { motivo: pcMotivo },
        resultado:     "FALLIDO",
      });
      return;
    }

    resetOperatorPin(id, pcPinNuevo).then(ok => {
      if (!ok) { setPcError("Operador inválido"); aliasSelectRef.current?.focus(); return; }
      // Registrar éxito en auditoría
      void auditoriaService.registrar({
        rubro:         "SISTEMA",
        dominio:       "IDENTIDAD",
        tipoOperacion: "CAMBIO_PIN_OPERADOR",
        operadorId:    id,
        operadorAlias: operadorAlias,
        ejecutadoPor:  ejecutadoPor,
        detalle:       { motivo: pcMotivo },
        resultado:     "EXITOSO",
      });
      setPcSuccess(true);
    }).catch(() => setPcError("Error al actualizar PIN."));
  }

  // Keyboard handler
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k        = e.key;
      const tag      = (e.target as HTMLElement).tagName;
      const curr     = stepRef.current;
      const currView = viewRef.current;

      if (e.ctrlKey && e.shiftKey && k === "O") {
        e.preventDefault();
        if (currView === "keypad") switchToPinChange(); else switchToKeypad();
        return;
      }

      if (k === "Escape") {
        e.preventDefault();
        if (currView === "pin-change" || currView === "acceso-tecnico") { switchToKeypad(); return; }
        if (curr === "pin") { setStep("alias"); setPin(""); setError(null); setTimeout(() => aliasSelectRef.current?.focus(), 0); return; }
        void invoke("app_exit");
        return;
      }

      if (currView !== "keypad") return;
      if (curr === "alias" && tag === "SELECT" && k === "Enter") { e.preventDefault(); focusPin(); return; }
      if (curr === "pin" && tag !== "INPUT" && tag !== "SELECT") {
        if (k >= "0" && k <= "9") { e.preventDefault(); addDigit(k); }
        else if (k === "Backspace") { e.preventDefault(); setPin(p => p.slice(0, -1)); setError(null); }
        else if (k === "Enter") {
          e.preventDefault();
          const id = selectedIdRef.current; const p = pinStateRef.current;
          if (!id || p.length < 4) return;
          loginRef.current(id, p).then(ok => {
            if (!ok) { setError("PIN incorrecto"); setPin(""); }
          }).catch(() => { setError("Error al verificar PIN."); setPin(""); });
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.18s ease" }}>

      {/* SHEET IZQUIERDA */}
      <div
        className="flex w-[45%] shrink-0 flex-col bg-[#f0f4f9] pt-8 pb-5 px-5 cursor-grab active:cursor-grabbing select-none"
        style={{ borderRight: "1px solid #edf2f8" }}
        onMouseDown={(e) => {
          if (e.button === 0) { e.preventDefault(); getCurrentWindow().startDragging().catch(() => {}); }
        }}
      >
        <div className="flex justify-center">
          <img src={logoImg} alt="DISATEQ Vendor" draggable={false} style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
        <div className="[flex-grow:5]" />
        <div className="mb-5 text-right">
          <h2 className="text-[18px] font-black uppercase tracking-[0.16em] text-[#1a2d4e] leading-none mb-1.5 whitespace-nowrap">Acceso Operativo</h2>
          <p className="text-[11px] text-[#6b7a99] leading-snug">Ingrese su alias y PIN para continuar.</p>
        </div>
        <div className="[flex-grow:2]" />
        <div className="mb-5 flex items-center justify-end gap-3">
          <Shield size={22} className="shrink-0 text-[#45b356]" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#45b356] leading-none">Acceso seguro</p>
            <p className="text-[10px] text-[#a0aec0] mt-1 leading-none">Acceso local · sin conexión de red</p>
          </div>
        </div>
        <div className="[flex-grow:3]" />
        <div className="mb-1">
          {hasTurn && cashSession.cashBox ? (
            <div className="rounded-xl bg-[#45b356]/[0.07] px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#45b356]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2d6640]">Turno activo · Caja {cashSession.cashBox.code}</p>
              </div>
              <p className="text-[11px] text-[#4a7a55] pl-4 leading-snug">Puede continuar sin reapertura</p>
            </div>
          ) : (
            <div className="rounded-xl bg-[#45b356]/[0.04] px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#c8d3e0]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7a99]">Sin turno activo</p>
              </div>
              <p className="text-[11px] text-[#a0aec0] pl-4 leading-snug">Se requiere apertura de turno al ingresar</p>
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] text-[#b0bec8] leading-[1.5] text-justify">
            Todos los derechos reservados. Hechos los registros de ley.
            Sujeto a las leyes nacionales e internacionales de derechos de autor.
            Prohibida su reproducción parcial o total.
          </p>
        </div>
      </div>

      {/* SHEET DERECHA */}
      <div className="flex flex-1 flex-col bg-white px-5 pt-8 pb-5">
        <div className="w-full flex flex-col flex-1">

          {/* Fecha + hora */}
          <div className="flex justify-end mb-10">
            <div className="text-right">
              <p className="text-[10.5px] text-[#a0aec0] leading-none tracking-wide">{fmtDate(now)}</p>
              <p className="text-[22px] font-semibold tabular-nums text-[#1a2d4e] leading-tight mt-0.5">{fmtTime(now)}</p>
            </div>
          </div>

          <div className="flex flex-col w-full">

            {/* VISTA: ACCESO TECNICO */}
            {view === "acceso-tecnico" && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Settings size={12} className="text-[#6b7a99] shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b7a99]">Acceso Técnico</span>
                </div>

                <div className="mb-3">
                  <div className="relative">
                    <select
                      ref={sistemaSelectRef}
                      value={selectedSistemaId}
                      onChange={e => { setSelectedSistemaId(e.target.value); setErrorSistema(null); }}
                      className="w-full appearance-none rounded-xl border border-[#e0e8f2] bg-[#f8fafc] px-4 py-2.5 text-[13px] font-semibold text-[#1a2d4e] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition cursor-pointer"
                    >
                      <option value="" disabled hidden>Seleccione usuario técnico</option>
                      {operadoresSistema.map(op => (
                        <option key={op.id} value={op.id}>{op.alias}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#a0aec0]">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="mb-4 relative">
                  <div className="relative">
                    <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8c4d4]" />
                    <input
                      ref={sistemaInputRef}
                      type="password"
                      autoComplete="off"
                      value={pinSistema}
                      onChange={e => { setPinSistema(e.target.value); setErrorSistema(null); }}
                      onKeyDown={e => {
                        if (e.key === "Enter")  { e.preventDefault(); void attemptLoginSistema(); }
                        if (e.key === "Escape") { e.preventDefault(); switchToKeypad(); }
                      }}
                      placeholder="Contraseña"
                      className="w-full rounded-xl border border-[#e0e8f2] bg-[#f8fafc] pl-10 pr-4 py-2.5 text-[15px] font-bold text-[#1a2d4e] placeholder:text-[#cdd5e0] placeholder:tracking-normal placeholder:font-normal placeholder:text-[11px] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition"
                    />
                  </div>
                  {errorSistema && (
                    <p className="absolute left-0 top-full mt-1 text-[10px] font-semibold text-red-500">{errorSistema}</p>
                  )}
                </div>

                <button
                  onClick={() => void attemptLoginSistema()}
                  disabled={!selectedSistemaId || pinSistema.length < 1}
                  className={`w-full h-10 rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.07em] ${
                    selectedSistemaId && pinSistema.length >= 1
                      ? "bg-[#45b356] text-white hover:bg-[#3ca34a] shadow-[0_4px_20px_rgba(69,179,86,0.45)]"
                      : "bg-[#f5f8fc] border border-[#e4edf6] text-[#b8c4d4] cursor-not-allowed"
                  }`}>
                  <LogIn size={14} strokeWidth={2.5} />Entrar
                </button>
              </>
            )}

            {/* VISTAS: KEYPAD y PIN-CHANGE */}
            {view !== "acceso-tecnico" && (
              <>
                {/* Selector operador */}
                <div className="mb-2">
                  <div className="relative">
                    <select
                      ref={aliasSelectRef}
                      value={selectedId}
                      disabled={activeOps.length === 0}
                      onChange={e => selectOp(e.target.value)}
                      onKeyDown={e => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        if (view === "keypad")      focusPin();
                        else if (view === "pin-change") pcMotivoRef.current?.focus();
                      }}
                      className="w-full appearance-none rounded-xl border border-[#e0e8f2] bg-[#f8fafc] px-4 py-2.5 text-[13px] font-semibold text-[#1a2d4e] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition cursor-pointer"
                    >
                      <option value="" disabled hidden>Seleccione operador</option>
                      {activeOps.map(op => (
                        <option key={op.id} value={op.id}>
                          {op.alias}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#a0aec0]">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {activeOps.length === 0 && (
                    <p className="mt-1.5 text-[10px] font-semibold text-amber-600">
                      No hay operadores activos. Contacte al administrador.
                    </p>
                  )}
                </div>

                {/* VISTA: KEYPAD */}
                {view === "keypad" && (
                  <>
                    <div className="mb-1 relative">
                      <div className="relative">
                        <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8c4d4]" />
                        <input
                          ref={pinInputRef}
                          type="password"
                          inputMode="numeric"
                          autoComplete="off"
                          value={pin}
                          onChange={e => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setPin(v); setError(null);
                            if (v.length === 6) setTimeout(() => attemptLogin(v), 0);
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter")  { e.preventDefault(); void attemptLogin(pin); }
                            if (e.key === "Escape") { e.preventDefault(); resetToAlias(); }
                          }}
                          onFocus={() => setStep("pin")}
                          placeholder="Ingrese PIN de 4 a 6 números"
                          maxLength={6}
                          className="w-full rounded-xl border border-[#e0e8f2] bg-[#f8fafc] pl-10 pr-4 py-2.5 text-[18px] font-bold tracking-[0.3em] text-[#1a2d4e] placeholder:text-[#cdd5e0] placeholder:tracking-normal placeholder:font-normal placeholder:text-[11px] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition"
                        />
                      </div>
                      {error && (
                        <p className="absolute left-0 top-full mt-1 text-[10px] font-semibold text-red-500">{error}</p>
                      )}
                    </div>

                    <p className="mb-5 text-[9px] text-[#4b5563] text-right leading-snug">
                      ¿Olvidó su PIN?{" "}
                      <button type="button" onClick={switchToPinChange} className="font-bold underline text-[#2154d8] hover:text-[#1a44b8] transition">Cambiar PIN</button>
                    </p>

                    <div className="grid grid-cols-3 gap-1.5 mb-1 w-full">
                      {["7","8","9","4","5","6","1","2","3"].map(d => (
                        <button key={d} onClick={() => addDigit(d)}
                          className="h-10 rounded-xl border border-[#e4edf6] bg-[#f5f8fc] text-[16px] font-semibold text-[#1a2d4e] transition hover:bg-[#eaf0f9] hover:border-[#ccd8ea] active:scale-95">
                          {d}
                        </button>
                      ))}
                      <button onClick={removeLast}
                        className="h-10 rounded-xl border border-[#fde8e8] bg-[#fff8f8] text-[#f87171] transition hover:bg-[#fff1f1] hover:border-[#fcd4d4] active:scale-95 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.07em]">
                        <span className="text-[13px] leading-none">&#x232B;</span>Borrar
                      </button>
                      <button onClick={() => addDigit("0")}
                        className="h-10 rounded-xl border border-[#e4edf6] bg-[#f5f8fc] text-[16px] font-semibold text-[#1a2d4e] transition hover:bg-[#eaf0f9] hover:border-[#ccd8ea] active:scale-95">
                        0
                      </button>
                      <button
                        onClick={() => void attemptLogin(pin)}
                        disabled={!selected || pin.length < 4}
                        className={`h-10 rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.07em] ${
                          selected && pin.length >= 4
                            ? "bg-[#45b356] border border-[#3ca34a] text-white hover:bg-[#3ca34a] shadow-[0_4px_20px_rgba(69,179,86,0.45)]"
                            : "bg-[#f5f8fc] border border-[#e4edf6] text-[#b8c4d4] cursor-not-allowed"
                        }`}>
                        <LogIn size={14} strokeWidth={2.5} />Entrar
                      </button>
                    </div>
                  </>
                )}

                {/* VISTA: PIN CHANGE */}
                {view === "pin-change" && (
                  <>
                    {pcSuccess ? (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <CheckCircle2 size={32} className="text-[#45b356]" />
                        <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#1a2d4e]">PIN actualizado</p>
                        <p className="text-[10.5px] text-[#6b7a99]">Volviendo al acceso...</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <Lock size={12} className="text-[#6b7a99] shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b7a99]">Cambio de PIN</span>
                        </div>

                        <div className="mb-2">
                          <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0] mb-2">Motivo</label>
                          <div className="relative">
                            <select
                              ref={pcMotivoRef}
                              value={pcMotivo}
                              onChange={e => { setPcMotivo(e.target.value); setPcError(null); }}
                              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); pcAuthCodeRef.current?.focus(); } }}
                              className="w-full appearance-none rounded-xl border border-[#e0e8f2] bg-[#f8fafc] px-4 py-2.5 text-[13px] font-semibold text-[#1a2d4e] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition cursor-pointer"
                            >
                              <option value="" disabled hidden>Seleccionar motivo...</option>
                              {PC_MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#a0aec0]">
                              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="mb-2">
                          <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0] mb-2">Código de Autorización</label>
                          <input
                            ref={pcAuthCodeRef}
                            type="password" inputMode="numeric" autoComplete="off" maxLength={6}
                            value={pcAuthCode}
                            onChange={e => { setPcAuthCode(e.target.value); setPcError(null); }}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); pcPinNuevoRef.current?.focus(); } }}
                            placeholder="6 dígitos"
                            className="w-full rounded-xl border border-[#e0e8f2] bg-[#f8fafc] px-4 py-2.5 text-[13px] font-semibold text-[#1a2d4e] placeholder:text-[#cdd5e0] placeholder:font-normal outline-none focus:border-[var(--dv-color-edit)] focus:ring-2 focus:ring-[var(--dv-color-edit)]/10 transition"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0] mb-2">Nuevo PIN</label>
                            <div className="relative">
                              <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8c4d4]" />
                              <input
                                ref={pcPinNuevoRef}
                                type="password" inputMode="numeric" autoComplete="off" maxLength={6}
                                value={pcPinNuevo}
                                onChange={e => { setPcPinNuevo(e.target.value.replace(/\D/g, "").slice(0, 6)); setPcError(null); }}
                                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); pcPinConfRef.current?.focus(); } }}
                                placeholder="4–6 dígitos"
                                className="w-full rounded-xl border border-[#e0e8f2] bg-[#f8fafc] pl-9 pr-3 py-2.5 text-[15px] font-bold tracking-[0.25em] text-[#1a2d4e] placeholder:tracking-normal placeholder:font-normal placeholder:text-[11px] placeholder:text-[#cdd5e0] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0] mb-2">Confirmar PIN</label>
                            <div className="relative">
                              <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8c4d4]" />
                              <input
                                ref={pcPinConfRef}
                                type="password" inputMode="numeric" autoComplete="off" maxLength={6}
                                value={pcPinConfirm}
                                onChange={e => { setPcPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6)); setPcError(null); }}
                                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handlePinChange(); } }}
                                placeholder="4–6 dígitos"
                                className="w-full rounded-xl border border-[#e0e8f2] bg-[#f8fafc] pl-9 pr-3 py-2.5 text-[15px] font-bold tracking-[0.25em] text-[#1a2d4e] placeholder:tracking-normal placeholder:font-normal placeholder:text-[11px] placeholder:text-[#cdd5e0] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition"
                              />
                            </div>
                          </div>
                        </div>

                        {pcError && (
                          <p className="mt-0.5 mb-1 text-[10px] font-semibold text-red-500">{pcError}</p>
                        )}

                        <div className="mt-4">
                          <button
                            onClick={handlePinChange}
                            disabled={!pcCanSave}
                            className={`w-full h-10 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.07em] transition active:scale-95 ${
                              pcCanSave
                                ? "bg-[#45b356] border border-[#3ca34a] text-white hover:bg-[#3ca34a] shadow-[0_2px_14px_rgba(69,179,86,0.35)]"
                                : "bg-[#f5f8fc] border border-[#e4edf6] text-[#b8c4d4] cursor-not-allowed"
                            }`}>
                            <Check size={14} strokeWidth={2.5} />
                            Confirmar cambio
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

          </div>

          {/* Acciones inferiores */}
          <div className="mt-auto flex items-start justify-between pt-3">
            {view === "keypad" ? (
              <button
                onClick={() => void invoke("app_exit")}
                className="flex items-center gap-1.5 rounded-xl border border-[#e0e8f2] bg-[#f8fafc] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[#b8c4d4] hover:border-[#e8b98a] hover:bg-[#fdf0e6] hover:text-[#b85c10] transition active:scale-95">
                <X size={12} strokeWidth={2.5} />
                Salir
              </button>
            ) : (
              <button
                onClick={switchToKeypad}
                className="flex items-center gap-1.5 rounded-xl border border-[#e0e8f2] bg-[#f8fafc] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[#b8c4d4] hover:border-[#e8b98a] hover:bg-[#fdf0e6] hover:text-[#b85c10] transition active:scale-95">
                <span className="text-[13px] leading-none">←</span>
                Volver
              </button>
            )}
            {view === "keypad" && (
              <button
                onClick={switchToAccesoTecnico}
                title="Acceso técnico"
                className="flex h-5 w-5 items-center justify-center rounded-md transition active:scale-95 text-[#c8d3e0] hover:text-[#8090a8]"
              >
                <Settings size={11} strokeWidth={1.8} />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
