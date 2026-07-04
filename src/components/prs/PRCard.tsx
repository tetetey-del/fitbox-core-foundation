import type { Exercise, PersonalRecord } from "@/types";
import { formatDate } from "@/lib/date";
import { formatPrValue } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

interface PRCardProps {
  exercise: Exercise;
  best: PersonalRecord | null;
  total: number;
  onClick?: () => void;
}

export function PRCard({ exercise, best, total, onClick }: PRCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full rounded-lg border border-border bg-card p-4 hover:border-border/80 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{exercise.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {total} marca{total === 1 ? "" : "s"}
          </div>
        </div>
        {best && (
          <Badge variant={best.rx ? "default" : "secondary"} className="text-[10px]">
            {best.rx ? "RX" : "Scaled"}
          </Badge>
        )}
      </div>
      <div className="mt-3">
        {best ? (
          <>
            <div className="text-2xl font-semibold tracking-tight">
              {formatPrValue(best.value, exercise.unit)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDate(best.date)}
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">Sin marcas registradas</div>
        )}
      </div>
    </button>
  );
}
