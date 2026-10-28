/**
 * @file Servicio de reservas de clases.
 * Responsabilidad: ciclo de vida de bookings (reservar, cancelar, waitlist,
 * check-ins) y coordinación con créditos de membresía y notificaciones.
 * No accede a localStorage directamente: usa repositorios.
 */
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

/** ¿La clase ya empezó? (no se puede reservar ni cancelar) */
export function hasSessionStarted(session: ClassSession): boolean {
  return sessionStart(session.date, session.startTime) <= new Date();
}

/**
 * ¿Cancelar esta reserva ahora sería tarde? Si faltan menos horas que la ventana de cancelación
 * del box (1 h por defecto), el socio puede cancelar igual, pero la clase se le descuenta.
 */
export function isLateCancellation(session: ClassSession): { late: boolean; windowHours: number } {
  const windowHours = getCancellationWindow(session.tenantId);
  const remaining = hoursBetween(new Date(), sessionStart(session.date, session.startTime));
  return { late: remaining < windowHours, windowHours };
}

export interface Occupancy {
  confirmed: Booking[];
  waitlist: Booking[];
  /** Lugares ofrecidos a alguien de la lista de espera, esperando su confirmación. */
  offered: Booking[];
  free: number;
  capacity: number;
}

/** Minutos que tiene alguien de la lista de espera para confirmar un lugar que se liberó. */
export const OFFER_MINUTES = 10;

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
  const offered = bookings.filter((b) => b.status === "offered");
  return { confirmed, waitlist, offered, capacity, free: Math.max(0, capacity - confirmed.length - offered.length) };
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

/**
 * Si el socio ya tiene una reserva (confirmada o en espera) de la misma actividad ese día,
 * devuelve esa clase. Misma actividad = misma plantilla, o mismo tipo de clase salvo "otro".
 * Se puede ir a actividades distintas el mismo día (CrossFit y Halterofilia, por ejemplo).
 */
export function findSameActivityBookingOnDay(
  sessionId: string,
  userId: string,
): { session: ClassSession; activityName: string } | null {
  const session = classSessionsRepo.getById(sessionId);
  if (!session) return null;
  const templates = new Map(classTemplatesRepo.list().map((t) => [t.id, t]));
  const tpl = templates.get(session.templateId);
  const sameDay = classSessionsRepo
    .list()
    .filter((s) => s.date === session.date && s.id !== session.id && s.status !== "cancelled");
  for (const other of sameDay) {
    const otherTpl = templates.get(other.templateId);
    const sameActivity =
      other.templateId === session.templateId ||
      (!!tpl && !!otherTpl && tpl.type !== "otro" && otherTpl.type === tpl.type);
    if (!sameActivity) continue;
    const b = getUserBooking(other.id, userId);
    if (b && b.status !== "cancelled") {
      return { session: other, activityName: otherTpl?.name ?? tpl?.name ?? "esa actividad" };
    }
  }
  return null;
}

export function bookSession(
  sessionId: string,
  userId: string,
  opts: BookOptions = {},
): BookResult {
  const key = bookingKey(sessionId, userId);
  if (inFlightBookings.has(key)) {
    return { ok: false, reason: "Reserva en curso, espera un momento" };
  }
  inFlightBookings.add(key);
  try {
    const session = classSessionsRepo.getById(sessionId);
    if (!session) return { ok: false, reason: "La sesión no existe" };
    if (session.status === "cancelled") return { ok: false, reason: "La sesión está cancelada" };
    if (hasSessionStarted(session)) return { ok: false, reason: "Esta clase ya pasó" };

    const existing = getUserBooking(sessionId, userId);
    if (existing) return { ok: false, reason: "Ya tienes una reserva en esta sesión" };

    const sameActivity = findSameActivityBookingOnDay(sessionId, userId);
    if (sameActivity) {
      return {
        ok: false,
        reason: `Ya tienes ${sameActivity.activityName} ese día a las ${sameActivity.session.startTime}. Solo puedes reservar una vez por actividad y día.`,
      };
    }

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
  } finally {
    inFlightBookings.delete(key);
  }
}

export interface CancelResult {
  ok: boolean;
  promoted?: Booking;
  reason?: string;
  /** true si se canceló tarde y la clase se descontó igual (no se devolvió el crédito). */
  charged?: boolean;
}

export function cancelBooking(bookingId: string, actorRole: UserRole): CancelResult {
  const booking = bookingsRepo.getById(bookingId);
  if (!booking) return { ok: false, reason: "La reserva no existe" };
  if (booking.status === "cancelled") return { ok: false, reason: "La reserva ya está cancelada" };

  const session = classSessionsRepo.getById(booking.sessionId);
  if (!session) return { ok: false, reason: "La sesión no existe" };

  const isStaff = actorRole === "admin" || actorRole === "coach";
  if (actorRole === "coach") {
    return { ok: false, reason: "Solo el dueño o administrador puede quitar reservas" };
  }
  if (!isStaff && hasSessionStarted(session)) {
    return { ok: false, reason: "La clase ya empezó: ya no se puede cancelar" };
  }
  // Cancelación tarde del propio socio: se permite, pero la clase se descuenta igual
  const charged = !isStaff && booking.status === "confirmed" && isLateCancellation(session).late;

  const wasConfirmed = booking.status === "confirmed";
  const hadSpot = booking.status === "confirmed" || booking.status === "offered";

  bookingsRepo.update(bookingId, { status: "cancelled", position: undefined, offerExpiresAt: undefined });

  // Devolver crédito si la reserva era confirmada y no se canceló tarde
  if (wasConfirmed && !charged) {
    refundCredit(booking.userId);
  }

  // Elimina el check-in si existía
  const ci = checkinsRepo.query({ bookingId })[0];
  if (ci) checkinsRepo.remove(ci.id);

  let promoted: Booking | undefined;

  if (hadSpot) {
    promoted = promoteNextFromWaitlist(booking.sessionId);
  } else if (booking.status === "waitlist") {
    const occ = getSessionOccupancy(booking.sessionId);
    occ.waitlist.forEach((b, i) => bookingsRepo.update(b.id, { position: i + 1 }));
  }

  return { ok: true, promoted, charged };
}

/**
 * Se liberó un lugar: se le OFRECE al primero de la lista de espera que tenga plan y créditos.
 * Tiene OFFER_MINUTES minutos (o hasta que empiece la clase) para confirmarlo; mientras tanto
 * el lugar queda reservado para esa persona y todavía no se le descuenta el crédito.
 */
function promoteNextFromWaitlist(sessionId: string): Booking | undefined {
  const occ = getSessionOccupancy(sessionId);
  const session = classSessionsRepo.getById(sessionId);
  if (!session || session.status === "cancelled" || hasSessionStarted(session) || occ.free <= 0) return undefined;
  for (const candidate of occ.waitlist) {
    const check = inspectCredits(candidate.userId);
    if (!check.hasMembership) continue;
    if (check.needsCredit && !check.hasCredits) continue;
    const start = sessionStart(session.date, session.startTime).getTime();
    const expires = new Date(Math.min(Date.now() + OFFER_MINUTES * 60_000, start));
    const updated = bookingsRepo.update(candidate.id, {
      status: "offered",
      position: undefined,
      offerExpiresAt: expires.toISOString(),
    });
    const rest = getSessionOccupancy(sessionId).waitlist;
    rest.forEach((b, i) => bookingsRepo.update(b.id, { position: i + 1 }));
    const tpl = classTemplatesRepo.getById(session.templateId);
    const hh = expires.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    notify({
      tenantId: session.tenantId,
      userId: candidate.userId,
      type: "waitlist_offer",
      title: "¡Se liberó un lugar!",
      body: `${tpl?.name ?? "Clase"} · ${formatDate(session.date)} a las ${session.startTime}. Confírmalo antes de las ${hh} h o pasará a la siguiente persona.`,
      linkTo: "/reservas",
    });
    return updated ?? undefined;
  }
  return undefined;
}

/** Respuesta del socio a un lugar ofrecido: confirmar (se descuenta el crédito) o rechazarlo. */
export function respondOffer(bookingId: string, accept: boolean): { ok: boolean; reason?: string } {
  expireOffers();
  const booking = bookingsRepo.getById(bookingId);
  if (!booking) return { ok: false, reason: "La reserva no existe" };
  if (booking.status !== "offered") {
    return {
      ok: false,
      reason: booking.offerExpired
        ? "Se venció el plazo para confirmar: el lugar pasó a la siguiente persona."
        : "Este lugar ya no está disponible.",
    };
  }
  if (!accept) {
    bookingsRepo.update(bookingId, { status: "cancelled", offerExpiresAt: undefined });
    promoteNextFromWaitlist(booking.sessionId);
    return { ok: true };
  }
  if (!consumeCredit(booking.userId) || !inspectCredits(booking.userId).hasMembership) {
    bookingsRepo.update(bookingId, { status: "cancelled", offerExpiresAt: undefined });
    promoteNextFromWaitlist(booking.sessionId);
    return { ok: false, reason: "No tienes créditos disponibles: el lugar pasó a la siguiente persona." };
  }
  bookingsRepo.update(bookingId, { status: "confirmed", offerExpiresAt: undefined });
  return { ok: true };
}

/** Vence los lugares ofrecidos que nadie confirmó a tiempo y los ofrece al siguiente. Devuelve cuántos venció. */
export function expireOffers(): number {
  const now = Date.now();
  const due = bookingsRepo
    .list()
    .filter((b) => b.status === "offered" && b.offerExpiresAt && new Date(b.offerExpiresAt).getTime() <= now);
  for (const b of due) {
    bookingsRepo.update(b.id, { status: "cancelled", offerExpired: true, offerExpiresAt: undefined });
    const session = classSessionsRepo.getById(b.sessionId);
    const tpl = session ? classTemplatesRepo.getById(session.templateId) : null;
    if (session) {
      notify({
        tenantId: session.tenantId,
        userId: b.userId,
        type: "waitlist_offer_expired",
        title: "Se venció el plazo",
        body: `No confirmaste el lugar en ${tpl?.name ?? "la clase"} · ${formatDate(session.date)} a las ${session.startTime} y pasó a la siguiente persona.`,
        linkTo: "/reservas",
      });
    }
    promoteNextFromWaitlist(b.sessionId);
  }
  return due.length;
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
  // El dueño anota a alguien: se controlan su plan y sus créditos igual que si reservara él.
  const res = bookSession(sessionId, userId);
  if (!res.ok && res.reason === "Sin membresía activa") {
    return { ok: false, reason: "Esa persona no tiene un plan activo. Asígnale un plan primero." };
  }
  if (!res.ok && res.reason === "Sin créditos disponibles este ciclo") {
    return { ok: false, reason: "Esa persona no tiene créditos disponibles." };
  }
  return res;
}

export interface SessionForUser extends ClassSession {
  templateName: string;
}
