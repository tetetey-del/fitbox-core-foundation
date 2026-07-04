/**
 * @file Instancias de clase con fecha, hora, capacidad y estado.
 *
 * Scoped por tenant. `getByDate/query` no ordenan: el consumidor decide el criterio (fecha+hora, día, etc.).
 */
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
