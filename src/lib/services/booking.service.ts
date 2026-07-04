import type { Booking, ClassSession, UserRole } from "@/types";
import { bookingsRepo } from "@/lib/storage/repositories/bookings.repo";
import { checkinsRepo } from "@/lib/storage/repositories/checkins.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { hoursBetween, sessionStart } from "@/lib/date";

const DEFAULT_CANCELLATION_HOURS = 2;

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

export function bookSession(sessionId: string, userId: string): BookResult {
  const session = classSessionsRepo.getById(sessionId);
  if (!session) return { ok: false, reason: "La sesión no existe" };
  if (session.status === "cancelled") return { ok: false, reason: "La sesión está cancelada" };

  const existing = getUserBooking(sessionId, userId);
  if (existing) return { ok: false, reason: "Ya tienes una reserva en esta sesión" };

  const occ = getSessionOccupancy(sessionId);
  if (occ.free > 0) {
    const booking = bookingsRepo.create({
      tenantId: session.tenantId,
      sessionId,
      userId,
      status: "confirmed",
    });
    return { ok: true, booking };
  }

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

  const isStaff = actorRole === "owner" || actorRole === "coach";
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

  bookingsRepo.update(bookingId, { status: "cancelled", position: undefined });

  // Elimina el check-in si existía
  const ci = checkinsRepo.query({ bookingId })[0];
  if (ci) checkinsRepo.remove(ci.id);

  let promoted: Booking | undefined;

  if (booking.status === "confirmed") {
    const occ = getSessionOccupancy(booking.sessionId);
    const next = occ.waitlist[0];
    if (next) {
      const updated = bookingsRepo.update(next.id, {
        status: "confirmed",
        position: undefined,
      });
      if (updated) promoted = updated;
      // Reordenar posiciones del resto de la waitlist
      const rest = occ.waitlist.slice(1);
      rest.forEach((b, i) => bookingsRepo.update(b.id, { position: i + 1 }));
    }
  } else if (booking.status === "waitlist") {
    const occ = getSessionOccupancy(booking.sessionId);
    occ.waitlist.forEach((b, i) => bookingsRepo.update(b.id, { position: i + 1 }));
  }

  return { ok: true, promoted };
}

// ---- Check-ins (solo staff) ----

export interface CheckInResult {
  ok: boolean;
  reason?: string;
}

export function checkIn(bookingId: string, actorRole: UserRole): CheckInResult {
  if (actorRole !== "owner" && actorRole !== "coach") {
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
  if (actorRole !== "owner" && actorRole !== "coach") {
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
  bookings.forEach((b) =>
    bookingsRepo.update(b.id, { status: "cancelled", position: undefined }),
  );
}

// ---- Alta manual de asistente (staff) ----

export function addAttendee(sessionId: string, userId: string): BookResult {
  // Reutiliza bookSession pero ignora la duplicidad si ya existe cancelada
  return bookSession(sessionId, userId);
}

export interface SessionForUser extends ClassSession {
  templateName: string;
}
