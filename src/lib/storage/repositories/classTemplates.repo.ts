import type { ClassTemplate } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const classTemplatesRepo = new BaseRepo<ClassTemplate>("class_templates", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function classTemplatesRepoFor(tenantId: string) {
  return new BaseRepo<ClassTemplate>("class_templates", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
