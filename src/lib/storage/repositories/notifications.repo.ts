/**
 * @file Notificaciones internas mostradas en la campana.
 *
 * Scoped por tenant. Ordenación descendente por `createdAt` responsabilidad del consumidor.
 */
import type { Notification } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const notificationsRepo = new BaseRepo<Notification>("notifications", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function notificationsRepoFor(tenantId: string) {
  return new BaseRepo<Notification>("notifications", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
