import { useState, useEffect } from "react";
import { usePOS, type DocRange } from "../context/POSContext";

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

function fmtRange(r: DocRange): string {
  const p = (n: number) => String(n).padStart(4, "0");
  return `${r.series}·${p(r.first)}→${p(r.last)}`;
}

const SEP = <span className="mx-[6px] text-[#1e3060]">·</span>;

export function ShortcutsBar() {
  const { cashSession, sessionStats, cashMoves } = usePOS();
  const { isOpen, cashBox, terminal, openedAt } = cashSession;
  const isCtg = !!cashBox && cashBox.type !== "normal";
  const now = useClock();

  const ingTotal = cashMoves.reduce((s, mv) => mv.type === "ingreso" ? s + mv.amount : s, 0);
  const egTotal  = cashMoves.reduce((s, mv) => mv.type === "egreso"  ? s + mv.amount : s, 0);
  const hasMoves = cashMoves.length > 0;

  const [duration, setDuration] = useState("");
  useEffect(() => {
    if (!openedAt) { setDuration(""); return; }
    const update = () => setDuration(liveTimer(openedAt));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [openedAt]);

  const ranges = (Object.values(sessionStats.docRanges) as (DocRange | undefined)[])
    .filter((r): r is DocRange => r != null);

  return (
    <div className="flex h-[26px] shrink-0 items-center justify-between bg-[#0a1628] px-5">

      {/* LEFT — telemetría operacional */}
      <span className="flex items-center select-none text-[9px] font-bold uppercase tracking-[0.13em]">
        {isOpen && cashBox ? (
          <>
            <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#78C487]" />
            <span className="text-[#78C487]">CAJA {cashBox.code}</span>
            {isCtg && (
              <span className="ml-2 inline-flex items-center rounded bg-amber-500/25 px-1.5 py-px text-[7.5px] font-extrabold tracking-widest text-amber-400">
                CTG
              </span>
            )}
            {SEP}
            <span className="text-[#3d5a8a]">{terminal}</span>
            {duration && <>{SEP}<span className="text-[#3d5a8a]">{duration}</span></>}
            {SEP}
            <span className="text-[#3d5a8a]">{sessionStats.count}&nbsp;ops</span>
            {hasMoves && (
              <>
                {SEP}
                <span className="text-[#4ade80]/70">↑{Math.round(ingTotal)}</span>
                <span className="ml-1 text-red-400/70">↓{Math.round(egTotal)}</span>
              </>
            )}
            {ranges.length > 0 && (
              <>
                {SEP}
                {ranges.map(r => (
                  <span key={r.series} className="text-[#2d4a7a]">{fmtRange(r)}</span>
                ))}
              </>
            )}
          </>
        ) : (
          <span className="text-[#2d3f5c]">○&nbsp;&nbsp;sin turno operativo</span>
        )}
      </span>

      {/* RIGHT — fecha/hora compacta + versión */}
      <div className="flex items-center gap-3 select-none">
        <span className="tabular-nums text-[9px] font-semibold text-[#3d5280]">
          {formatFootClock(now)}
        </span>
        <span className="text-[#1e3060]">|</span>
        <span className="text-[9px] font-semibold text-[#2d3f5c]">
          DisateQ VENDOR v1.0
        </span>
      </div>

    </div>
  );
}
