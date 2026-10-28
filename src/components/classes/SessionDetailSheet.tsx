import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban } from "lucide-react";
import type { ClassSession, ClassTemplate, User } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
import { AttendeesList } from "./sessionDetail/AttendeesList";
import { WaitlistList } from "./sessionDetail/WaitlistList";
import { AddAttendeeCombobox } from "./sessionDetail/AddAttendeeCombobox";
import { cloudBookSession, cloudCancelBooking, isCloudSession } from "@/lib/cloud/bookings";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ClassSession | null;
  template?: ClassTemplate;
  coach?: User;
  tenantUsers: User[];
}

/**
 * Sheet lateral con la ficha completa de una sesión: ocupación, altas manuales,
 * lista de confirmados/espera y acción de cancelar la sesión completa. Las
 * subvistas viven en `./sessionDetail/*` para mantener este archivo delgado.
 */
export function SessionDetailSheet({
  open, onOpenChange, session, template, coach, tenantUsers,
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

  const handleRemove = async (bookingId: string) => {
    const res = isCloudSession() ? await cloudCancelBooking(bookingId) : cancelBooking(bookingId, currentUser.role);
    if (!res.ok) toast.error(res.reason ?? "No se pudo quitar");
    else {
      toast.success("Reserva eliminada");
      if (res.promoted) toast.info("Se ha promocionado al primero de la lista de espera");
    }
    notifyDataChanged();
  };

  const handleAdd = async () => {
    if (!addUserId) return;
    const res = isCloudSession() ? await cloudBookSession(session.id, addUserId) : addAttendee(session.id, addUserId);
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
            <AddAttendeeCombobox
              addable={addable}
              addUserId={addUserId}
              onChangeUserId={setAddUserId}
              onAdd={handleAdd}
            />
          </>
        )}

        <Separator className="my-5" />

        <AttendeesList
          confirmed={occ.confirmed}
          userById={userById}
          isStaff={isStaff}
          onCheckIn={handleCheckIn}
          onRemove={handleRemove}
        />

        <WaitlistList
          waitlist={occ.waitlist}
          userById={userById}
          isStaff={isStaff}
          onRemove={handleRemove}
        />

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
