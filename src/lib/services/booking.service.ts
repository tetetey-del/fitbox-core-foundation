import type { Booking, ClassSession, UserRole } from "@/types";
import { bookingsRepo } from "@/lib/storage/repositories/bookings.repo";
import { checkinsRepo } from "@/lib/storage/repositories/checkins.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { hoursBetween, sessionStart, formatDate } from "@/lib/date";
import { consumeCredit, inspectCredits, refundCredit } from "./membership.service";
import { notify } from "./notifications.service";

import { DEFAULT_CANCELLATION_HOURS } from "@/lib/constants";

/**
 * Mutex síncrono en memoria para evitar dobles reservas por doble-click en el
 * mismo par (sessionId, userId). Como todo el storage es localStorage síncrono,
 * un simple Set basta para bloquear reentradas dentro del mismo tick.
 */
const inFlightBookings = new Set<string>();
const bookingKey = (sessionId: string, userId: string) => `${sessionId}::${userId}`;

export function getCancellationWindow(tenantId: string): number {
  const t = tenantsRepo.getById(tenantId);
  return t?.settings?.cancellationWindowHours ?? DEFAULT_CANCELLATION_HOURS;
}

export interface Occupancy {
  confirmed: Booking[];
  waitlist: Booking[];
  free: number;
  capacity: number;
}

export function getSessionOccupancy(sessionId: string): Occupancy {
  const session = classSessionsRepo.getById(sessionId);
  const capacity = session?.capacity ?? 0;
  const bookings = bookingsRepo.query({ sessionId }).filter((b) => b.status !== "cancelled");
  const confirmed = bookings
    .filter((b) => b.status === "confirmed")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const waitlist = bookings
    .filter((b) => b.status === "waitlist")
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  return { confirmed, waitlist, capacity, free: Math.max(0, capacity - confirmed.length) };
}

export function getUserBooking(sessionId: string, userId: string): Booking | null {
  return (
    bookingsRepo
      .query({ sessionId, userId })
      .find((b) => b.status !== "cancelled") ?? null
  );
}

export interface BookResult {
  ok: boolean;
  booking?: Booking;
  reason?: string;
}

export interface BookOptions {
  /** Cuando el staff apunta manualmente a alguien, se saltan las validaciones de créditos. */
  bypassCredits?: boolean;
}

export function bookSession(
  sessionId: string,
  userId: string,
  opts: BookOptions = {},
): BookResult {
  const session = classSessionsRepo.getById(sessionId);
  if (!session) return { ok: false, reason: "La sesión no existe" };
  if (session.status === "cancelled") return { ok: false, reason: "La sesión está cancelada" };

  const existing = getUserBooking(sessionId, userId);
  if (existing) return { ok: false, reason: "Ya tienes una reserva en esta sesión" };

  // Validación de créditos/plan (solo cuando el propio socio se apunta)
  if (!opts.bypassCredits) {
    const check = inspectCredits(userId);
    if (!check.hasMembership) {
      return { ok: false, reason: "Sin membresía activa" };
    }
    if (check.needsCredit && !check.hasCredits) {
      return { ok: false, reason: "Sin créditos disponibles este ciclo" };
    }
  }

  const occ = getSessionOccupancy(sessionId);
  if (occ.free > 0) {
    // Confirmada: consumir crédito ahora (si aplica y no hay bypass)
    if (!opts.bypassCredits) {
      const consumed = consumeCredit(userId);
      if (!consumed) return { ok: false, reason: "Sin créditos disponibles este ciclo" };
    }
    const booking = bookingsRepo.create({
      tenantId: session.tenantId,
      sessionId,
      userId,
      status: "confirmed",
    });
    return { ok: true, booking };
  }

  // Lista de espera: no se consume crédito hasta la promoción
  const position = occ.waitlist.length + 1;
  const booking = bookingsRepo.create({
    tenantId: session.tenantId,
    sessionId,
    userId,
    status: "waitlist",
    position,
  });
  return { ok: true, booking };
}

export interface CancelResult {
  ok: boolean;
  promoted?: Booking;
  reason?: string;
}

export function cancelBooking(bookingId: string, actorRole: UserRole): CancelResult {
  const booking = bookingsRepo.getById(bookingId);
  if (!booking) return { ok: false, reason: "La reserva no existe" };
  if (booking.status === "cancelled") return { ok: false, reason: "La reserva ya está cancelada" };

  const session = classSessionsRepo.getById(booking.sessionId);
  if (!session) return { ok: false, reason: "La sesión no existe" };

  const isStaff = actorRole === "admin" || actorRole === "coach";
  if (!isStaff && booking.status === "confirmed") {
    const start = sessionStart(session.date, session.startTime);
    const window = getCancellationWindow(session.tenantId);
    const remaining = hoursBetween(new Date(), start);
    if (remaining < window) {
      return {
        ok: false,
        reason: `No se puede cancelar con menos de ${window}h de antelación`,
      };
    }
  }

  const wasConfirmed = booking.status === "confirmed";

  bookingsRepo.update(bookingId, { status: "cancelled", position: undefined });

  // Devolver crédito si la reserva era confirmada
  if (wasConfirmed) {
    refundCredit(booking.userId);
  }

  // Elimina el check-in si existía
  const ci = checkinsRepo.query({ bookingId })[0];
  if (ci) checkinsRepo.remove(ci.id);

  let promoted: Booking | undefined;

  if (wasConfirmed) {
    promoted = promoteNextFromWaitlist(booking.sessionId);
  } else if (booking.status === "waitlist") {
    const occ = getSessionOccupancy(booking.sessionId);
    occ.waitlist.forEach((b, i) => bookingsRepo.update(b.id, { position: i + 1 }));
  }

  return { ok: true, promoted };
}

/**
 * Promociona al primero de la lista de espera que tenga créditos disponibles.
 * Si el primero no puede (sin créditos), se prueba con el siguiente. Los que
 * no pueden se mantienen en la lista de espera para más adelante.
 */
function promoteNextFromWaitlist(sessionId: string): Booking | undefined {
  const occ = getSessionOccupancy(sessionId);
  const session = classSessionsRepo.getById(sessionId);
  for (const candidate of occ.waitlist) {
    const check = inspectCredits(candidate.userId);
    if (!check.hasMembership) continue;
    if (check.needsCredit && !check.hasCredits) continue;
    if (check.needsCredit) consumeCredit(candidate.userId);
    const updated = bookingsRepo.update(candidate.id, {
      status: "confirmed",
      position: undefined,
    });
    const rest = getSessionOccupancy(sessionId).waitlist;
    rest.forEach((b, i) => bookingsRepo.update(b.id, { position: i + 1 }));
    if (session) {
      const tpl = classTemplatesRepo.getById(session.templateId);
      notify({
        tenantId: session.tenantId,
        userId: candidate.userId,
        type: "waitlist_promoted",
        title: "¡Has pasado de lista de espera!",
        body: `${tpl?.name ?? "Clase"} · ${formatDate(session.date)} a las ${session.startTime}`,
        linkTo: "/reservas",
      });
    }
    return updated ?? undefined;
  }
  return undefined;
}

// ---- Check-ins (solo staff) ----

export interface CheckInResult {
  ok: boolean;
  reason?: string;
}

export function checkIn(bookingId: string, actorRole: UserRole): CheckInResult {
  if (actorRole !== "admin" && actorRole !== "coach") {
    return { ok: false, reason: "Solo el staff puede hacer check-in" };
  }
  const booking = bookingsRepo.getById(bookingId);
  if (!booking) return { ok: false, reason: "La reserva no existe" };
  if (booking.status !== "confirmed") {
    return { ok: false, reason: "Solo se puede hacer check-in a reservas confirmadas" };
  }
  const already = checkinsRepo.query({ bookingId })[0];
  if (already) return { ok: true };

  checkinsRepo.create({
    tenantId: booking.tenantId,
    bookingId,
    sessionId: booking.sessionId,
    userId: booking.userId,
    checkedInAt: new Date().toISOString(),
  });
  return { ok: true };
}

export function undoCheckIn(bookingId: string, actorRole: UserRole): CheckInResult {
  if (actorRole !== "admin" && actorRole !== "coach") {
    return { ok: false, reason: "Solo el staff puede deshacer check-in" };
  }
  const ci = checkinsRepo.query({ bookingId })[0];
  if (!ci) return { ok: true };
  checkinsRepo.remove(ci.id);
  return { ok: true };
}

export function hasCheckIn(bookingId: string): boolean {
  return checkinsRepo.query({ bookingId }).length > 0;
}

// ---- Cancelar sesión completa (staff) ----

export function cancelSession(sessionId: string): void {
  const session = classSessionsRepo.getById(sessionId);
  if (!session) return;
  classSessionsRepo.update(sessionId, { status: "cancelled" });
  const bookings = bookingsRepo
    .query({ sessionId })
    .filter((b) => b.status !== "cancelled");
  const tpl = classTemplatesRepo.getById(session.templateId);
  bookings.forEach((b) => {
    const wasConfirmed = b.status === "confirmed";
    bookingsRepo.update(b.id, { status: "cancelled", position: undefined });
    if (wasConfirmed) refundCredit(b.userId);
    notify({
      tenantId: session.tenantId,
      userId: b.userId,
      type: "session_cancelled",
      title: "Sesión cancelada",
      body: `${tpl?.name ?? "Clase"} · ${formatDate(session.date)} a las ${session.startTime} ha sido cancelada.`,
      linkTo: "/reservas",
      dedupeKey: `cancelled:${sessionId}:${b.userId}`,
    });
  });
}

// ---- Alta manual de asistente (staff) ----

export function addAttendee(sessionId: string, userId: string): BookResult {
  // El staff apunta manualmente: se saltan las restricciones de créditos.
  return bookSession(sessionId, userId, { bypassCredits: true });
}

export interface SessionForUser extends ClassSession {
  templateName: string;
}
