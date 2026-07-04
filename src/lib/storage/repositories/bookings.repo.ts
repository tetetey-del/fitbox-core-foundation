/**
 * @file Reservas de clase (confirmed/waitlist/cancelled).
 *
 * Scoped por tenant. Los servicios de booking mantienen la coherencia de plazas y posiciones de waitlist; nunca escribir aquí sin pasar por booking.service.
 */
import type { Booking } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const bookingsRepo = new BaseRepo<Booking>("bookings", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function bookingsRepoFor(tenantId: string) {
  return new BaseRepo<Booking>("bookings", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
