import type { CSSProperties, ReactElement, ReactNode } from "react";

interface SheetWorkProps {
  accent: string;
  children: ReactNode;
  className?: string;
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

export function SheetWork({ accent, children, className }: SheetWorkProps): ReactElement {
  const style: CSSProperties = {
    borderColor: rgba(accent, 0.4),
  };

  return (
    <section
      className={`flex h-full flex-col overflow-hidden rounded-[28px] border bg-[#FDFCF9] ${className ?? ""}`}
      style={style}
    >
      {children}
    </section>
  );
}
