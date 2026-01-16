import type { ReactNode } from "react";

const variants = {
  default: "glass-card",
  strong: "glass-card-strong",
} as const;

export function Card({
  variant = "default",
  className,
  children,
}: {
  variant?: keyof typeof variants;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${variants[variant]} ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}
