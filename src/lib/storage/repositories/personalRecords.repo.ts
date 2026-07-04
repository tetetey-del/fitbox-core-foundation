/**
 * @file Marcas personales (peso, tiempo, reps) de un socio en un ejercicio.
 *
 * Scoped por tenant.
 */
import type { PersonalRecord } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const personalRecordsRepo = new BaseRepo<PersonalRecord>("personal_records", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function personalRecordsRepoFor(tenantId: string) {
  return new BaseRepo<PersonalRecord>("personal_records", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
