import { Clock, User as UserIcon } from "lucide-react";
import type { Booking, ClassSession, ClassTemplate, User } from "@/types";
import { cn } from "@/lib/utils";
import { OccupancyBar } from "./OccupancyBar";
import { getSessionOccupancy } from "@/lib/services/booking.service";

interface Props {
  session: ClassSession;
  template?: ClassTemplate;
  coach?: User;
  onClick?: () => void;
  active?: boolean;
  compact?: boolean;
  /** La clase ya empezó o terminó. */
  past?: boolean;
  /** Estado de la reserva del socio que mira (para resaltarla). */
  booked?: "confirmed" | "waitlist" | "offered";
  /** Ocupación precalculada por el contenedor (evita recalcular en cada card). */
  occupancy?: { confirmed: Booking[]; waitlist: Booking[]; capacity: number };
}

export function SessionCard({ session, template, coach, onClick, active, compact, occupancy, past, booked }: Props) {
  const occ = occupancy ?? getSessionOccupancy(session.id);
  const cancelled = session.status === "cancelled";

  return (
    <button
      type="button"
      onClick={onClick}
      data-session-id={session.id}
      className={cn(
        "w-full text-left rounded-md border border-border bg-card p-3 transition-colors",
        "hover:border-border/80 hover:bg-muted/40",
        active && "ring-2 ring-brand",
        booked && "border-[var(--brand)] ring-1 ring-[var(--brand)]",
        (cancelled || past) && "opacity-50",
      )}
    >
      <div className="flex items-center gap-2">

        <span
          aria-hidden
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: template?.color ?? "var(--brand)" }}
        />
        <span className="text-sm font-semibold text-foreground truncate">
          {template?.name ?? "Clase"}
        </span>
        {cancelled ? (
          <span className="ml-auto text-[10px] uppercase tracking-wide text-red-400 font-medium">
            Cancelada
          </span>
        ) : booked ? (
          <span
            className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold"
            style={{ backgroundColor: "var(--brand)", color: "var(--primary-foreground)" }}
          >
            {booked === "confirmed" ? "Reservada" : booked === "offered" ? "¡Confirma!" : "En espera"}
          </span>
        ) : past ? (
          <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Finalizada
          </span>
        ) : null}
      </div>

      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" strokeWidth={1.5} />
          {session.startTime}
        </span>
        {coach && (
          <span className="inline-flex items-center gap-1 truncate">
            <UserIcon className="h-3 w-3" strokeWidth={1.5} />
            {coach.name}
          </span>
        )}
      </div>

      {!compact && (
        <div className="mt-2.5 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Ocupación</span>
            <span className="font-medium text-foreground">
              {occ.confirmed.length}/{occ.capacity}
              {occ.waitlist.length > 0 && (
                <span className="text-muted-foreground"> · +{occ.waitlist.length} lista</span>
              )}
            </span>
          </div>
          <OccupancyBar confirmed={occ.confirmed.length} capacity={occ.capacity} />
        </div>
      )}
    </button>
  );
}
