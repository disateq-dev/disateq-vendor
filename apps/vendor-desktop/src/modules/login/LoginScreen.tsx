import { useState, useEffect, useRef, useMemo } from "react";
import { Store, Shield, LogIn, Eye, EyeOff, HelpCircle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { usePOS } from "../../context/POSContext";
import { loadBusinessConfig } from "../../config/business";

const DAYS = ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];
function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtDate(d: Date) {
  return `${DAYS[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
}
function fmtTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function LoginScreen() {
  const { operators, loginOperator, cashSession } = usePOS();
  const biz = useMemo(() => loadBusinessConfig(), []);
  const activeOps = operators.filter(o => o.active);

  const [selectedId, setSelectedId] = useState(() => activeOps[0]?.id ?? "");
  const [pin,        setPin]        = useState("");
  const [showPin,    setShowPin]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [now,        setNow]        = useState(new Date());

  // Refs para keyboard handler estable
  const pinRef         = useRef("");
  const selectedIdRef  = useRef("");
  const loginRef       = useRef(loginOperator);
  pinRef.current        = pin;
  selectedIdRef.current = selectedId;
  loginRef.current      = loginOperator;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const selected = activeOps.find(o => o.id === selectedId) ?? null;
  const hasTurn  = cashSession.isOpen && cashSession.cashBox !== null;

  // ── Lógica de acceso ──────────────────────────────────────────────
  function attemptLogin(p: string) {
    const id = selectedIdRef.current;
    if (!id || p.length < 4) return;
    const ok = loginRef.current(id, p);
    if (!ok) { setError("PIN incorrecto. Intente nuevamente."); setPin(""); }
  }

  function addDigit(d: string) {
    const curr = pinRef.current;
    if (curr.length >= 6) return;
    const next = curr + d;
    const id = selectedIdRef.current;
    setPin(next);
    setError(null);
    if (next.length === 6) {
      setTimeout(() => {
        if (!id) return;
        const ok = loginRef.current(id, next);
        if (!ok) { setError("PIN incorrecto. Intente nuevamente."); setPin(""); }
      }, 0);
    }
  }

  function removeLast() { setPin(p => p.slice(0, -1)); setError(null); }

  function selectOp(id: string) { setSelectedId(id); setPin(""); setError(null); }

  // ── Keyboard handler estable (solo refs + setters estables) ───────
  useEffect(() => {
    function addD(d: string) {
      const curr = pinRef.current;
      if (curr.length >= 6) return;
      const next = curr + d;
      const id = selectedIdRef.current;
      setPin(next);
      setError(null);
      if (next.length === 6) {
        setTimeout(() => {
          if (!id) return;
          const ok = loginRef.current(id, next);
          if (!ok) { setError("PIN incorrecto. Intente nuevamente."); setPin(""); }
        }, 0);
      }
    }

    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "SELECT" || tag === "INPUT") return;
      const k = e.key;
      if (k >= "0" && k <= "9") { e.preventDefault(); addD(k); }
      else if (k === "Backspace") { e.preventDefault(); setPin(p => p.slice(0, -1)); setError(null); }
      else if (k === "Enter") {
        e.preventDefault();
        const id = selectedIdRef.current;
        const p  = pinRef.current;
        if (!id || p.length < 4) return;
        const ok = loginRef.current(id, p);
        if (!ok) { setError("PIN incorrecto. Intente nuevamente."); setPin(""); }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen items-center justify-center bg-[#eef1f8]">

      {/* Sheet operacional flotante */}
      <div
        className="flex w-full max-w-[900px] overflow-hidden rounded-2xl"
        style={{
          minHeight: "520px",
          border: "1px solid #d4dae8",
          boxShadow: "0 24px 64px rgba(15,31,61,0.14), 0 4px 20px rgba(15,31,61,0.07)",
        }}
      >

        {/* ══════════════ PANEL IZQUIERDO ══════════════ */}
        <div className="flex w-[42%] shrink-0 flex-col bg-[#f4f7fc] border-r border-[#e2e8f0]">

          {/* Imagotipo + título */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#2154d8] shadow-[0_4px_14px_rgba(33,84,216,0.4)]">
                <Store size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[16px] font-semibold text-[#0f1f3d] leading-none tracking-[0.01em]">
                  DisateQ VENDOR™
                </p>
                <p className="text-[10px] text-[#8090b0] mt-0.5">{biz.nombreComercial}</p>
              </div>
            </div>

            <h2 className="text-[13.5px] font-bold uppercase tracking-[0.13em] text-[#1e2d4d] leading-snug">
              Acceso operativo<br />al sistema
            </h2>
          </div>

          {/* ACCESO SEGURO */}
          <div className="mx-8 mb-4">
            <div className="flex items-center gap-2.5 rounded-xl border border-[#e2e8f0] bg-white px-4 py-3">
              <Shield size={13} className="shrink-0 text-[#45b356]" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#45b356]">
                  Acceso seguro
                </p>
                <p className="text-[8.5px] text-[#9ca3af] mt-0.5 leading-snug">
                  Autenticación operacional local
                </p>
              </div>
            </div>
          </div>

          {/* Helper contextual — UNO SOLO */}
          <div className="mx-8 mb-5">
            {hasTurn && cashSession.cashBox ? (
              <div className="rounded-xl border border-[#78C487]/25 bg-[#f0fbf1] px-4 py-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#45b356]" />
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#2d6640]">
                    Turno activo · Caja {cashSession.cashBox.code}
                  </p>
                </div>
                <p className="text-[9.5px] text-[#4a7a55] pl-3 leading-snug">
                  Puede continuar sin reapertura
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#e8edf5] bg-white px-4 py-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d1d9e0]" />
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#6b7280]">
                    Sin turno activo
                  </p>
                </div>
                <p className="text-[9.5px] text-[#9ca3af] pl-3 leading-snug">
                  Abrir caja en Gestión Turno
                </p>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Microtext + copyright */}
          <div className="border-t border-[#e2e8f0] px-8 py-6">
            <p className="text-[10.5px] text-[#6b7280] leading-relaxed mb-4">
              Ingrese su usuario y PIN<br />para acceder al sistema.
            </p>
            <p className="text-[7.5px] text-[#c0cad4] leading-[1.75]">
              Todos los derechos reservados. Hechos los registros de ley.
              Sujeto a las leyes nacionales e internacionales de derechos de autor.
              Prohibida su reproducción parcial o total.
            </p>
          </div>
        </div>

        {/* ══════════════ PANEL DERECHO ══════════════ */}
        <div className="flex flex-1 flex-col bg-white px-9 py-7">

          {/* Fecha + hora */}
          <div className="flex justify-end mb-7">
            <div className="text-right">
              <p className="text-[10.5px] text-[#9ca3af] leading-none">{fmtDate(now)}</p>
              <p className="text-[20px] font-semibold tabular-nums text-[#111827] leading-tight mt-0.5">
                {fmtTime(now)}
              </p>
            </div>
          </div>

          {/* USUARIO */}
          <div className="mb-4">
            <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#6b7280] mb-2">
              Usuario
            </label>
            <div className="relative">
              <select
                value={selectedId}
                onChange={e => selectOp(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#d4dae8] bg-[#f8fafc] px-4 py-3 text-[13px] font-semibold text-[#111827] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition cursor-pointer"
              >
                {activeOps.length === 0 && (
                  <option value="">Sin operadores activos</option>
                )}
                {activeOps.map(op => (
                  <option key={op.id} value={op.id}>
                    {op.code} · {op.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* PIN */}
          <div className="mb-5">
            <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#6b7280] mb-2">
              PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPin(v);
                  setError(null);
                  if (v.length === 6) setTimeout(() => attemptLogin(v), 0);
                }}
                placeholder="· · · · · ·"
                maxLength={6}
                className="w-full rounded-xl border border-[#d4dae8] bg-[#f8fafc] pl-4 pr-11 py-3 text-[18px] font-bold tracking-[0.3em] text-[#111827] placeholder:text-[#d1d9e0] placeholder:tracking-[0.2em] placeholder:text-[14px] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPin(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#c0cad4] hover:text-[#6b7280] transition"
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
          <div className="grid grid-cols-3 gap-2 mb-4">
            {["7","8","9","4","5","6","1","2","3"].map(d => (
              <button key={d} onClick={() => addDigit(d)}
                className="h-11 rounded-xl bg-[#f0f4fa] text-[16px] font-semibold text-[#111827] transition hover:bg-[#e4eaf4] active:scale-95">
                {d}
              </button>
            ))}
            <button onClick={removeLast}
              className="h-11 rounded-xl bg-[#fff1f2] text-[15px] font-bold text-red-400 transition hover:bg-red-50 active:scale-95">
              ⌫
            </button>
            <button onClick={() => addDigit("0")}
              className="h-11 rounded-xl bg-[#f0f4fa] text-[16px] font-semibold text-[#111827] transition hover:bg-[#e4eaf4] active:scale-95">
              0
            </button>
            <button
              onClick={() => attemptLogin(pin)}
              disabled={!selected || pin.length < 4}
              className={`h-11 rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] ${
                selected && pin.length >= 4
                  ? "bg-[#45b356] text-white hover:bg-[#35994a] shadow-[0_2px_10px_rgba(69,179,86,0.35)]"
                  : "bg-[#f0f4fa] text-[#c0cad4] cursor-not-allowed"
              }`}
            >
              <LogIn size={13} strokeWidth={2.5} />
              Entrar
            </button>
          </div>

          <div className="flex-1" />

          {/* Acciones inferiores */}
          <div className="flex items-center justify-between border-t border-[#f0f4fa] pt-4">
            <button
              onClick={() => void invoke("app_exit")}
              className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c0cad4] hover:text-[#dc2626] transition"
            >
              Cancelar
            </button>
            <button
              className="flex items-center gap-1.5 text-[10px] font-medium text-[#c0cad4] hover:text-[#6b7280] transition"
            >
              <HelpCircle size={11} />
              ¿Olvidó su PIN?
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
