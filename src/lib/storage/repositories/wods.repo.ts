/**
 * @file WODs publicados asociados a fecha y sesiones.
 *
 * Scoped por tenant.
 */
import type { Wod } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const wodsRepo = new BaseRepo<Wod>("wods", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function wodsRepoFor(tenantId: string) {
  return new BaseRepo<Wod>("wods", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
