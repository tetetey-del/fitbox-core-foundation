import { AlertTriangle, Check, Trash2 } from "lucide-react";
import type { ClassAlert } from "@/lib/services/coachNotes.service";
import type { Booking, User } from "@/types";
import { Button } from "@/components/ui/button";
import { hasCheckIn } from "@/lib/services/booking.service";
import { UserAvatar } from "@/components/members/UserAvatar";

interface Props {
  confirmed: Booking[];
  userById: Map<string, User>;
  isStaff: boolean;
  /** Solo el dueño/administrador puede quitar asistentes. */
  canRemove?: boolean;
  onCheckIn: (bookingId: string) => void;
  onRemove: (bookingId: string) => void;
  /** Avisos de los coaches por socio (ejercicios del WOD de ese día). Solo staff. */
  alerts?: Map<string, ClassAlert[]>;
}

/** Lista de asistentes confirmados de una sesión, con acciones de check-in/quitar. */
export function AttendeesList({ confirmed, userById, isStaff, canRemove = false, onCheckIn, onRemove, alerts }: Props) {
  return (
    <section className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Confirmados ({confirmed.length})
      </div>
      {confirmed.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin asistentes todavía.</p>
      ) : (
        <ul className="space-y-1">
          {confirmed.map((b) => {
            const u = userById.get(b.userId);
            const done = hasCheckIn(b.id);
            return (
              <li key={b.id} className="rounded-md border border-border bg-card px-3 py-2">
                <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2.5">
                  <UserAvatar name={u?.name ?? "?"} src={u?.avatar} />
                  <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{u?.name ?? "—"}</div>
                  {done && (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" strokeWidth={2} /> Check-in hecho
                    </div>
                  )}
                  </div>
                </div>
                {isStaff && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant={done ? "secondary" : "outline"}
                      onClick={() => onCheckIn(b.id)}
                      title={done ? "Deshacer check-in" : "Check-in"}
                      className="h-8 w-8"
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Button>
                    {canRemove && <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemove(b.id)}
                      title="Quitar asistente"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Button>}
                  </div>
                )}
                </div>
                {isStaff && alerts?.get(b.userId)?.map((a) => (
                  <div
                    key={a.note.id}
                    className="mt-2 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs"
                  >
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" strokeWidth={2} />
                    <span>
                      <strong>{a.exercise.name}:</strong> {a.note.text}
                    </span>
                  </div>
                ))}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
