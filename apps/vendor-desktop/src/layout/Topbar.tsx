import { useMemo } from "react";
import { Power } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { usePOS } from "../context/POSContext";
import { loadBusinessConfig } from "../config/business";
import logoImg from "../assets/branding/disateq-vendor-login2.png";


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

        {/* BUSINESS */}
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-[16px] font-semibold text-white leading-tight">
              {biz.nombreComercial}
            </span>
            <span className="text-[#5a6a88]">·</span>
            <span className="shrink-0 text-[13px] font-medium text-[#8090b0]">
              {biz.alias}
            </span>
          </div>
          <div className="mt-[-3px] flex items-center gap-2">
            <span className="text-[12px] text-[#8090b0]">R.U.C. {biz.ruc}</span>
            <span className="text-[#5a6a88]">·</span>
            <span className="truncate text-[12px] text-[#8090b0]">{biz.razonSocial}</span>
          </div>
        </div>

      </section>

      {/* RIGHT */}
      <section className="flex items-center gap-3 pl-5">

        {/* CONTEXTO OPERACIONAL */}
        {isOpen && cashBox && (
          <div className="rounded-xl border border-white/[0.13] bg-white/[0.10] px-4 py-1.5 shadow-[0_0_16px_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 text-[15px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4ade80]" />
              <span className="font-semibold tracking-[0.02em] text-[#4ade80]">TURNO ABIERTO</span>
              {openedAt && (
                <span className="text-[12px] tabular-nums text-[#6b7fa0]">{formatApertura(openedAt)}</span>
              )}
              <span className="text-[12px] text-[#3d5280]">│</span>
              <span className="text-[12px] font-semibold text-[#7c8db8]">CAJA {cashBox.code}</span>
            </div>
            <div className="pl-[14px] text-[12px] text-[#a0b0cc]">
              <span className="font-semibold tracking-[0.06em]">OPERADOR: </span>{operator}
            </div>
          </div>
        )}


        {/* BRAND */}
        <img
          src={logoImg}
          alt="DisateQ VENDOR™"
          draggable={false}
          className="h-[37px] w-auto object-contain"
        />

        <div className="h-8 w-px bg-white/10" />

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
