import { Power, Store } from "lucide-react";

export function Topbar() {
  return (
    <section className="flex h-[74px] items-center justify-between px-5">
      {/* LEFT */}
      <section className="flex min-w-0 items-center">
        {/* BRAND */}
        <div className="flex items-center gap-4 pr-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#2154d8] text-white shadow-[0_4px_14px_rgba(33,84,216,0.16)]">
            <Store size={20} />
          </div>

          <div className="flex flex-col">
            <span className="text-[15px] font-bold tracking-tight text-[#0f172a]">
              DisateQ VENDOR™
            </span>

            <span className="-mt-1 text-[12px] font-medium text-[#667085]">
              Ventas y Gestión Administrativa para Negocios
            </span>
          </div>
        </div>

        <div className="h-10 w-px bg-[#e7eaee]" />

        {/* BUSINESS */}
        <div className="min-w-0 px-7">
          <div className="flex items-center gap-3">
            <span className="truncate text-[15px] font-bold text-[#111827]">
              ALMACEN DE ABARROTES PEÑA
            </span>

            <span className="text-[#b8c2cc]">
              •
            </span>

            <span className="text-[14px] font-medium text-[#667085]">
              Tienda Mercado Central
            </span>
          </div>

          <div className="-mt-0.5 flex items-center gap-3">
            <span className="text-[13px] text-[#98a2b3]">
              R.U.C. 20608399349
            </span>

            <span className="text-[#d0d5dd]">
              •
            </span>

            <span className="truncate text-[13px] text-[#98a2b3]">
              CONSORCIO PEÑA S.A.C.
            </span>
          </div>
        </div>
      </section>

      {/* RIGHT */}
      <section className="flex items-center gap-3 pl-5">
        {/* OPERATIONAL INFO */}
        <div className="rounded-2xl border border-[rgba(22,163,74,0.08)] bg-[linear-gradient(180deg,rgba(22,163,74,0.028)_0%,rgba(22,163,74,0.018)_100%)] px-4 py-2 shadow-[0_2px_10px_rgba(15,23,42,0.012)] backdrop-blur-sm">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="font-semibold text-[#111827]">
              CAJA 02
            </span>

            <span className="text-[#c8d0d8]">
              •
            </span>

            <span className="text-[#667085]">
              Fernando T.
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-2 text-[12px]">
            <span className="font-medium text-[#16a34a]">
              Turno ACTIVO
            </span>

            <span className="text-[#c8d0d8]">
              •
            </span>

            <span className="text-[#667085]">
              Apertura 08:15
            </span>
          </div>
        </div>

        {/* POWER */}
        <button className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#ece1e1] bg-white text-[#dc2626] shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition hover:border-[#ef4444] hover:bg-[#fff5f5]">
          <Power size={18} />
        </button>
      </section>
    </section>
  );
}
