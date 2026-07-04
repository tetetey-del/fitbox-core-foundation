import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X, UserPlus, Trash2, Ban } from "lucide-react";
import type { ClassSession, ClassTemplate, User } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { OccupancyBar } from "./OccupancyBar";
import {
  addAttendee,
  cancelBooking,
  cancelSession,
  checkIn,
  getSessionOccupancy,
  hasCheckIn,
  undoCheckIn,
} from "@/lib/services/booking.service";
import { useAuth } from "@/contexts/AuthContext";
import { notifyDataChanged, useDataVersion } from "@/lib/data-bus";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ClassSession | null;
  template?: ClassTemplate;
  coach?: User;
  tenantUsers: User[];
}

export function SessionDetailSheet({
  open,
  onOpenChange,
  session,
  template,
  coach,
  tenantUsers,
}: Props) {
  const { currentUser } = useAuth();
  useDataVersion();
  const [addUserId, setAddUserId] = useState<string>("");

  const occ = useMemo(() => (session ? getSessionOccupancy(session.id) : null), [session]);
  const userById = useMemo(() => {
    const m = new Map<string, User>();
    tenantUsers.forEach((u) => m.set(u.id, u));
    return m;
  }, [tenantUsers]);

  if (!session || !occ || !currentUser) return null;

  const isStaff = currentUser.role === "admin" || currentUser.role === "coach";

  const alreadyBooked = new Set(
    [...occ.confirmed, ...occ.waitlist].map((b) => b.userId),
  );
  const addable = tenantUsers.filter((u) => !alreadyBooked.has(u.id));

  const handleCheckIn = (bookingId: string) => {
    const already = hasCheckIn(bookingId);
    const res = already
      ? undoCheckIn(bookingId, currentUser.role)
      : checkIn(bookingId, currentUser.role);
    if (!res.ok) toast.error(res.reason ?? "Error");
    else toast.success(already ? "Check-in deshecho" : "Check-in registrado");
    notifyDataChanged();
  };

  const handleRemove = (bookingId: string) => {
    const res = cancelBooking(bookingId, currentUser.role);
    if (!res.ok) toast.error(res.reason ?? "No se pudo quitar");
    else {
      toast.success("Reserva eliminada");
      if (res.promoted) toast.info("Se ha promocionado al primero de la lista de espera");
    }
    notifyDataChanged();
  };

  const handleAdd = () => {
    if (!addUserId) return;
    const res = addAttendee(session.id, addUserId);
    if (!res.ok) toast.error(res.reason ?? "No se pudo añadir");
    else toast.success("Asistente añadido");
    setAddUserId("");
    notifyDataChanged();
  };

  const handleCancelSession = () => {
    if (!confirm("¿Cancelar esta sesión? Se cancelarán todas las reservas.")) return;
    cancelSession(session.id);
    toast.success("Sesión cancelada");
    notifyDataChanged();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{template?.name ?? "Sesión"}</SheetTitle>
          <SheetDescription>
            {session.date} · {session.startTime} · {session.durationMinutes} min
            {coach ? ` · ${coach.name}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ocupación</span>
            <span className="font-medium">
              {occ.confirmed.length}/{occ.capacity}
              {occ.waitlist.length > 0 && (
                <span className="text-muted-foreground"> · +{occ.waitlist.length} lista</span>
              )}
            </span>
          </div>
          <OccupancyBar confirmed={occ.confirmed.length} capacity={occ.capacity} />
        </div>

        {isStaff && (
          <>
            <Separator className="my-5" />
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Añadir asistente
              </div>
              <div className="flex gap-2">
                <Select value={addUserId} onValueChange={setAddUserId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {addable.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                    {addable.length === 0 && (
                      <div className="p-2 text-xs text-muted-foreground">
                        Todos los usuarios ya están apuntados.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleAdd} disabled={!addUserId}>
                  <UserPlus className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          </>
        )}

        <Separator className="my-5" />

        <section className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Confirmados ({occ.confirmed.length})
          </div>
          {occ.confirmed.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin asistentes todavía.</p>
          ) : (
            <ul className="space-y-1">
              {occ.confirmed.map((b) => {
                const u = userById.get(b.userId);
                const done = hasCheckIn(b.id);
                return (
                  <li
                    key={b.id}
                    className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{u?.name ?? "—"}</div>
                      {done && (
                        <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                          <Check className="h-3 w-3" strokeWidth={2} /> Check-in hecho
                        </div>
                      )}
                    </div>
                    {isStaff && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant={done ? "secondary" : "outline"}
                          onClick={() => handleCheckIn(b.id)}
                          title={done ? "Deshacer check-in" : "Check-in"}
                          className="h-8 w-8"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemove(b.id)}
                          title="Quitar asistente"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {occ.waitlist.length > 0 && (
          <section className="mt-5 space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Lista de espera ({occ.waitlist.length})
            </div>
            <ul className="space-y-1">
              {occ.waitlist.map((b) => {
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
                        onClick={() => handleRemove(b.id)}
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
        )}

        {isStaff && session.status !== "cancelled" && (
          <>
            <Separator className="my-5" />
            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive"
              onClick={handleCancelSession}
            >
              <Ban className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Cancelar sesión completa
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
