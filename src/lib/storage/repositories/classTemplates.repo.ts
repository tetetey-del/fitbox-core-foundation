/**
 * @file Plantillas de clase que definen tipo, duración, aforo, coach y color.
 *
 * Scoped por tenant. Se usa como catálogo para generar `class_sessions` recurrentes.
 */
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
