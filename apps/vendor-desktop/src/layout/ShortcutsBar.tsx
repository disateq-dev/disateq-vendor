import { usePOS } from "../context/POSContext";

const HINTS: Record<string, string> = {
  search: "↑↓ navegar · Enter agregar · Tab ticket · F4 cobrar · Esc limpiar",
  ticket: "↑↓ línea · +/− cantidad · N observación · Del eliminar · F4 cobrar",
  cobro:  "Enter confirmar · Esc cancelar",
};

export function ShortcutsBar() {
  const { zone } = usePOS();

  return (
    <div className="flex shrink-0 items-center justify-between bg-[#0f1f3d] px-5 py-1.5">
      <span className="select-none text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#263554]">
        DisateQ POS
      </span>
      <span className="select-none text-[9.5px] text-[#2d4070]">
        {HINTS[zone]}
      </span>
    </div>
  );
}
