import type { User, UserRole } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

/**
 * Migración legado: usuarios guardados como role "owner" pasan a "admin"
 * de forma transparente al leerlos.
 */
function migrateOwner<T extends { role?: string }>(u: T): T {
  if (u && (u as { role?: string }).role === "owner") {
    return { ...u, role: "admin" as UserRole };
  }
  return u;
}

class UsersRepo extends BaseRepo<User> {
  list(): User[] {
    return super.list().map(migrateOwner);
  }
}

export const usersRepo = new UsersRepo("users", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function usersRepoFor(tenantId: string) {
  return new UsersRepo("users", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}

export function listUsersOfTenant(tenantId: string): User[] {
  return usersRepoFor(tenantId).list();
}

export function createUserInTenant(
  tenantId: string,
  data: Omit<User, "id" | "createdAt" | "updatedAt" | "tenantId">,
): User {
  return usersRepoFor(tenantId).create({ ...data, tenantId });
}
