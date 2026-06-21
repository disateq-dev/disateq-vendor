import type { ReactElement, ReactNode } from "react";

interface SheetBodyProps {
  children: ReactNode;
  className?: string;
}

export function SheetBody({ children, className }: SheetBodyProps): ReactElement {
  return (
    <div className={`flex-1 overflow-y-auto ${className ?? ""}`}>
      {children}
    </div>
  );
}
