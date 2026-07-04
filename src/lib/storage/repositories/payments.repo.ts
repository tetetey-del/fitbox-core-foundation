/**
 * @file Pagos registrados de socios (renovaciones, altas puntuales).
 *
 * Scoped por tenant. `membershipId` es opcional para pagos no vinculados a una membresía concreta.
 */
import type { Payment } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const paymentsRepo = new BaseRepo<Payment>("payments", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function paymentsRepoFor(tenantId: string) {
  return new BaseRepo<Payment>("payments", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
