import { useState, useEffect } from "react";
import { Clock, LogIn, LogOut } from "lucide-react";

function formatTime(d: Date): string {
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(from: Date): string {
  const mins = Math.floor((Date.now() - from.getTime()) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#c0cad4]">
        {label}
      </span>
      <span className={`text-[12px] font-semibold ${accent ? "text-emerald-600" : "text-[#374151]"}`}>
        {value}
      </span>
    </div>
  );
}

export function CashWorkspace() {
  const [abierto, setAbierto] = useState(false);
  const [openedAt, setOpenedAt] = useState<Date | null>(null);
  const [duration, setDuration] = useState("");

  useEffect(() => {
    if (!openedAt) return;
    const update = () => setDuration(formatDuration(openedAt));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [openedAt]);

  function abrir() {
    const now = new Date();
    setOpenedAt(now);
    setAbierto(true);
  }

  function cerrar() {
    setAbierto(false);
    setOpenedAt(null);
    setDuration("");
  }

  return (
    <section className={`flex min-h-0 flex-1 items-center justify-center rounded-[28px] border bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)] transition-colors ${
      abierto ? "border-emerald-200" : "border-[#e4e9f0]"
    }`}>
      <div className="flex w-full max-w-[320px] flex-col items-center gap-6 px-8 text-center">

        {/* STATUS ICON */}
        <div className={`flex h-16 w-16 items-center justify-center rounded-[22px] transition-colors ${
          abierto ? "bg-emerald-50 text-emerald-600" : "bg-[#f1f5f9] text-[#9ca3af]"
        }`}>
          <Clock size={28} strokeWidth={1.5} />
        </div>

        {/* STATUS LABEL */}
        <div>
          <div className="mb-1.5 flex items-center justify-center gap-2">
            <span className={`h-2 w-2 rounded-full ${abierto ? "bg-emerald-500" : "bg-[#d1d5db]"}`} />
            <span className={`text-[12px] font-bold uppercase tracking-widest ${
              abierto ? "text-emerald-600" : "text-[#9ca3af]"
            }`}>
              {abierto ? "TURNO ABIERTO" : "TURNO CERRADO"}
            </span>
          </div>
          <p className="text-[13px] text-[#9ca3af]">
            {abierto && openedAt
              ? `Desde ${formatTime(openedAt)} · ${duration} activo`
              : "Apertura requerida para operar"}
          </p>
        </div>

        {/* INFO GRID */}
        <div className="w-full rounded-2xl border border-[#f1f5f9] px-4 py-3 flex flex-col gap-2.5">
          <InfoRow label="Operador" value="Fernando T." />
          <InfoRow label="Caja"     value="Caja 02"    />
          <InfoRow label="Turno"    value="Mañana"     />
          {abierto && openedAt && (
            <InfoRow label="Apertura" value={formatTime(openedAt)} accent />
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex w-full flex-col gap-2">
          <button
            onClick={abrir}
            disabled={abierto}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-bold uppercase tracking-widest transition ${
              !abierto
                ? "bg-emerald-600 text-white shadow-[0_4px_14px_rgba(5,150,105,0.28)] hover:bg-emerald-700 active:scale-[0.98]"
                : "cursor-not-allowed bg-[#f4f7fb] text-[#c8d4e0]"
            }`}
          >
            <LogIn size={15} strokeWidth={2.5} />
            Apertura de turno
          </button>

          <button
            onClick={cerrar}
            disabled={!abierto}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-semibold transition ${
              abierto
                ? "border border-[#fca5a5] bg-[#fef2f2] text-red-600 hover:bg-red-50 active:scale-[0.98]"
                : "cursor-not-allowed border border-[#f1f5f9] bg-white text-[#d1d5db]"
            }`}
          >
            <LogOut size={15} strokeWidth={2} />
            Cierre de turno
          </button>
        </div>
      </div>
    </section>
  );
}
