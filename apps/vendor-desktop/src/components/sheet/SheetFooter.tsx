import type { ReactElement, ReactNode } from "react";

interface SheetFooterProps {
  children: ReactNode;
  className?: string;
}

export function SheetFooter({ children, className }: SheetFooterProps): ReactElement {
  return (
    <footer className={`shrink-0 border-t px-3 py-3 ${className ?? ""}`}>
      {children}
    </footer>
  );
}
