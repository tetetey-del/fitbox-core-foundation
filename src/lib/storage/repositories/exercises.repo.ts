import type { Exercise } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const exercisesRepo = new BaseRepo<Exercise>("exercises", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function exercisesRepoFor(tenantId: string) {
  return new BaseRepo<Exercise>("exercises", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
