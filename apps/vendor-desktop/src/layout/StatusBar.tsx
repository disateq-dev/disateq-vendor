import { useState, useEffect } from "react";
import { usePOS, type CashBoxType } from "../context/POSContext";

function typeLabel(t: CashBoxType): string {
  if (t === "normal") return "OPERACIONAL";
  if (t === "contingency-1") return "CONTINGENCIA 1";
  return "CONTINGENCIA 2";
}

function formatDuration(from: Date): string {
  const mins = Math.floor((Date.now() - from.getTime()) / 60_000);
  const h = Math.floor(mins / 60);
  const m = String(mins % 60).padStart(2, "0");
  return `${String(h).padStart(2, "0")}h ${m}m`;
}

const SEP = <span className="text-[#1e3060]"> · </span>;

export function StatusBar() {
  const { cashSession } = usePOS();
  const { isOpen, cashBox, terminal, openedAt } = cashSession;
  const [duration, setDuration] = useState("");

  useEffect(() => {
    if (!openedAt) { setDuration(""); return; }
    const update = () => setDuration(formatDuration(openedAt));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [openedAt]);

  return (
    <div className="flex shrink-0 items-center justify-center bg-[#0a1628] px-5 py-[3px]">
      {isOpen && cashBox ? (
        <span className="select-none text-[9.5px] font-bold uppercase tracking-[0.14em] text-emerald-500">
          CAJA {cashBox.code}
          {SEP}
          {typeLabel(cashBox.type)}
          {SEP}
          TURNO ACTIVO
          {duration && <>{SEP}<span className="text-emerald-400">{duration}</span></>}
          {SEP}
          <span className="text-[#3d5a8a]">{terminal}</span>
        </span>
      ) : (
        <span className="select-none text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#3d5a8a]">
          SIN APERTURA OPERACIONAL
        </span>
      )}
    </div>
  );
}
