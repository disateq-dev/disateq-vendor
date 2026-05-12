import { usePOS } from "../context/POSContext";

interface Shortcut { key: string; label: string; }

const SEARCH: Shortcut[] = [
  { key: "F2",    label: "Buscar"  },
  { key: "↑↓",   label: "Navegar" },
  { key: "Enter", label: "Agregar" },
  { key: "Tab",   label: "Ticket"  },
  { key: "F4",    label: "Cobrar"  },
  { key: "Esc",   label: "Limpiar" },
];

const TICKET: Shortcut[] = [
  { key: "↑↓",  label: "Línea"    },
  { key: "+ −", label: "Cantidad" },
  { key: "Del", label: "Eliminar" },
  { key: "Tab", label: "Volver"   },
  { key: "F4",  label: "Cobrar"   },
];

export function ShortcutsBar() {
  const { zone } = usePOS();
  const shortcuts = zone === "ticket" ? TICKET : SEARCH;

  return (
    <div className="flex shrink-0 items-center border-t border-[#dde4ec] bg-white/80 px-4 py-1.5">
      {shortcuts.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5 px-3">
          <kbd className="rounded bg-[#f4f7fb] px-1.5 py-0.5 text-[10px] font-bold text-[#6b7280] ring-1 ring-[#e4e9f0]">
            {s.key}
          </kbd>
          <span className="text-[10px] text-[#9ca3af]">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
