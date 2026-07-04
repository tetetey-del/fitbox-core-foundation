import type { Invitation } from "@/types";
import { BaseRepo } from "./base.repo";
import { sessionStore } from "../session";

class InvitationsRepo extends BaseRepo<Invitation> {}

export const invitationsRepo = new InvitationsRepo("invitations", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function invitationsRepoFor(tenantId: string) {
  return new InvitationsRepo("invitations", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}

/** Busca invitación por código en TODOS los tenants (sin sesión). */
export function findInvitationByCode(code: string): Invitation | null {
  if (typeof window === "undefined") return null;
  const upper = code.trim().toUpperCase();
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k || !k.startsWith("fitbox:") || !k.endsWith(":invitations")) continue;
    try {
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      const list = JSON.parse(raw) as Invitation[];
      const hit = list.find((x) => x.code.toUpperCase() === upper);
      if (hit) return hit;
    } catch {
      /* ignore */
    }
  }
  return null;
}
