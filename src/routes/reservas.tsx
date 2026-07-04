import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Clock } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { WeekNavigator } from "@/components/classes/WeekNavigator";
import { SessionCard } from "@/components/classes/SessionCard";
import { SessionDetailSheet } from "@/components/classes/SessionDetailSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion, notifyDataChanged } from "@/lib/data-bus";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import {
  addDays,
  formatDayHeader,
  startOfWeek,
  toDateKey,
  weekDays,
} from "@/lib/date";
import type { ClassSession } from "@/types";
import {
  bookSession,
  cancelBooking,
  getSessionOccupancy,
  getUserBooking,
} from "@/lib/services/booking.service";

export const Route = createFileRoute("/reservas")({ component: ReservasPage });

function ReservasPage() {
  const { currentUser, tenantUsers } = useAuth();
  const dataVersion = useDataVersion();

  const [monday, setMonday] = useState<Date>(() => startOfWeek(new Date()));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const templates = useMemo(() => classTemplatesRepo.list(), [dataVersion]);
  const templateById = useMemo(
    () => new Map(templates.map((t) => [t.id, t])),
    [templates],
  );
  const userById = useMemo(
    () => new Map(tenantUsers.map((u) => [u.id, u])),
    [tenantUsers],
  );

  const days = weekDays(monday);
  const fromKey = toDateKey(days[0]);
  const toKey = toDateKey(days[6]);

  const sessionsThisWeek = useMemo(() => {
    return classSessionsRepo
      .list()
      .filter((s) => s.date >= fromKey && s.date <= toKey)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [fromKey, toKey, dataVersion]);

  const byDay = useMemo(() => {
    const m = new Map<string, ClassSession[]>();
    days.forEach((d) => m.set(toDateKey(d), []));
    sessionsThisWeek.forEach((s) => m.get(s.date)?.push(s));
    return m;
  }, [days, sessionsThisWeek]);

  const selected = selectedId
    ? sessionsThisWeek.find((s) => s.id === selectedId) ?? null
    : null;

  const isStaff = currentUser?.role === "owner" || currentUser?.role === "coach";

  const handleCardClick = (s: ClassSession) => {
    if (isStaff) {
      setSelectedId(s.id);
      return;
    }
    // Miembro: reservar / cancelar / lista de espera
    if (!currentUser) return;
    if (s.status === "cancelled") {
      toast.error("La sesión está cancelada");
      return;
    }
    const existing = getUserBooking(s.id, currentUser.id);
    if (existing) {
      const res = cancelBooking(existing.id, currentUser.role);
      if (!res.ok) toast.error(res.reason ?? "No se pudo cancelar");
      else {
        toast.success("Reserva cancelada");
        if (res.promoted)
          toast.info("Alguien de la lista de espera ha pasado a confirmado");
      }
    } else {
      const res = bookSession(s.id, currentUser.id);
      if (!res.ok) toast.error(res.reason ?? "No se pudo reservar");
      else if (res.booking?.status === "waitlist")
        toast("Añadido a lista de espera", {
          description: `Posición #${res.booking.position}`,
        });
      else toast.success("Reserva confirmada");
    }
    notifyDataChanged();
  };

  return (
    <AppLayout>
      <PageHeader
        title="Reservas"
        description="Calendario semanal de clases. Reserva, cancela o gestiona asistentes."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <WeekNavigator
          monday={monday}
          onPrev={() => setMonday(addDays(monday, -7))}
          onNext={() => setMonday(addDays(monday, 7))}
          onToday={() => setMonday(startOfWeek(new Date()))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((d) => {
          const key = toDateKey(d);
          const items = byDay.get(key) ?? [];
          const isToday = key === toDateKey(new Date());
          return (
            <div key={key} className="min-w-0">
              <div
                className={`mb-2 flex items-center gap-2 text-xs font-medium ${
                  isToday ? "text-brand" : "text-muted-foreground"
                }`}
                style={isToday ? { color: "var(--brand)" } : undefined}
              >
                <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
                {formatDayHeader(d)}
              </div>
              <div className="space-y-2">
                {items.length === 0 && (
                  <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                    Sin clases
                  </div>
                )}
                {items.map((s) => {
                  const tpl = templateById.get(s.templateId);
                  const coach = s.coachId ? userById.get(s.coachId) : undefined;
                  const myBooking = currentUser
                    ? getUserBooking(s.id, currentUser.id)
                    : null;
                  return (
                    <div key={s.id} className="space-y-1.5">
                      <SessionCard
                        session={s}
                        template={tpl}
                        coach={coach}
                        onClick={() => handleCardClick(s)}
                        active={selectedId === s.id}
                      />
                      {!isStaff && (
                        <MemberBadge sessionId={s.id} myBookingId={myBooking?.id} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <SessionDetailSheet
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
        session={selected}
        template={selected ? templateById.get(selected.templateId) : undefined}
        coach={selected?.coachId ? userById.get(selected.coachId) : undefined}
        tenantUsers={tenantUsers}
      />
    </AppLayout>
  );
}

function MemberBadge({ sessionId, myBookingId }: { sessionId: string; myBookingId?: string }) {
  if (!myBookingId) return null;
  const occ = getSessionOccupancy(sessionId);
  const inWait = occ.waitlist.find((b) => b.id === myBookingId);
  const confirmed = occ.confirmed.find((b) => b.id === myBookingId);
  if (confirmed) {
    return (
      <div className="text-[11px] font-medium text-emerald-400 flex items-center gap-1 pl-1">
        <Clock className="h-3 w-3" strokeWidth={1.5} /> Reservado
      </div>
    );
  }
  if (inWait) {
    return (
      <div className="text-[11px] font-medium text-amber-400 flex items-center gap-1 pl-1">
        <Clock className="h-3 w-3" strokeWidth={1.5} /> Lista de espera · #{inWait.position}
      </div>
    );
  }
  return null;
}
