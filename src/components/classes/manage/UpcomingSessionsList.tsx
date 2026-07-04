import { toast } from "sonner";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { cancelSession, getSessionOccupancy } from "@/lib/services/booking.service";
import { notifyDataChanged, useDataVersion } from "@/lib/data-bus";
import { toDateKey } from "@/lib/date";
import type { ClassTemplate, User } from "@/types";

interface Props {
  templates: ClassTemplate[];
  coaches: Pick<User, "id" | "name">[];
}

/** Listado de las 40 próximas sesiones con acción de cancelar. */
export function UpcomingSessionsList({ templates, coaches }: Props) {
  useDataVersion();
  const todayKey = toDateKey(new Date());
  const templateById = new Map(templates.map((t) => [t.id, t]));
  const coachById = new Map(coaches.map((c) => [c.id, c]));
  const sessions = classSessionsRepo
    .list()
    .filter((s) => s.date >= todayKey)
    .sort((a, b) =>
      a.date === b.date
        ? a.startTime.localeCompare(b.startTime)
        : a.date.localeCompare(b.date),
    )
    .slice(0, 40);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Clase</TableHead>
            <TableHead>Coach</TableHead>
            <TableHead>Ocupación</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[80px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                No hay sesiones próximas.
              </TableCell>
            </TableRow>
          )}
          {sessions.map((s) => {
            const tpl = templateById.get(s.templateId);
            const coach = s.coachId ? coachById.get(s.coachId) : undefined;
            const occ = getSessionOccupancy(s.id);
            const cancelled = s.status === "cancelled";
            return (
              <TableRow key={s.id} className={cancelled ? "opacity-60" : ""}>
                <TableCell>{s.date}</TableCell>
                <TableCell>{s.startTime}</TableCell>
                <TableCell className="font-medium">{tpl?.name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{coach?.name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {occ.confirmed.length}/{occ.capacity}
                  {occ.waitlist.length > 0 && ` (+${occ.waitlist.length})`}
                </TableCell>
                <TableCell>
                  {cancelled ? (
                    <span className="text-xs text-red-400 font-medium">Cancelada</span>
                  ) : (
                    <span className="text-xs text-emerald-400 font-medium">Programada</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!cancelled && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (!confirm("¿Cancelar esta sesión y todas sus reservas?")) return;
                        cancelSession(s.id);
                        toast.success("Sesión cancelada");
                        notifyDataChanged();
                      }}
                    >
                      <Ban className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
