import { useState, useEffect } from "react";
import { Clock, LogIn, LogOut, Lock } from "lucide-react";
import { usePOS, type CashBox, type CashBoxType } from "../../context/POSContext";

function formatTime(d: Date): string {
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(from: Date): string {
  const mins = Math.floor((Date.now() - from.getTime()) / 60_000);
  const h = Math.floor(mins / 60);
  const m = String(mins % 60).padStart(2, "0");
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function typeLabel(t: CashBoxType): string {
  if (t === "normal") return "OPERACIONAL";
  if (t === "contingency-1") return "CONTINGENCIA 1";
  return "CONTINGENCIA 2";
}

function prereqCode(box: CashBox): string {
  if (box.type === "contingency-1") return box.code.slice(0, 2) + "0";
  if (box.type === "contingency-2") return box.code.slice(0, 2) + "1";
  return "";
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10.5px] font-semibold uppercase tracking-widest text-[#c0cad4]">{label}</span>
      <span className={`text-[11.5px] font-semibold ${accent ? "text-emerald-600" : "text-[#374151]"}`}>{value}</span>
    </div>
  );
}

function BoxStatusBadge({ box, isActive }: { box: CashBox; isActive: boolean }) {
  if (isActive) return (
    <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-emerald-700">
      ACTIVA
    </span>
  );
  if (box.used) return (
    <span className="rounded-lg bg-[#f4f7fb] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[#c0cad4]">
      CERRADA
    </span>
  );
  if (!box.available) return (
    <span className="flex items-center gap-1 rounded-lg bg-[#fef9f0] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[#c08000]">
      <Lock size={8} strokeWidth={2.5} />
      REQ. {prereqCode(box)}
    </span>
  );
  return (
    <span className="rounded-lg bg-[#f0fdf4] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[#16a34a]">
      DISPONIBLE
    </span>
  );
}

function BoxRow({ box, isActive, isSelected, onSelect }: {
  box: CashBox;
  isActive: boolean;
  isSelected: boolean;
  onSelect?: () => void;
}) {
  const clickable = !isActive && box.available && !!onSelect;

  let cls = "flex items-center gap-3 rounded-2xl px-4 py-2.5 transition select-none";
  if (isActive)       cls += " bg-emerald-50 ring-1 ring-emerald-200";
  else if (isSelected) cls += " bg-[#edf4ff] ring-1 ring-[#2154d8]/20";
  else if (clickable)  cls += " cursor-pointer hover:bg-[#f4f7fb]";
  else                 cls += " opacity-50 cursor-default";

  const dotColor = isActive ? "bg-emerald-500" : isSelected ? "bg-[#2154d8]" : box.available ? "bg-[#34d399]" : "bg-[#d1d5db]";
  const codeColor = isActive ? "text-emerald-700" : isSelected ? "text-[#2154d8]" : box.used || !box.available ? "text-[#c0cad4]" : "text-[#111827]";
  const labelColor = isActive ? "text-emerald-600" : isSelected ? "text-[#4b75e6]" : "text-[#c0cad4]";

  return (
    <div className={cls} onClick={clickable ? onSelect : undefined}>
      <div className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
      <div className="flex flex-1 items-baseline gap-2">
        <span className={`text-[14px] font-bold tabular-nums ${codeColor}`}>{box.code}</span>
        <span className={`text-[11px] font-semibold ${labelColor}`}>{typeLabel(box.type)}</span>
      </div>
      <BoxStatusBadge box={box} isActive={isActive} />
    </div>
  );
}

const SERIES = ["1", "2", "3"] as const;

export function CashWorkspace() {
  const { cashSession, cashBoxes, suggestedCashBox, openCashSession, closeCashSession } = usePOS();
  const { isOpen, cashBox: activeBox, operator, terminal, openedAt } = cashSession;

  const [selectedCode, setSelectedCode] = useState<string>(() => suggestedCashBox?.code ?? "100");
  const [duration, setDuration] = useState("");

  useEffect(() => {
    if (!isOpen && suggestedCashBox) setSelectedCode(suggestedCashBox.code);
  }, [isOpen, suggestedCashBox]);

  useEffect(() => {
    if (!openedAt) { setDuration(""); return; }
    const update = () => setDuration(formatDuration(openedAt));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [openedAt]);

  const effectiveBox = isOpen ? activeBox : (cashBoxes.find(b => b.code === selectedCode) ?? suggestedCashBox);
  const canOpen = !isOpen && !!effectiveBox?.available;

  return (
    <section className="flex min-h-0 flex-1 gap-3">

      {/* LEFT: status + actions */}
      <div className="flex w-[252px] shrink-0 flex-col gap-3">

        {/* Session status */}
        <div className={`flex flex-col gap-4 rounded-[24px] border bg-white px-5 py-5 shadow-[0_4px_18px_rgba(15,23,42,0.04)] transition-colors ${
          isOpen ? "border-emerald-200" : "border-[#e4e9f0]"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] transition-colors ${
              isOpen ? "bg-emerald-50 text-emerald-600" : "bg-[#f1f5f9] text-[#9ca3af]"
            }`}>
              <Clock size={20} strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isOpen ? "bg-emerald-500" : "bg-[#d1d5db]"}`} />
                <span className={`text-[10.5px] font-bold uppercase tracking-widest ${isOpen ? "text-emerald-600" : "text-[#9ca3af]"}`}>
                  {isOpen ? "TURNO ABIERTO" : "TURNO CERRADO"}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12px] font-semibold text-[#374151]">
                {isOpen && activeBox
                  ? `CAJA ${activeBox.code} · ${typeLabel(activeBox.type)}`
                  : "Sin apertura operacional"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <InfoRow label="Operador" value={operator} />
            <InfoRow label="Terminal" value={terminal} />
            {isOpen && openedAt && (
              <InfoRow label="Activo" value={`${formatTime(openedAt)} · ${duration}`} accent />
            )}
          </div>
        </div>

        {/* Suggestion */}
        {!isOpen && suggestedCashBox && (
          <div className="rounded-[20px] border border-[#e8eef6] bg-[#f8fafd] px-5 py-3.5">
            <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.15em] text-[#b0bac8]">CAJA SUGERIDA</p>
            <p className="text-[18px] font-bold leading-none text-[#2154d8]">{suggestedCashBox.code}</p>
            <p className="mt-1 text-[10.5px] font-semibold text-[#9ca3af]">{typeLabel(suggestedCashBox.type)}</p>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => effectiveBox && openCashSession(effectiveBox.code)}
            disabled={!canOpen}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-bold uppercase tracking-widest transition ${
              canOpen
                ? "bg-emerald-600 text-white shadow-[0_4px_14px_rgba(5,150,105,0.28)] hover:bg-emerald-700 active:scale-[0.98]"
                : "cursor-not-allowed bg-[#f4f7fb] text-[#c8d4e0]"
            }`}
          >
            <LogIn size={14} strokeWidth={2.5} />
            Apertura de turno
          </button>

          <button
            onClick={closeCashSession}
            disabled={!isOpen}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[13px] font-semibold transition ${
              isOpen
                ? "border border-[#fca5a5] bg-[#fef2f2] text-red-600 hover:bg-red-50 active:scale-[0.98]"
                : "cursor-not-allowed border border-[#f1f5f9] bg-white text-[#d1d5db]"
            }`}
          >
            <LogOut size={14} strokeWidth={2} />
            Cierre de turno
          </button>
        </div>
      </div>

      {/* RIGHT: box selector */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[#e4e9f0] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

        <div className="shrink-0 border-b border-[#f1f5f9] px-5 py-3">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
            Selección operacional de caja
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {SERIES.map(prefix => {
            const seriesBoxes = cashBoxes.filter(b => b.code.startsWith(prefix));
            return (
              <div key={prefix} className="mb-4 last:mb-0">
                <p className="mb-1.5 px-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#c8d4e0]">
                  SERIE {prefix}00
                </p>
                <div className="flex flex-col gap-0.5">
                  {seriesBoxes.map(box => (
                    <BoxRow
                      key={box.code}
                      box={box}
                      isActive={isOpen && activeBox?.code === box.code}
                      isSelected={!isOpen && selectedCode === box.code}
                      onSelect={!isOpen ? () => box.available && setSelectedCode(box.code) : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
}
