import { createFileRoute } from "@tanstack/react-router";
import { useRequireModule } from "@/hooks/useRequireModule";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Clock } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { WeekNavigator } from "@/components/classes/WeekNavigator";
import { SessionCard } from "@/components/classes/SessionCard";
import { SessionDetailSheet } from "@/components/classes/SessionDetailSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion, notifyDataChanged } from "@/lib/data-bus";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { bookingsRepo } from "@/lib/storage/repositories/bookings.repo";

import {
  addDays,
  formatDayHeader,
  startOfWeek,
  toDateKey,
  weekDays,
  formatLongDay,
} from "@/lib/date";
import type { Booking, ClassSession, ClassTemplate } from "@/types";
import {
  bookSession,
  findSameActivityBookingOnDay,
  hasSessionStarted,
  isLateCancellation,
  cancelBooking,
  getUserBooking,
} from "@/lib/services/booking.service";



import { getPublishedWodByDate } from "@/lib/services/wods.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WodViewer } from "@/components/wods/WodViewer";

export const Route = createFileRoute("/reservas")({ component: ReservasPage });

function ReservasPage() {
  useRequireModule("reservas");
  const { currentUser, tenantUsers } = useAuth();
  const dataVersion = useDataVersion();

  const [monday, setMonday] = useState<Date>(() => startOfWeek(new Date()));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Clase que el socio está por reservar o cancelar, a la espera de que confirme. */
  const [pending, setPending] = useState<{ session: ClassSession; action: "book" | "cancel" } | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() => toDateKey(new Date()));


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

  // Precalcula ocupaciones y reservas propias UNA vez por render (evita
  // O(N sesiones) llamadas a getSessionOccupancy / getUserBooking).
  const { occByS, myBookingByS } = useMemo(() => {
    const allBookings = bookingsRepo
      .list()
      .filter((b) => b.status !== "cancelled");
    const bySession = new Map<string, Booking[]>();
    for (const b of allBookings) {
      const arr = bySession.get(b.sessionId) ?? [];
      arr.push(b);
      bySession.set(b.sessionId, arr);
    }
    const occ = new Map<string, { confirmed: Booking[]; waitlist: Booking[]; capacity: number; free: number }>();
    const mine = new Map<string, Booking>();
    for (const s of sessionsThisWeek) {
      const list = bySession.get(s.id) ?? [];
      const confirmed = list
        .filter((b) => b.status === "confirmed")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const waitlist = list
        .filter((b) => b.status === "waitlist")
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      occ.set(s.id, {
        confirmed,
        waitlist,
        capacity: s.capacity,
        free: Math.max(0, s.capacity - confirmed.length),
      });
      if (currentUser) {
        const own = list.find((b) => b.userId === currentUser.id);
        if (own) mine.set(s.id, own);
      }
    }
    return { occByS: occ, myBookingByS: mine };
  }, [sessionsThisWeek, currentUser]);


  const selected = selectedId
    ? sessionsThisWeek.find((s) => s.id === selectedId) ?? null
    : null;

  const isStaff = currentUser?.role === "admin" || currentUser?.role === "coach";

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
    if (hasSessionStarted(s)) {
      toast.error("Esta clase ya pasó");
      return;
    }
    const existing = getUserBooking(s.id, currentUser.id);
    if (!existing) {
      // Aviso antes de abrir el cartel si ya tiene esta actividad ese día
      const same = findSameActivityBookingOnDay(s.id, currentUser.id);
      if (same) {
        toast.error(`Ya tienes ${same.activityName} ese día a las ${same.session.startTime}`, {
          description: "Solo puedes reservar una vez por actividad y día.",
        });
        return;
      }
    }
    setPending({ session: s, action: existing ? "cancel" : "book" });
  };

  const confirmPending = () => {
    if (!pending || !currentUser) return;
    const s = pending.session;
    setPending(null);
    const existing = getUserBooking(s.id, currentUser.id);
    if (existing) {
      const res = cancelBooking(existing.id, currentUser.role);
      if (!res.ok) toast.error(res.reason ?? "No se pudo cancelar");
      else {
        if (res.charged)
          toast.warning("Reserva cancelada", {
            description: "Cancelaste con poca antelación: la clase se descontó igual.",
          });
        else toast.success("Reserva cancelada");
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
  const renderDayColumn = (d: Date, opts: { showHeader?: boolean } = { showHeader: true }) => {
    const key = toDateKey(d);
    const items = byDay.get(key) ?? [];
    const isToday = key === toDateKey(new Date());
    const showHeader = opts.showHeader !== false;
    const wod = getPublishedWodByDate(key);
    return (
      <div key={key} className="min-w-0">
        {showHeader && (
          <div
            className={`mb-2 flex items-center gap-2 text-xs font-medium ${
              isToday ? "text-brand" : "text-muted-foreground"
            }`}
            style={isToday ? { color: "var(--brand)" } : undefined}
          >
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
            {formatDayHeader(d)}
          </div>
        )}
        {wod && (
          <div className="mb-2">
            <WodViewer wod={wod} defaultOpen={isToday} />
          </div>
        )}
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
              Sin clases programadas
            </div>
          )}
          {items.map((s) => {
            const tpl = templateById.get(s.templateId);
            const coach = s.coachId ? userById.get(s.coachId) : undefined;
            const myBooking = myBookingByS.get(s.id) ?? null;
            const occ = occByS.get(s.id);
            return (
              <div key={s.id} className="space-y-1.5">
                <SessionCard
                  session={s}
                  template={tpl}
                  coach={coach}
                  onClick={() => handleCardClick(s)}
                  active={selectedId === s.id}
                  occupancy={occ}
                  past={hasSessionStarted(s)}
                  booked={
                    !isStaff && myBooking && myBooking.status !== "cancelled"
                      ? (myBooking.status as "confirmed" | "waitlist")
                      : undefined
                  }
                />

                {!isStaff && myBooking && occ && (
                  <MemberBadge
                    myBookingId={myBooking.id}
                    waitlist={occ.waitlist}
                    confirmed={occ.confirmed}
                  />
                )}
              </div>
            );
          })}

        </div>
      </div>
    );
  };

  return (
    <AppLayout>

      <PageHeader
        title="Reservas"
        description="Calendario semanal de clases. Reserva, cancela o gestiona asistentes."
      />

      {!isStaff && currentUser && (
        <MyUpcomingClasses
          userId={currentUser.id}
          templateById={templateById}
          onCancel={(session) => setPending({ session, action: "cancel" })}
          version={dataVersion}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <WeekNavigator
          monday={monday}
          onPrev={() => setMonday(addDays(monday, -7))}
          onNext={() => setMonday(addDays(monday, 7))}
          onToday={() => {
            setMonday(startOfWeek(new Date()));
            setSelectedDayKey(toDateKey(new Date()));
          }}
        />
      </div>

      {/* Selector de día (solo móvil) */}
      <div className="md:hidden mb-4 -mx-4 px-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {days.map((d) => {
            const key = toDateKey(d);
            const isSel = key === selectedDayKey;
            const isToday = key === toDateKey(new Date());
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDayKey(key)}
                aria-pressed={isSel}
                className={`shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-md border text-xs font-medium transition-colors ${
                  isSel
                    ? "border-foreground bg-foreground text-background"
                    : isToday
                      ? "border-border bg-muted text-foreground"
                      : "border-border text-muted-foreground"
                }`}
              >
                <span className="uppercase">{formatDayHeader(d).split(" ")[0]}</span>
                <span className="text-base font-semibold">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: 7 columnas · Móvil: día seleccionado */}
      <div className="hidden md:grid md:grid-cols-7 gap-3">
        {days.map((d) => renderDayColumn(d))}
      </div>
      <div className="md:hidden">
        {(() => {
          const d = days.find((x) => toDateKey(x) === selectedDayKey) ?? days[0];
          return renderDayColumn(d, { showHeader: false });
        })()}
      </div>


      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          {pending && (() => {
            const tpl = templateById.get(pending.session.templateId);
            const name = tpl?.name ?? "la clase";
            const when = `${formatLongDay(pending.session.date)} a las ${pending.session.startTime}`;
            const occ = occByS.get(pending.session.id);
            const full = pending.action === "book" && !!occ && occ.free <= 0;
            const myBk = currentUser ? getUserBooking(pending.session.id, currentUser.id) : null;
            const lateInfo = isLateCancellation(pending.session);
            const lateCharge = pending.action === "cancel" && myBk?.status === "confirmed" && lateInfo.late;
            return (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {pending.action === "book" ? (full ? "Lista de espera" : "Confirmar reserva") : "Cancelar reserva"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {pending.action === "book"
                      ? full
                        ? `La clase de ${name} del ${when} está completa. ¿Quieres entrar en la lista de espera?`
                        : `Te estás inscribiendo a ${name}, ${when}. ¿Confirmas?`
                      : lateCharge
                        ? `Faltan menos de ${lateInfo.windowHours === 1 ? "1 hora" : `${lateInfo.windowHours} horas`} para ${name} (${when}). Si cancelas ahora, la clase se te descuenta igual.`
                        : `¿Quieres cancelar tu reserva de ${name}, ${when}? Se te devuelve la clase.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{pending.action === "book" ? "Cancelar" : "Volver"}</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmPending}>
                    {pending.action === "book" ? (full ? "Entrar en espera" : "Confirmar") : lateCharge ? "Cancelar igual" : "Sí, cancelar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            );
          })()}
        </AlertDialogContent>
      </AlertDialog>

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

function MemberBadge({
  myBookingId,
  waitlist,
  confirmed,
}: {
  myBookingId: string;
  waitlist: Booking[];
  confirmed: Booking[];
}) {
  const inWait = waitlist.find((b) => b.id === myBookingId);
  const isConfirmed = confirmed.some((b) => b.id === myBookingId);
  if (isConfirmed) {
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

/** Bloque visible arriba de Reservas con las próximas clases del socio. */
function MyUpcomingClasses({
  userId,
  templateById,
  onCancel,
  version,
}: {
  userId: string;
  templateById: Map<string, ClassTemplate>;
  onCancel: (session: ClassSession) => void;
  version: number;
}) {
  const items = useMemo(() => {
    return bookingsRepo
      .query({ userId })
      .filter((b) => b.status === "confirmed" || b.status === "waitlist")
      .map((b) => ({ b, s: classSessionsRepo.getById(b.sessionId) }))
      .filter((x): x is { b: Booking; s: ClassSession } => !!x.s && x.s.status !== "cancelled" && !hasSessionStarted(x.s))
      .sort((a, b) => (a.s.date + a.s.startTime).localeCompare(b.s.date + b.s.startTime))
      .slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, version]);

  return (
    <section className="mb-5 rounded-lg border border-[var(--brand)]/40 bg-card p-4">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <CalendarDays className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--brand)" }} />
        Mis próximas clases
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Todavía no tienes clases reservadas. Elige una en el calendario de abajo.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {items.map(({ b, s }) => {
            const tpl = templateById.get(s.templateId);
            return (
              <li key={b.id} className="flex items-center gap-3 py-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: tpl?.color ?? "var(--brand)" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {tpl?.name ?? "Clase"} · {s.startTime}
                  </div>
                  <div className="text-xs text-muted-foreground first-letter:uppercase">
                    {formatLongDay(s.date)}
                    {b.status === "waitlist" && ` · en espera (#${b.position ?? "?"})`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCancel(s)}
                  className="shrink-0 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Cancelar
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
