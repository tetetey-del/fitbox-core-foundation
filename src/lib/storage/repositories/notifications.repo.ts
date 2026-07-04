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
