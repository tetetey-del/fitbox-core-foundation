/**
 * @file Membresías activas o históricas de cada socio.
 *
 * Scoped por tenant. Un usuario puede tener varias entradas, pero solo una con `status='active'` a la vez.
 */
import type { Membership } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const membershipsRepo = new BaseRepo<Membership>("memberships", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function membershipsRepoFor(tenantId: string) {
  return new BaseRepo<Membership>("memberships", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
