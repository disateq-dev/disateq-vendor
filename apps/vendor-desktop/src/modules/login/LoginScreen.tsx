import { useState, useEffect, useRef } from "react";
import { LogIn } from "lucide-react";
import { usePOS } from "../../context/POSContext";

const DAYS = ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtDate(d: Date) { return `${DAYS[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; }
function fmtTime(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
function fmtDuration(from: Date): string {
  const mins = Math.floor((Date.now() - from.getTime()) / 60_000);
  const h = Math.floor(mins / 60);
  return h > 0 ? `${h}h ${pad(mins % 60)}m` : `${pad(mins % 60)}m`;
}

export function LoginScreen() {
  const { operators, loginOperator, cashSession } = usePOS();
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

  const hasContinuity  = cashSession.isOpen && cashSession.cashBox !== null;
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
      else if (k === "Enter") { e.preventDefault(); tryLogin(pinRef.current); }
      else if (k === "ArrowDown" || k === "Tab") {
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
    <div className="flex h-screen w-screen items-center justify-center bg-[#0d1117]">
      <div className="w-full max-w-[740px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#161b24] shadow-[0_24px_64px_rgba(0,0,0,0.6)]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78C487]">DISATEQ VENDOR</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3d4a5e]">INICIO DE OPERACIÓN</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] tabular-nums text-[#6b7280]">{fmtDate(now)}</p>
            <p className="mt-0.5 text-[14px] font-bold tabular-nums text-[#e6edf3]">{fmtTime(now)}</p>
          </div>
        </div>

        {/* ── Body: lista + PIN ── */}
        <div className="flex min-h-0">

          {/* Operator list */}
          <div className="w-[42%] shrink-0 border-r border-white/[0.06]">
            <p className="px-4 pt-3 pb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#3d4a5e]">OPERADOR</p>
            {activeOps.map(op => {
              const sel = op.id === selectedId;
              return (
                <button key={op.id} onClick={() => selectOp(op.id)}
                  className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors ${
                    sel ? "border-[#78C487] bg-[#78C487]/[0.07]" : "border-transparent hover:bg-white/[0.03]"
                  }`}>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold tracking-wider ${
                    sel ? "bg-[#78C487] text-[#0d1117]" : "bg-white/[0.07] text-[#6b7280]"
                  }`}>
                    {op.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[12px] font-semibold ${sel ? "text-[#e6edf3]" : "text-[#8b949e]"}`}>
                      {op.name}
                    </p>
                    <p className="text-[10px] text-[#3d4a5e]">
                      {op.roleName}{op.blockBase !== null ? ` · BLQ ${op.blockBase}` : ""}
                    </p>
                  </div>
                  {sel && <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-[#78C487]" />}
                </button>
              );
            })}
          </div>

          {/* PIN panel */}
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-6">
            {selected ? (
              <>
                {/* Context chip */}
                <p className="self-start text-[10px] font-semibold uppercase tracking-widest text-[#3d4a5e]">
                  {selected.name} · {selected.roleName}
                  {selected.blockBase !== null ? ` · BLQ ${selected.blockBase}` : ""}
                </p>

                {/* PIN dots */}
                <div className="flex gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`h-3.5 w-3.5 rounded-full transition-all duration-100 ${
                      i < pin.length
                        ? (flash ? "bg-red-400 scale-105" : "bg-[#e6edf3] scale-110")
                        : "border border-white/[0.18] bg-white/[0.07]"
                    }`} />
                  ))}
                </div>

                {/* Error */}
                <div className="h-4 flex items-center">
                  {error && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                      PIN incorrecto
                    </p>
                  )}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-2">
                  {["7","8","9","4","5","6","1","2","3"].map(d => (
                    <button key={d} onClick={() => addDigit(d)}
                      className="flex h-12 w-[72px] items-center justify-center rounded-xl bg-white/[0.05] text-[18px] font-semibold text-[#e6edf3] transition-colors hover:bg-white/[0.1] active:scale-95">
                      {d}
                    </button>
                  ))}
                  <button onClick={removeLast}
                    className="flex h-12 w-[72px] items-center justify-center rounded-xl bg-white/[0.05] text-[13px] font-bold text-red-400 transition-colors hover:bg-red-500/[0.15] active:scale-95">
                    ⌫
                  </button>
                  <button onClick={() => addDigit("0")}
                    className="flex h-12 w-[72px] items-center justify-center rounded-xl bg-white/[0.05] text-[18px] font-semibold text-[#e6edf3] transition-colors hover:bg-white/[0.1] active:scale-95">
                    0
                  </button>
                  <button onClick={() => tryLogin(pin)} disabled={pin.length < 4}
                    className={`flex h-12 w-[72px] items-center justify-center rounded-xl transition-colors active:scale-95 ${
                      pin.length >= 4
                        ? "bg-[#45b356] hover:bg-[#35994a] text-white"
                        : "bg-white/[0.04] cursor-not-allowed text-[#3d4a5e]"
                    }`}>
                    <LogIn size={15} strokeWidth={2.5} />
                  </button>
                </div>
              </>
            ) : (
              <p className="text-[12px] font-semibold text-[#3d4a5e]">Selecciona un operador</p>
            )}
          </div>

        </div>

        {/* ── Continuity banner ── */}
        {hasContinuity && cashSession.cashBox && (
          <div className={`mx-4 mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 ${
            continuityOwned
              ? "border-[#78C487]/[0.25] bg-[#78C487]/[0.06]"
              : "border-white/[0.06] bg-white/[0.02]"
          }`}>
            <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${continuityOwned ? "bg-[#78C487]" : "bg-[#3d4a5e]"}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${continuityOwned ? "text-[#78C487]" : "text-[#4a5568]"}`}>
                TURNO ACTIVO · CAJA {cashSession.cashBox.code}
                {cashSession.openedAt ? ` · ${fmtDuration(cashSession.openedAt)}` : ""}
              </p>
              <p className="mt-0.5 text-[10px] text-[#6b7280]">
                {continuityOwned
                  ? "Ingresa tu PIN para continuar la operación"
                  : `${cashSession.operator} tiene turno activo`}
              </p>
            </div>
            {continuityOwned && (
              <span className="shrink-0 rounded-md bg-[#78C487]/[0.15] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#78C487]">
                CONTINUAR
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
