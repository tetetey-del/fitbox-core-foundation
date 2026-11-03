/**
 * @file Sedes del box. Scoped por tenant.
 */
import type { Location } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const locationsRepo = new BaseRepo<Location>("locations", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function locationsRepoFor(tenantId: string) {
  return new BaseRepo<Location>("locations", { scoped: true, getTenantId: () => tenantId });
}
