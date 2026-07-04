import type { Member } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const membersRepo = new BaseRepo<Member>("members", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});
