import { Infinity as InfIcon, Zap } from "lucide-react";
import { inspectCredits } from "@/lib/services/membership.service";
import { cn } from "@/lib/utils";

export function CreditsBadge({ userId, className }: { userId: string; className?: string }) {
  const check = inspectCredits(userId);
  if (!check.hasMembership) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
          className,
        )}
      >
        Sin plan
      </span>
    );
  }
  if (!check.needsCredit) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground",
          className,
        )}
      >
        <InfIcon className="h-3 w-3" strokeWidth={1.5} /> Ilimitado
      </span>
    );
  }
  const remaining = check.membership?.creditsRemaining ?? 0;
  const low = remaining <= 2;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        low
          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
          : "border-border bg-muted text-foreground",
        className,
      )}
    >
      <Zap className="h-3 w-3" strokeWidth={1.5} />
      {remaining} crédito{remaining === 1 ? "" : "s"}
    </span>
  );
}
