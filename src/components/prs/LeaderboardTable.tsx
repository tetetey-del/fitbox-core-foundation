import { Medal } from "lucide-react";
import type { Exercise, User } from "@/types";
import { formatPrValue } from "@/lib/format";
import { formatDate } from "@/lib/date";
import type { LeaderboardEntry } from "@/lib/services/prs.service";

interface LeaderboardTableProps {
  exercise: Exercise;
  entries: LeaderboardEntry[];
  userMap: Map<string, User>;
}

const MEDAL_CLASS = ["text-amber-400", "text-slate-300", "text-orange-400"];

export function LeaderboardTable({ exercise, entries, userMap }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Todavía no hay marcas registradas para este ejercicio.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="text-left px-4 py-2 w-16">#</th>
            <th className="text-left px-4 py-2">Atleta</th>
            <th className="text-right px-4 py-2">Marca</th>
            <th className="text-right px-4 py-2 w-24">Tipo</th>
            <th className="text-right px-4 py-2 w-28">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const user = userMap.get(entry.userId);
            return (
              <tr key={entry.userId} className="border-t border-border">
                <td className="px-4 py-2 font-medium">
                  {i < 3 ? (
                    <span className="inline-flex items-center gap-1">
                      <Medal className={`h-4 w-4 ${MEDAL_CLASS[i]}`} strokeWidth={1.5} />
                      <span>{i + 1}</span>
                    </span>
                  ) : (
                    i + 1
                  )}
                </td>
                <td className="px-4 py-2">{user?.name ?? "—"}</td>
                <td className="px-4 py-2 text-right font-mono">
                  {formatPrValue(entry.best.value, exercise.unit)}
                </td>
                <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                  {entry.best.rx ? "RX" : "Scaled"}
                </td>
                <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                  {formatDate(entry.best.date)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
