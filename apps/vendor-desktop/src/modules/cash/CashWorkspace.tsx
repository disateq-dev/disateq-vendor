import { Clock, LogIn, LogOut } from "lucide-react";

export function CashWorkspace() {
  return (
    <section className="flex min-h-0 flex-1 items-center justify-center rounded-[28px] border border-[#e4e9f0] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col items-center gap-6 px-8 text-center">

        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#EDF4FF] text-[#2154d8]">
          <Clock size={28} strokeWidth={1.5} />
        </div>

        <div>
          <h2 className="text-[18px] font-bold text-[#111827]">Gestión de Turno</h2>
          <p className="mt-1 text-[13px] text-[#9ca3af]">
            Apertura · Cierre · Arqueo de caja
          </p>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-2xl border border-[#e4e9f0] bg-white px-5 py-3 text-[13px] font-semibold text-[#374151] shadow-sm transition hover:border-[#c7d7f4] hover:bg-[#f0f5ff] hover:text-[#2154d8]">
            <LogIn size={15} strokeWidth={2} />
            Apertura de caja
          </button>
          <button className="flex items-center gap-2 rounded-2xl border border-[#e4e9f0] bg-white px-5 py-3 text-[13px] font-semibold text-[#374151] shadow-sm transition hover:border-[#c7d7f4] hover:bg-[#f0f5ff] hover:text-[#2154d8]">
            <LogOut size={15} strokeWidth={2} />
            Cierre de caja
          </button>
        </div>

        <p className="text-[11px] text-[#c0cad4]">
          Turno activo desde 08:15 · Fernando T. · Caja 02
        </p>
      </div>
    </section>
  );
}
