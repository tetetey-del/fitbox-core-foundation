import { cn } from "@/lib/utils";

interface Props {
  confirmed: number;
  capacity: number;
  className?: string;
}

export function OccupancyBar({ confirmed, capacity, className }: Props) {
  const pct = capacity === 0 ? 0 : Math.min(100, Math.round((confirmed / capacity) * 100));
  const full = confirmed >= capacity;
  const color = full
    ? "bg-red-500"
    : pct >= 70
      ? "bg-amber-500"
      : "bg-emerald-500";
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-muted overflow-hidden", className)}>
      <div className={cn("h-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
