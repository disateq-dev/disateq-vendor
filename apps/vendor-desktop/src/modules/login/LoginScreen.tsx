import { useState, useEffect, useRef } from "react";
import { Shield, LogIn, Eye, EyeOff, HelpCircle, Lock, CheckCircle2 } from "lucide-react";
import logoImg from "../../assets/branding/disateq-vendor-login.png";
import { invoke } from "@tauri-apps/api/core";
import { usePOS } from "../../context/POSContext";

type LoginStep = "alias" | "pin";
type LoginView  = "keypad" | "pin-change";

const PC_MOTIVOS = [
  "OLVIDO PIN",
  "CAMBIO PREVENTIVO",
  "PIN COMPROMETIDO",
  "RECOMENDACIÓN PERIÓDICA",
  "CAMBIO SUPERVISOR",
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
  if (!p)               return "Requerido";
  if (!/^\d+$/.test(p)) return "Solo números";
  if (p.length < 4)    return "Mínimo 4 dígitos";
  return null;
}

export function LoginScreen() {
  const { operators, loginOperator, cashSession, changeOperatorPinById } = usePOS();
  const activeOps = operators.filter(o => o.active);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(t); }, []);

  // ── View & login step ─────────────────────────────────────────────
  const [view,       setView]       = useState<LoginView>("keypad");
  const [step,       setStep]       = useState<LoginStep>("alias");
  const [selectedId, setSelectedId] = useState(() => activeOps[0]?.id ?? "");
  const [pin,        setPin]        = useState("");
  const [showPin,    setShowPin]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [now,        setNow]        = useState(new Date());

  // ── Pin-change form state ─────────────────────────────────────────
  const [pcMotivo,     setPcMotivo]     = useState("");
  const [pcPinActual,  setPcPinActual]  = useState("");
  const [pcPinNuevo,   setPcPinNuevo]   = useState("");
  const [pcPinConfirm, setPcPinConfirm] = useState("");
  const [pcError,      setPcError]      = useState<string | null>(null);
  const [pcSuccess,    setPcSuccess]    = useState(false);

  // ── DOM refs ──────────────────────────────────────────────────────
  const aliasSelectRef = useRef<HTMLSelectElement>(null);
  const pinInputRef    = useRef<HTMLInputElement>(null);
  const pcMotivoRef    = useRef<HTMLSelectElement>(null);
  const pcPinActualRef = useRef<HTMLInputElement>(null);
  const pcPinNuevoRef  = useRef<HTMLInputElement>(null);
  const pcPinConfRef   = useRef<HTMLInputElement>(null);

  // ── Stable refs para keyboard handler ────────────────────────────
  const pinStateRef     = useRef("");
  const selectedIdRef   = useRef("");
  const loginRef        = useRef(loginOperator);
  const stepRef         = useRef<LoginStep>("alias");
  const viewRef         = useRef<LoginView>("keypad");
  pinStateRef.current   = pin;
  selectedIdRef.current = selectedId;
  loginRef.current      = loginOperator;
  stepRef.current       = step;
  viewRef.current       = view;

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Autofocus alias al montar
  useEffect(() => { aliasSelectRef.current?.focus(); }, []);

  // Autofocus primer campo al entrar a pin-change
  useEffect(() => {
    if (view === "pin-change") {
      setTimeout(() => pcMotivoRef.current?.focus(), 0);
    }
  }, [view]);

  // Auto-volver tras éxito pin-change
  useEffect(() => {
    if (pcSuccess) {
      const t = setTimeout(() => switchToKeypad(), 2200);
      return () => clearTimeout(t);
    }
  }, [pcSuccess]);

  const selected = activeOps.find(o => o.id === selectedId) ?? null;
  const hasTurn  = cashSession.isOpen && cashSession.cashBox !== null;

  // ── Transiciones de view ──────────────────────────────────────────

  function switchToPinChange() {
    setPcMotivo(""); setPcPinActual(""); setPcPinNuevo(""); setPcPinConfirm("");
    setPcError(null); setPcSuccess(false);
    setView("pin-change");
  }

  function switchToKeypad() {
    setView("keypad");
    setStep("alias");
    setPin(""); setError(null);
    setTimeout(() => aliasSelectRef.current?.focus(), 0);
  }

  // ── Login flow ────────────────────────────────────────────────────

  function focusPin() {
    setStep("pin");
    setTimeout(() => pinInputRef.current?.focus(), 0);
  }

  function resetToAlias() {
    setStep("alias");
    setPin(""); setError(null);
    setTimeout(() => aliasSelectRef.current?.focus(), 0);
  }

  function attemptLogin(p: string) {
    const id = selectedIdRef.current;
    if (!id || p.length < 4) return;
    const ok = loginRef.current(id, p);
    if (!ok) { setError("PIN incorrecto. Intente nuevamente."); setPin(""); }
  }

  function addDigit(d: string) {
    if (stepRef.current === "alias") focusPin();
    const curr = pinStateRef.current;
    if (curr.length >= 6) return;
    const next = curr + d;
    setPin(next);
    setError(null);
    if (next.length === 6) {
      const id = selectedIdRef.current;
      setTimeout(() => {
        if (!id) return;
        const ok = loginRef.current(id, next);
        if (!ok) { setError("PIN incorrecto. Intente nuevamente."); setPin(""); }
      }, 0);
    }
  }

  function removeLast() { setPin(p => p.slice(0, -1)); setError(null); }

  function selectOp(id: string) {
    setSelectedId(id);
    setStep("alias");
    setPin(""); setError(null);
  }

  // ── Pin-change submit ─────────────────────────────────────────────

  function handlePinChange() {
    setPcError(null);
    if (!pcMotivo) { setPcError("Seleccione un motivo"); pcMotivoRef.current?.focus(); return; }
    const errActual = validatePin(pcPinActual);
    if (errActual) { setPcError(`PIN actual: ${errActual}`); pcPinActualRef.current?.focus(); return; }
    const errNuevo = validatePin(pcPinNuevo);
    if (errNuevo) { setPcError(`Nuevo PIN: ${errNuevo}`); pcPinNuevoRef.current?.focus(); return; }
    if (pcPinNuevo === pcPinActual) { setPcError("El nuevo PIN debe ser diferente al actual"); pcPinNuevoRef.current?.focus(); return; }
    if (pcPinNuevo !== pcPinConfirm) { setPcError("Los PINes no coinciden"); pcPinConfRef.current?.focus(); return; }
    const id = selectedIdRef.current;
    if (!id) { setPcError("Seleccione un operador"); return; }
    const ok = changeOperatorPinById(id, pcPinActual, pcPinNuevo);
    if (!ok) { setPcError("PIN actual incorrecto"); setPcPinActual(""); setTimeout(() => pcPinActualRef.current?.focus(), 0); return; }
    setPcSuccess(true);
  }

  // ── Keyboard handler global ───────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k    = e.key;
      const tag  = (e.target as HTMLElement).tagName;
      const curr = stepRef.current;
      const currView = viewRef.current;

      // Ctrl+Shift+O — toggle pin-change (solo desde keypad)
      if (e.ctrlKey && e.shiftKey && k === "O") {
        e.preventDefault();
        if (currView === "keypad") switchToPinChange();
        else switchToKeypad();
        return;
      }

      // Escape
      if (k === "Escape") {
        e.preventDefault();
        if (currView === "pin-change") { switchToKeypad(); return; }
        if (curr === "pin") { setStep("alias"); setPin(""); setError(null); setTimeout(() => aliasSelectRef.current?.focus(), 0); return; }
        void invoke("app_exit");
        return;
      }

      // Pin-change view: dejar que inputs manejen su propio teclado
      if (currView === "pin-change") return;

      // Keypad view
      if (curr === "alias" && tag === "SELECT" && k === "Enter") { e.preventDefault(); focusPin(); return; }

      if (curr === "pin" && tag !== "INPUT" && tag !== "SELECT") {
        if (k >= "0" && k <= "9") { e.preventDefault(); addDigit(k); }
        else if (k === "Backspace") { e.preventDefault(); setPin(p => p.slice(0, -1)); setError(null); }
        else if (k === "Enter") {
          e.preventDefault();
          const id = selectedIdRef.current;
          const p  = pinStateRef.current;
          if (!id || p.length < 4) return;
          const ok = loginRef.current(id, p);
          if (!ok) { setError("PIN incorrecto. Intente nuevamente."); setPin(""); }
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-screen"
      style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.18s ease" }}
    >
      {/* ══ SHEET IZQUIERDA — 40% ══ */}
      <div className="flex w-[40%] shrink-0 flex-col bg-[#f0f4f9]" style={{ borderRight: "1px solid #edf2f8" }}>

        <div style={{ flexGrow: 1 }} />

        <div className="px-8 pb-2 flex justify-center">
          <img src={logoImg} alt="DISATEQ Vendor" draggable={false} style={{ width: "95%", height: "auto", display: "block" }} />
        </div>

        <div style={{ flexGrow: 5 }} />

        <div className="px-8 mb-5">
          <div className="text-right mb-6">
            <h2 className="text-[18px] font-black uppercase tracking-[0.16em] text-[#1a2d4e] leading-none mb-1.5">
              Acceso Operativo
            </h2>
            <p className="text-[11px] text-[#6b7a99] leading-snug">
              Ingrese su usuario y PIN<br />para acceder al sistema.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Shield size={24} className="shrink-0 text-[#45b356]" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#45b356] leading-none">Acceso seguro</p>
              <p className="text-[10px] text-[#a0aec0] mt-1 leading-none">Conexión protegida y cifrada</p>
            </div>
          </div>
        </div>

        <div style={{ flexGrow: 4 }} />

        <div className="px-8 mb-4">
          {hasTurn && cashSession.cashBox ? (
            <div className="rounded-xl border border-[#78C487]/25 bg-[#f0fbf1] px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#45b356]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2d6640]">
                  Turno activo · Caja {cashSession.cashBox.code}
                </p>
              </div>
              <p className="text-[11px] text-[#4a7a55] pl-4 leading-snug">Puede continuar sin reapertura</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#dde6f0] bg-white/60 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#c8d3e0]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7a99]">Sin turno activo</p>
              </div>
              <p className="text-[11px] text-[#a0aec0] pl-4 leading-snug">Abrir caja en Gestión Turno</p>
            </div>
          )}
        </div>

        <div className="px-8 mt-9">
          <p className="text-[10px] text-[#b0bec8] leading-[1.5]">
            Todos los derechos reservados. Hechos los registros de ley.
            Sujeto a las leyes nacionales e internacionales de derechos de autor.
            Prohibida su reproducción parcial o total.
          </p>
        </div>

        <div style={{ flexGrow: 1 }} />
      </div>

      {/* ══ SHEET DERECHA — 60% ══ */}
      <div className="flex flex-1 flex-col bg-white px-10 py-3">

        <div className="flex-1" />

        {/* Fecha + hora */}
        <div className="flex justify-end mb-4">
          <div className="text-right">
            <p className="text-[10.5px] text-[#a0aec0] leading-none tracking-wide">{fmtDate(now)}</p>
            <p className="text-[22px] font-semibold tabular-nums text-[#1a2d4e] leading-tight mt-0.5">{fmtTime(now)}</p>
          </div>
        </div>

        <div className="flex flex-col w-full max-w-[360px] mx-auto">

          {/* USUARIO — siempre visible */}
          <div className="mb-2">
            <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0] mb-2">
              Usuario (Alias)
            </label>
            <div className="relative">
              <select
                ref={aliasSelectRef}
                value={selectedId}
                onChange={e => selectOp(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && view === "keypad") { e.preventDefault(); focusPin(); } }}
                className="w-full appearance-none rounded-xl border border-[#e0e8f2] bg-[#f8fafc] px-4 py-3 text-[13px] font-semibold text-[#1a2d4e] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition cursor-pointer"
              >
                {activeOps.length === 0 && <option value="">Sin operadores activos</option>}
                {activeOps.map(op => (
                  <option key={op.id} value={op.id}>{op.code} · {op.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#a0aec0]">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* ── VISTA: KEYPAD ─────────────────────────────────────── */}
          {view === "keypad" && (
            <>
              {/* PIN */}
              <div className="mb-2">
                <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0] mb-2">PIN</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8c4d4]" />
                  <input
                    ref={pinInputRef}
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    autoComplete="off"
                    value={pin}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setPin(v); setError(null);
                      if (v.length === 6) setTimeout(() => attemptLogin(v), 0);
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter") { e.preventDefault(); attemptLogin(pin); }
                      if (e.key === "Escape") { e.preventDefault(); resetToAlias(); }
                    }}
                    onFocus={() => setStep("pin")}
                    placeholder="· · · · · ·"
                    maxLength={6}
                    className="w-full rounded-xl border border-[#e0e8f2] bg-[#f8fafc] pl-10 pr-11 py-3 text-[18px] font-bold tracking-[0.3em] text-[#1a2d4e] placeholder:text-[#cdd5e0] placeholder:tracking-[0.2em] placeholder:text-[14px] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition"
                  />
                  <button
                    type="button" tabIndex={-1}
                    onClick={() => setShowPin(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b8c4d4] hover:text-[#6b7a99] transition"
                  >
                    {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {error ? (
                  <p className="mt-1.5 text-[10px] font-semibold text-red-500">{error}</p>
                ) : (
                  <div className="h-5" />
                )}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-2 mb-4 w-full">
                {["7","8","9","4","5","6","1","2","3"].map(d => (
                  <button key={d} onClick={() => addDigit(d)}
                    className="h-12 rounded-xl border border-[#e4edf6] bg-[#f5f8fc] text-[17px] font-semibold text-[#1a2d4e] transition hover:bg-[#eaf0f9] hover:border-[#ccd8ea] active:scale-95">
                    {d}
                  </button>
                ))}
                <button onClick={removeLast}
                  className="h-12 rounded-xl border border-[#fde8e8] bg-[#fff8f8] text-[#f87171] transition hover:bg-[#fff1f1] hover:border-[#fcd4d4] active:scale-95 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.07em]">
                  <span className="text-[13px] leading-none">⌫</span>Borrar
                </button>
                <button onClick={() => addDigit("0")}
                  className="h-12 rounded-xl border border-[#e4edf6] bg-[#f5f8fc] text-[17px] font-semibold text-[#1a2d4e] transition hover:bg-[#eaf0f9] hover:border-[#ccd8ea] active:scale-95">
                  0
                </button>
                <button
                  onClick={() => attemptLogin(pin)}
                  disabled={!selected || pin.length < 4}
                  className={`h-12 rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.07em] ${
                    selected && pin.length >= 4
                      ? "bg-[#45b356] border border-[#3ca34a] text-white hover:bg-[#3ca34a] shadow-[0_4px_20px_rgba(69,179,86,0.45)]"
                      : "bg-[#f5f8fc] border border-[#e4edf6] text-[#b8c4d4] cursor-not-allowed"
                  }`}>
                  <LogIn size={14} strokeWidth={2.5} />Entrar
                </button>
              </div>
            </>
          )}

          {/* ── VISTA: PIN CHANGE ─────────────────────────────────── */}
          {view === "pin-change" && (
            <>
              {/* Header contextual */}
              <div className="mb-3 pb-3 border-b border-[#f0f4f9]">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0]">Cambio de PIN</p>
              </div>

              {pcSuccess ? (
                /* Success state */
                <div className="flex flex-col items-center gap-3 py-6">
                  <CheckCircle2 size={32} className="text-[#45b356]" />
                  <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#1a2d4e]">PIN actualizado</p>
                  <p className="text-[10.5px] text-[#6b7a99]">Volviendo al acceso...</p>
                </div>
              ) : (
                <>
                  {/* MOTIVO — primero */}
                  <div className="mb-2">
                    <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0] mb-2">Motivo</label>
                    <div className="relative">
                      <select
                        ref={pcMotivoRef}
                        value={pcMotivo}
                        onChange={e => { setPcMotivo(e.target.value); setPcError(null); }}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); pcPinActualRef.current?.focus(); } }}
                        className="w-full appearance-none rounded-xl border border-[#e0e8f2] bg-[#f8fafc] px-4 py-3 text-[12px] font-semibold text-[#1a2d4e] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition cursor-pointer"
                      >
                        <option value="">Seleccionar motivo...</option>
                        {PC_MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#a0aec0]">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* PIN Actual */}
                  <div className="mb-2">
                    <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0] mb-2">PIN Actual</label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8c4d4]" />
                      <input
                        ref={pcPinActualRef}
                        type="password" inputMode="numeric" autoComplete="off" maxLength={6}
                        value={pcPinActual}
                        onChange={e => { setPcPinActual(e.target.value.replace(/\D/g, "").slice(0, 6)); setPcError(null); }}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); pcPinNuevoRef.current?.focus(); } }}
                        placeholder="· · · ·"
                        className="w-full rounded-xl border border-[#e0e8f2] bg-[#f8fafc] pl-9 pr-4 py-2.5 text-[15px] font-bold tracking-[0.25em] text-[#1a2d4e] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition"
                      />
                    </div>
                  </div>

                  {/* Nuevo PIN */}
                  <div className="mb-2">
                    <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0] mb-2">Nuevo PIN</label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8c4d4]" />
                      <input
                        ref={pcPinNuevoRef}
                        type="password" inputMode="numeric" autoComplete="off" maxLength={6}
                        value={pcPinNuevo}
                        onChange={e => { setPcPinNuevo(e.target.value.replace(/\D/g, "").slice(0, 6)); setPcError(null); }}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); pcPinConfRef.current?.focus(); } }}
                        placeholder="· · · ·"
                        className="w-full rounded-xl border border-[#e0e8f2] bg-[#f8fafc] pl-9 pr-4 py-2.5 text-[15px] font-bold tracking-[0.25em] text-[#1a2d4e] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition"
                      />
                    </div>
                  </div>

                  {/* Confirmar PIN */}
                  <div className="mb-2">
                    <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0] mb-2">Confirmar Nuevo PIN</label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8c4d4]" />
                      <input
                        ref={pcPinConfRef}
                        type="password" inputMode="numeric" autoComplete="off" maxLength={6}
                        value={pcPinConfirm}
                        onChange={e => { setPcPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6)); setPcError(null); }}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handlePinChange(); } }}
                        placeholder="· · · ·"
                        className="w-full rounded-xl border border-[#e0e8f2] bg-[#f8fafc] pl-9 pr-4 py-2.5 text-[15px] font-bold tracking-[0.25em] text-[#1a2d4e] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition"
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {pcError ? (
                    <p className="mt-0.5 mb-1 text-[10px] font-semibold text-red-500">{pcError}</p>
                  ) : (
                    <div className="h-4" />
                  )}

                  {/* Botones */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      onClick={switchToKeypad}
                      className="h-11 rounded-xl border border-[#e0e8f2] bg-[#f5f8fc] text-[11px] font-bold uppercase tracking-[0.07em] text-[#6b7a99] hover:bg-[#eaf0f9] transition active:scale-95">
                      Volver
                    </button>
                    <button
                      onClick={handlePinChange}
                      className="h-11 rounded-xl bg-[#45b356] border border-[#3ca34a] text-white text-[11px] font-bold uppercase tracking-[0.07em] hover:bg-[#3ca34a] transition active:scale-95 shadow-[0_2px_14px_rgba(69,179,86,0.35)]">
                      Guardar
                    </button>
                  </div>
                </>
              )}
            </>
          )}

        </div>

        {/* Acciones inferiores */}
        <div className="flex items-center justify-between border-t border-[#f0f4f9] pt-4">
          <button
            onClick={() => void invoke("app_exit")}
            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b8c4d4] hover:text-[#dc2626] transition">
            Cancelar
          </button>
          {view === "keypad" && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={switchToPinChange}
                className="flex items-center gap-1.5 text-[10px] font-medium text-[#2154d8] hover:text-[#1a44b8] transition">
                <HelpCircle size={11} />¿Olvidó su PIN?
              </button>
              <p className="text-[9px] text-[#4b5563] text-right leading-snug">
                Podrá regenerarlo en la siguiente ventana{" "}
                <span onClick={switchToPinChange} className="font-bold cursor-pointer hover:underline">CLIC AQUÍ</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex-1" />
      </div>
    </div>
  );
}
