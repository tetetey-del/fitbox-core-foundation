import type { ClassSession } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const classSessionsRepo = new BaseRepo<ClassSession>("class_sessions", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function classSessionsRepoFor(tenantId: string) {
  return new BaseRepo<ClassSession>("class_sessions", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
