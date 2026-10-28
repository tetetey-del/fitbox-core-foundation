import { X } from "lucide-react";
import type { Booking, User } from "@/types";
import { Button } from "@/components/ui/button";

interface Props {
  waitlist: Booking[];
  /** Lugares ofrecidos que esperan confirmación. */
  offered?: Booking[];
  userById: Map<string, User>;
  isStaff: boolean;
  onRemove: (bookingId: string) => void;
}

/** Lista de espera de una sesión, con posición y acción de quitar. */
export function WaitlistList({ waitlist, offered = [], userById, isStaff, onRemove }: Props) {
  if (waitlist.length === 0 && offered.length === 0) return null;
  return (
    <section className="mt-5 space-y-2">
      {offered.length > 0 && (
        <ul className="space-y-1">
          {offered.map((b) => (
            <li key={b.id} className="flex items-center justify-between rounded-md border border-[#A3E635]/40 bg-[#A3E635]/5 px-3 py-2">
              <div className="min-w-0 text-sm">
                <div className="truncate">{userById.get(b.userId)?.name ?? "—"}</div>
                <div className="text-[11px] text-muted-foreground">
                  Lugar ofrecido · confirma hasta las{" "}
                  {b.offerExpiresAt
                    ? new Date(b.offerExpiresAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </div>
              </div>
              {isStaff && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(b.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Lista de espera ({waitlist.length})
      </div>
      <ul className="space-y-1">
        {waitlist.map((b) => {
          const u = userById.get(b.userId);
          return (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
            >
              <div className="text-sm truncate">
                <span className="text-muted-foreground mr-2">#{b.position}</span>
                {u?.name ?? "—"}
              </div>
              {isStaff && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(b.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
