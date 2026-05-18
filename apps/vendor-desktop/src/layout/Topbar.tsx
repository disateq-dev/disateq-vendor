import { useMemo } from "react";
import { Power, Store } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { usePOS } from "../context/POSContext";
import { loadBusinessConfig } from "../config/business";


function formatApertura(d: Date): string {
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function Topbar() {
  const { cashSession } = usePOS();
  const { isOpen, cashBox, operator, openedAt } = cashSession;
  const biz = useMemo(() => loadBusinessConfig(), []);

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
              {biz.nombreComercial}
            </span>
            <span className="text-[#5a6a88]">·</span>
            <span className="shrink-0 text-[10.5px] font-medium text-[#8090b0]">
              {biz.alias}
            </span>
          </div>
          <div className="mt-[-3px] flex items-center gap-2">
            <span className="text-[10.5px] text-[#8090b0]">R.U.C. {biz.ruc}</span>
            <span className="text-[#5a6a88]">·</span>
            <span className="truncate text-[10.5px] text-[#8090b0]">{biz.razonSocial}</span>
          </div>
        </div>

      </section>

      {/* RIGHT */}
      <section className="flex items-center gap-3 pl-5">

        {/* CONTEXTO OPERACIONAL */}
        <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-1.5">
          {isOpen && cashBox ? (
            <>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4ade80]" />
                <span className="font-bold tracking-[0.02em] text-[#e8edf5]">TURNO ABIERTO</span>
                {openedAt && (
                  <span className="tabular-nums text-[#6b7fa0]">{formatApertura(openedAt)}</span>
                )}
                <span className="text-[#3d5280]">│</span>
                <span className="font-semibold text-[#7c8db8]">CAJA {cashBox.code}</span>
              </div>
              <div className="pl-[14px] text-[11px] text-[#a0b0cc]">
                {operator}
              </div>
            </>
          ) : (
            <>
              <div className="text-[12px] font-semibold text-[#8090b0]">Sin turno operativo</div>
              <div className="text-[10.5px] text-[#4d5e7c]">Abrir caja para operar</div>
            </>
          )}
        </div>

        {/* POWER — app.exit(0) vía Rust: cierre limpio, localStorage ya sincronizado */}
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
