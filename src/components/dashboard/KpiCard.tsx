import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}

export function KpiCard({ label, value, hint, icon }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground leading-tight">{label}</div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
