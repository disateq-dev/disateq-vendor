import { useState, useEffect, useRef, useMemo } from "react";
import { LogIn, Power, Store } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { usePOS } from "../../context/POSContext";
import { loadBusinessConfig } from "../../config/business";

const DAYS = ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];
function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtDate(d: Date) { return `${DAYS[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; }
function fmtTime(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function fmtDuration(from: Date): string {
  const mins = Math.floor((Date.now() - from.getTime()) / 60_000);
  const h = Math.floor(mins / 60);
  return h > 0 ? `${h}h ${pad(mins % 60)}m` : `${pad(mins % 60)}m`;
}

export function LoginScreen() {
  const { operators, loginOperator, cashSession } = usePOS();
  const biz = useMemo(() => loadBusinessConfig(), []);
  const activeOps = operators.filter(o => o.active);

  const [selectedId, setSelectedId] = useState<string | null>(() => activeOps[0]?.id ?? null);
  const [pin,        setPin]        = useState("");
  const [error,      setError]      = useState(false);
  const [flash,      setFlash]      = useState(false);
  const [now,        setNow]        = useState(new Date());

  const pinRef        = useRef("");
  const selectedIdRef = useRef<string | null>(null);
  pinRef.current        = pin;
  selectedIdRef.current = selectedId;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const selected = operators.find(o => o.id === selectedId) ?? null;

  const hasContinuity   = cashSession.isOpen && cashSession.cashBox !== null;
  const continuityOwned = hasContinuity &&
    selected?.blockBase !== null &&
    cashSession.cashBox!.code[0] === String(selected?.blockBase ?? "").charAt(0);

  function tryLogin(p: string) {
    const id = selectedIdRef.current;
    if (!id || p.length < 4) return;
    const ok = loginOperator(id, p);
    if (!ok) {
      setError(true);
      setFlash(true);
      setPin("");
      setTimeout(() => setFlash(false), 500);
    }
  }

  function addDigit(d: string) {
    const curr = pinRef.current;
    if (curr.length >= 6) return;
    const next = curr + d;
    setPin(next);
    setError(false);
    if (next.length === 6) setTimeout(() => tryLogin(next), 0);
  }

  function removeLast() { setPin(p => p.slice(0, -1)); setError(false); }
  function selectOp(id: string) { setSelectedId(id); setPin(""); setError(false); }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key;
      if (k >= "0" && k <= "9") { e.preventDefault(); addDigit(k); }
      else if (k === "Backspace") { e.preventDefault(); removeLast(); }
      else if (k === "Enter")     { e.preventDefault(); tryLogin(pinRef.current); }
      else if (k === "Tab" || k === "ArrowDown") {
        e.preventDefault();
        const idx  = activeOps.findIndex(o => o.id === selectedIdRef.current);
        const next = activeOps[(idx + 1) % activeOps.length];
        if (next) selectOp(next.id);
      } else if (k === "ArrowUp") {
        e.preventDefault();
        const idx  = activeOps.findIndex(o => o.id === selectedIdRef.current);
        const prev = activeOps[(idx - 1 + activeOps.length) % activeOps.length];
        if (prev) selectOp(prev.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOps]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#eef1f8]">

      {/* ── Topbar — misma identidad que la app ── */}
      <header className="flex h-[56px] shrink-0 items-center justify-between bg-[#0f1f3d] px-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#2154d8] shadow-[0_4px_14px_rgba(33,84,216,0.4)]">
            <Store size={16} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[16px] font-semibold leading-none tracking-[0.01em] text-white">DisateQ VENDOR™</span>
            <span className="mt-0.5 text-[10px] text-[#8090b0]">{biz.nombreComercial}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[11px] text-[#6a7a94]">{fmtDate(now)}</p>
            <p className="text-[13px] font-semibold tabular-nums text-[#c8d4e8]">{fmtTime(now)}</p>
          </div>
          <button onClick={() => void invoke("app_exit")} title="Cerrar sistema"
            className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#dc2626] text-white shadow-[0_2px_8px_rgba(220,38,38,0.3)] transition hover:bg-[#b91c1c] active:scale-[0.95]">
            <Power size={15} />
          </button>
        </div>
      </header>

      {/* ── Sheet central dominante ── */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div
          className="flex w-full max-w-[860px] overflow-hidden rounded-2xl border border-[#d4dae8] bg-white"
          style={{ minHeight: "460px", boxShadow: "0 16px 56px rgba(15,31,61,0.13), 0 4px 16px rgba(15,31,61,0.06)" }}
        >

          {/* ── Panel izquierdo: contexto + operadores + continuidad ── */}
          <div className="flex w-[42%] shrink-0 flex-col border-r border-[#e8edf5] bg-[#f4f7fc]">

            {/* Cabecera del panel */}
            <div className="border-b border-[#e8edf5] px-6 py-5">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#9ca3af]">PC-VENTAS01</p>
              <h2 className="mt-1 text-[18px] font-semibold leading-tight text-[#111827]">
                ACCESO<br />OPERACIONAL
              </h2>
            </div>

            {/* Lista de operadores */}
            <div className="flex-1 overflow-y-auto py-1">
              {activeOps.map(op => {
                const sel = op.id === selectedId;
                return (
                  <button key={op.id} onClick={() => selectOp(op.id)}
                    className={`flex w-full items-center gap-3 border-l-2 px-5 py-3.5 text-left transition-colors ${
                      sel
                        ? "border-[#78C487] bg-[#eff8f0]"
                        : "border-transparent hover:bg-white/70"
                    }`}>
                    <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold tracking-wider ${
                      sel ? "bg-[#78C487] text-white" : "border border-[#e4eaf4] bg-white text-[#9ca3af]"
                    }`}>
                      {op.code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-semibold leading-tight ${sel ? "text-[#1e4d2b]" : "text-[#374151]"}`}>
                        {op.name}
                      </p>
                      <p className={`text-[10px] leading-tight ${sel ? "text-[#4a7a55]" : "text-[#9ca3af]"}`}>
                        {op.roleName}
                        {op.blockBase !== null ? ` · BLOQUE ${op.blockBase}` : ""}
                      </p>
                    </div>
                    {sel && <span className="shrink-0 h-2 w-2 rounded-full bg-[#78C487]" />}
                  </button>
                );
              })}
            </div>

            {/* Continuidad operacional */}
            {hasContinuity && cashSession.cashBox && (
              <div className={`mx-4 mb-4 rounded-xl border px-4 py-3 ${
                continuityOwned
                  ? "border-[#78C487]/30 bg-[#eff8f0]"
                  : "border-[#e4eaf4] bg-white"
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${continuityOwned ? "bg-[#78C487]" : "bg-[#c0cad4]"}`} />
                  <p className={`text-[9.5px] font-bold uppercase tracking-wider ${continuityOwned ? "text-[#2d6640]" : "text-[#6b7280]"}`}>
                    {continuityOwned ? "OPERACIÓN DISPONIBLE" : `CAJA ${cashSession.cashBox.code} EN USO`}
                  </p>
                  {cashSession.openedAt && (
                    <span className={`ml-auto text-[9px] tabular-nums ${continuityOwned ? "text-[#4a7a55]" : "text-[#9ca3af]"}`}>
                      {fmtDuration(cashSession.openedAt)}
                    </span>
                  )}
                </div>
                <p className={`mt-0.5 pl-3.5 text-[10px] ${continuityOwned ? "text-[#4a7a55]" : "text-[#9ca3af]"}`}>
                  {continuityOwned
                    ? "Puede continuar sin reapertura"
                    : `${cashSession.operator} · CAJA ${cashSession.cashBox.code}`}
                </p>
              </div>
            )}

            {/* Hint teclado */}
            <div className="border-t border-[#e8edf5] px-5 py-2.5">
              <p className="text-[9px] font-medium uppercase tracking-widest text-[#c0cad4]">
                ↑↓ NAVEGAR · ENTER INGRESAR
              </p>
            </div>
          </div>

          {/* ── Panel derecho: acceso PIN ── */}
          <div className="flex flex-1 flex-col items-center justify-center px-10 py-8 gap-5">

            {selected ? (
              <>
                {/* Operador seleccionado */}
                <div className="text-center">
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <span className="rounded-lg bg-[#eff8f0] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#2d6640]">
                      {selected.code}
                    </span>
                    <span className="text-[16px] font-semibold text-[#111827]">{selected.name}</span>
                  </div>
                  <p className="text-[11px] text-[#9ca3af]">
                    {selected.roleName}
                    {selected.blockBase !== null ? ` · Bloque ${selected.blockBase}` : ""}
                  </p>
                </div>

                {/* PIN dots */}
                <div className="flex items-center gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`h-3.5 w-3.5 rounded-full transition-all duration-100 ${
                      i < pin.length
                        ? (flash ? "bg-red-400 scale-110" : "bg-[#111827] scale-110")
                        : "border-2 border-[#d1d9e4] bg-[#f0f4fa]"
                    }`} />
                  ))}
                </div>

                {/* Error / spacer */}
                <div className="h-4 flex items-center">
                  {error && (
                    <p className="text-[10px] font-semibold text-red-500">PIN incorrecto</p>
                  )}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-2">
                  {["7","8","9","4","5","6","1","2","3"].map(d => (
                    <button key={d} onClick={() => addDigit(d)}
                      className="flex h-12 w-[60px] items-center justify-center rounded-xl bg-[#f0f4fa] text-[18px] font-semibold text-[#111827] transition-colors hover:bg-[#e4eaf4] active:scale-95">
                      {d}
                    </button>
                  ))}
                  <button onClick={removeLast}
                    className="flex h-12 w-[60px] items-center justify-center rounded-xl bg-[#fff1f2] text-[13px] font-bold text-red-400 transition-colors hover:bg-red-50 active:scale-95">
                    ⌫
                  </button>
                  <button onClick={() => addDigit("0")}
                    className="flex h-12 w-[60px] items-center justify-center rounded-xl bg-[#f0f4fa] text-[18px] font-semibold text-[#111827] transition-colors hover:bg-[#e4eaf4] active:scale-95">
                    0
                  </button>
                  <button onClick={() => tryLogin(pin)} disabled={pin.length < 4}
                    className={`flex h-12 w-[60px] items-center justify-center rounded-xl transition-colors active:scale-95 ${
                      pin.length >= 4
                        ? "bg-[#45b356] hover:bg-[#35994a] text-white shadow-[0_2px_10px_rgba(69,179,86,0.35)]"
                        : "bg-[#f0f4fa] text-[#c0cad4] cursor-not-allowed"
                    }`}>
                    <LogIn size={15} strokeWidth={2.5} />
                  </button>
                </div>
              </>
            ) : (
              <p className="text-[13px] text-[#9ca3af]">← Selecciona un operador</p>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
