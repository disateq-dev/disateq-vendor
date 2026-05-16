import { useState, useEffect } from "react";
import { usePOS, type DocRange } from "../context/POSContext";

function liveTimer(from: Date): string {
  const mins = Math.floor((Date.now() - from.getTime()) / 60_000);
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}h${m}m`;
}

function fmtRange(r: DocRange): string {
  const p = (n: number) => String(n).padStart(4, "0");
  return `${r.series}·${p(r.first)}→${p(r.last)}`;
}

const SEP = <span className="mx-[7px] text-[#1e3060]">·</span>;

export function StatusBar() {
  const { cashSession, sessionStats } = usePOS();
  const { isOpen, cashBox, terminal, openedAt } = cashSession;
  const isCtg = !!cashBox && cashBox.type !== "normal";

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

  if (!isOpen || !cashBox) {
    return (
      <div className="flex h-[26px] shrink-0 items-center bg-[#0a1628] px-5">
        <span className="select-none text-[9px] font-bold uppercase tracking-[0.15em] text-[#2d3f5c]">
          ○&nbsp;&nbsp;sin apertura operacional
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-[26px] shrink-0 items-center justify-between bg-[#0a1628] px-5">

      {/* LEFT — identity */}
      <span className="flex items-center select-none text-[9.5px] font-bold uppercase tracking-[0.13em]">
        <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
        <span className="text-emerald-400">CAJA {cashBox.code}</span>
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
      </span>

      {/* RIGHT — correlativos runtime */}
      {ranges.length > 0 ? (
        <span className="flex items-center gap-5 select-none">
          {ranges.map(r => (
            <span key={r.series} className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#2d4a7a]">
              {fmtRange(r)}
            </span>
          ))}
        </span>
      ) : (
        <span className="select-none text-[9px] font-bold uppercase tracking-[0.1em] text-[#1e3060]">
          sin correlativos
        </span>
      )}

    </div>
  );
}
