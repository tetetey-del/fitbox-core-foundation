import type { Post } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const postsRepo = new BaseRepo<Post>("posts", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function postsRepoFor(tenantId: string) {
  return new BaseRepo<Post>("posts", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
