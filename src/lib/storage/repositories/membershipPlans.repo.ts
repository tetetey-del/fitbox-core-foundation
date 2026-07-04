import type { MembershipPlan } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const membershipPlansRepo = new BaseRepo<MembershipPlan>("membership_plans", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function membershipPlansRepoFor(tenantId: string) {
  return new BaseRepo<MembershipPlan>("membership_plans", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
