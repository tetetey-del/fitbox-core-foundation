import type { User, UserRole, UserStatus } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

/**
 * Migración legado transparente:
 * - role "owner" → "admin"
 * - status ausente → "active"
 * (El passwordHash de usuarios demo lo asigna un ensure() al arrancar.)
 */
function migrate<T extends { role?: string; status?: string }>(u: T): T {
  let out: T = u;
  if (u && (u as { role?: string }).role === "owner") {
    out = { ...out, role: "admin" as UserRole };
  }
  if (out && !(out as { status?: string }).status) {
    out = { ...out, status: "active" as UserStatus };
  }
  return out;
}

class UsersRepo extends BaseRepo<User> {
  list(): User[] {
    return super.list().map(migrate);
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

/** Escanea todos los tenants y devuelve el usuario con ese email (case-insensitive). */
export function findUserByEmailGlobal(
  email: string,
): { user: User; tenantId: string } | null {
  if (typeof window === "undefined") return null;
  const needle = email.trim().toLowerCase();
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k || !k.startsWith("fitbox:") || !k.endsWith(":users")) continue;
    try {
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      const list = (JSON.parse(raw) as User[]).map(migrate);
      const hit = list.find((u) => u.email?.toLowerCase() === needle);
      if (hit) return { user: hit, tenantId: hit.tenantId };
    } catch {
      /* ignore */
    }
  }
  return null;
}

/** Actualiza un usuario específico por (tenantId, userId). */
export function updateUserById(
  tenantId: string,
  userId: string,
  patch: Partial<Omit<User, "id" | "createdAt">>,
): User | null {
  return usersRepoFor(tenantId).update(userId, patch);
}
