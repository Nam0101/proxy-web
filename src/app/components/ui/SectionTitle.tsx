import type { ReactNode } from "react";

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-heading mt-2 text-xl font-semibold text-slate-100">
      {children}
    </h2>
  );
}
