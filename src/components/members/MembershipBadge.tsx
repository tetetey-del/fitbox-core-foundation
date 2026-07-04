import type { MembershipUiStatus } from "@/types";
import { MEMBERSHIP_UI_LABEL } from "@/types";
import { cn } from "@/lib/utils";

const STYLES: Record<MembershipUiStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  expiring_soon: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  expired: "bg-red-500/10 text-red-400 border-red-500/20",
  none: "bg-muted text-muted-foreground border-border",
};

export function MembershipBadge({
  status,
  className,
}: {
  status: MembershipUiStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        STYLES[status],
        className,
      )}
    >
      {MEMBERSHIP_UI_LABEL[status]}
    </span>
  );
}
