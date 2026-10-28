/**
 * @file Reservas en boxes reales: las hace el servidor (funciones kf_book_session y
 * kf_cancel_booking de Supabase), que controla créditos, cupos, lista de espera y la
 * regla de una reserva por actividad y día. Después se baja el estado actualizado.
 */
import type { Booking } from "@/types";
import type { BookResult, CancelResult } from "@/lib/services/booking.service";
import { sb } from "./client";
import { flush, getCloudContext, pullTenant } from "./sync";

/** ¿La sesión activa es de un box real (Supabase)? */
export function isCloudSession(): boolean {
  return !!getCloudContext();
}

const NETWORK = "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.";

/** Reservar. Si `userId` es otra persona, es el staff apuntándola (sin controlar créditos). */
export async function cloudBookSession(sessionId: string, userId?: string): Promise<BookResult> {
  const ctx = getCloudContext();
  if (!ctx) return { ok: false, reason: NETWORK };
  await flush();
  const { data, error } = await sb().rpc("kf_book_session", {
    t: ctx.tenantId,
    p_session: sessionId,
    p_user: userId && userId !== ctx.appUserId ? userId : null,
  });
  if (error) return { ok: false, reason: NETWORK };
  const res = data as { ok: boolean; reason?: string; booking?: Booking };
  if (res.ok) await pullTenant().catch(() => {});
  return { ok: res.ok, reason: res.reason, booking: res.booking };
}

export async function cloudCancelBooking(bookingId: string): Promise<CancelResult> {
  const ctx = getCloudContext();
  if (!ctx) return { ok: false, reason: NETWORK };
  await flush();
  const { data, error } = await sb().rpc("kf_cancel_booking", { t: ctx.tenantId, p_booking: bookingId });
  if (error) return { ok: false, reason: NETWORK };
  const res = data as { ok: boolean; reason?: string; charged?: boolean; promoted?: Booking | null };
  if (res.ok) await pullTenant().catch(() => {});
  return { ok: res.ok, reason: res.reason, charged: res.charged, promoted: res.promoted ?? undefined };
}
