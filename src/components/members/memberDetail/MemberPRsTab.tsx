import { Trophy } from "lucide-react";
import { getUserPRs } from "@/lib/services/prs.service";
import { formatPrValue } from "@/lib/format";
import { formatDate } from "@/lib/date";

/** Mejores marcas del socio (vista del coach). */
export function MemberPRsTab({ userId }: { userId: string }) {
  const prs = getUserPRs(userId).filter((p) => p.best);
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Trophy className="h-4 w-4" strokeWidth={1.5} /> Marcas
      </h3>
      {prs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no registró marcas.</p>
      ) : (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {prs.map(({ exercise, best }) => (
            <li key={exercise.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <span className="truncate">{exercise.name}</span>
              <span className="ml-2 shrink-0 text-right">
                <span className="font-semibold">{formatPrValue(best!.value, exercise.unit)}</span>
                <span className="block text-[11px] text-muted-foreground">{formatDate(best!.date)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
