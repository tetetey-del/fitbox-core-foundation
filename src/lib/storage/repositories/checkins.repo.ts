import type { CheckIn } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const checkinsRepo = new BaseRepo<CheckIn>("checkins", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function checkinsRepoFor(tenantId: string) {
  return new BaseRepo<CheckIn>("checkins", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
