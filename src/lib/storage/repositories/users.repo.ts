import type { User } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

// Users are stored per-tenant so the active session determines scope.
export const usersRepo = new BaseRepo<User>("users", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

/** Read users of any tenant (used for the demo tenant picker). */
export function listUsersOfTenant(tenantId: string): User[] {
  const repo = new BaseRepo<User>("users", { scoped: true, getTenantId: () => tenantId });
  return repo.list();
}

export function createUserInTenant(
  tenantId: string,
  data: Omit<User, "id" | "createdAt" | "updatedAt" | "tenantId">,
): User {
  const repo = new BaseRepo<User>("users", { scoped: true, getTenantId: () => tenantId });
  return repo.create({ ...data, tenantId });
}
