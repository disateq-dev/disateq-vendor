import type { CSSProperties, ReactElement, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface SheetHeaderProps {
  icon: LucideIcon;
  label: string;
  accent: string;
  right?: ReactNode;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RgbColor {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (match === null) return { r: 69, g: 179, b: 86 };
  const [, red = "45", green = "b3", blue = "56"] = match;
  return {
    r: Number.parseInt(red, 16),
    g: Number.parseInt(green, 16),
    b: Number.parseInt(blue, 16),
  };
}

function rgba(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function tint(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const red = Math.round(255 - (255 - r) * 0.07);
  const green = Math.round(255 - (255 - g) * 0.105);
  const blue = Math.round(255 - (255 - b) * 0.071);
  return `rgb(${red}, ${green}, ${blue})`;
}

export function SheetHeader({ icon: Icon, label, accent, right }: SheetHeaderProps): ReactElement {
  const style: CSSProperties = {
    backgroundColor: tint(accent),
    borderBottomColor: rgba(accent, 0.2),
  };

  return (
    <header className="shrink-0 flex h-[42px] items-center gap-2 border-b px-4" style={style}>
      <Icon size={13} strokeWidth={2} style={{ color: accent }} />
      <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">
        {label}
      </span>
      {right}
    </header>
  );
}
