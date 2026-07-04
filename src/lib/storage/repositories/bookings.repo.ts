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
