import { useState, useEffect } from "react";
import { usePOS } from "../context/POSContext";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatFootClock(d: Date): string {
  const h   = String(d.getHours()).padStart(2, "0");
  const m   = String(d.getMinutes()).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  return `${h}:${m} · ${day} ${months[d.getMonth()]}`;
}

function liveTimer(from: Date): string {
  const mins = Math.floor((Date.now() - from.getTime()) / 60_000);
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const mn = String(mins % 60).padStart(2, "0");
  return `${h}h${mn}m`;
}

const SEP = <span className="mx-[6px] text-[#1e3060]">·</span>;

export function ShortcutsBar() {
  const { cashSession, activeOperator } = usePOS();
  const { isOpen, cashBox, terminal, openedAt } = cashSession;
  const now = useClock();

  const [duration, setDuration] = useState("");
  useEffect(() => {
    if (!openedAt) { setDuration(""); return; }
    const update = () => setDuration(liveTimer(openedAt));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [openedAt]);

  return (
    <div className="flex h-[26px] shrink-0 items-center justify-between bg-[#0a1628] px-5">

      {/* LEFT — estado del turno */}
      <span className="flex items-center select-none text-[10.5px] font-semibold uppercase tracking-[0.10em] text-white/50">
        {isOpen && cashBox ? (
          <>
            <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#78C487]" />
            <span className="text-[#78C487]">TURNO ABIERTO</span>
            {SEP}
            <span>CAJA {cashBox.code}</span>
            {SEP}
            <span>{activeOperator?.nombreCompleto ?? terminal}</span>
            {openedAt && (
              <>
                {SEP}
                <span>{String(openedAt.getHours()).padStart(2,"0")}:{String(openedAt.getMinutes()).padStart(2,"0")}</span>
              </>
            )}
            {duration && <>{SEP}<span>{duration}</span></>}
          </>
        ) : (
          <span>○&nbsp;&nbsp;SIN TURNO OPERATIVO</span>
        )}
      </span>

      {/* RIGHT — reloj · versión · firma */}
      <div className="flex items-center gap-3 select-none">
        <span className="tabular-nums text-[10px] font-semibold text-white">
          {formatFootClock(now)}
        </span>
        <span className="text-white/30">|</span>
        <span className="text-[10px] font-semibold text-white">
          DisateQ VENDOR v1.0
        </span>
        <span className="text-white/30">|</span>
        <span className="text-[10px] font-bold text-white">@fhertejada™</span>
      </div>

    </div>
  );
}
