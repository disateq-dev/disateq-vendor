import { Power, Store } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { usePOS } from "../context/POSContext";

function formatApertura(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function Topbar() {
  const { cashSession } = usePOS();
  const { isOpen, cashBox, operator, openedAt } = cashSession;

  return (
    <section className="flex h-[64px] items-center justify-between bg-[#0f1f3d] px-5">
      {/* LEFT */}
      <section className="flex min-w-0 items-center">

        {/* BRAND */}
        <div className="flex items-center gap-3.5 pr-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#2154d8] text-white shadow-[0_4px_14px_rgba(33,84,216,0.4)]">
            <Store size={17} />
          </div>
          <div className="flex flex-col">
            <span className="text-[17px] font-semibold text-white leading-none tracking-[0.01em]">
              DisateQ VENDOR™
            </span>
            <span className="mt-0.5 text-[10.5px] font-medium text-[#8090b0]">
              Ventas y Gestión Administrativa
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-white/10" />

        {/* BUSINESS */}
        <div className="min-w-0 px-5">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-[13px] font-semibold text-white leading-tight">
              ALMACEN DE ABARROTES PEÑA
            </span>
            <span className="text-[#5a6a88]">·</span>
            <span className="shrink-0 text-[10.5px] font-medium text-[#8090b0]">
              Tienda Mercado Central
            </span>
          </div>
          <div className="mt-[-3px] flex items-center gap-2">
            <span className="text-[10.5px] text-[#8090b0]">R.U.C. 20608399349</span>
            <span className="text-[#5a6a88]">·</span>
            <span className="truncate text-[10.5px] text-[#8090b0]">CONSORCIO PEÑA S.A.C.</span>
          </div>
        </div>

      </section>

      {/* RIGHT */}
      <section className="flex items-center gap-3 pl-5">

        {/* TURNO PILL */}
        <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-1.5">
          {isOpen && cashBox ? (
            <>
              <div className="flex items-center gap-2 text-[12.5px]">
                <span className="font-bold text-[#e8edf5]">CAJA {cashBox.code}</span>
                <span className="text-[#3d5280]">•</span>
                <span className="text-[#7c8db8]">{operator}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-semibold text-[#4ade80]">Turno abierto</span>
                {openedAt && (
                  <>
                    <span className="text-[#3d5280]">•</span>
                    <span className="text-[#8090b0]">Apertura {formatApertura(openedAt)}</span>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-[12px] font-semibold text-[#8090b0]">Sin turno operativo</div>
              <div className="text-[10.5px] text-[#4d5e7c]">Abrir caja para operar</div>
            </>
          )}
        </div>

        {/* POWER — app.exit(0) vía Rust garantiza cierre completo */}
        <button
          title="Cerrar sistema"
          onClick={() => void invoke("app_exit")}
          className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#dc2626] text-white shadow-[0_2px_8px_rgba(220,38,38,0.3)] transition hover:bg-[#b91c1c] active:scale-[0.95]"
        >
          <Power size={16} />
        </button>

      </section>
    </section>
  );
}
