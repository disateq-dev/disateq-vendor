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
  { key: "N",   label: "Nota"     },
  { key: "Del", label: "Eliminar" },
  { key: "Tab", label: "Volver"   },
  { key: "F4",  label: "Cobrar"   },
];

export function ShortcutsBar() {
  const { zone } = usePOS();
  const shortcuts = zone === "ticket" ? TICKET : SEARCH;

  return (
    <div className="flex shrink-0 items-center bg-[#0f1f3d] px-4 py-2">
      {shortcuts.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5 px-3">
          <kbd className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] font-bold text-[#c8d4e4] ring-1 ring-white/10">
            {s.key}
          </kbd>
          <span className="text-[10px] text-[#5a6a8c]">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
