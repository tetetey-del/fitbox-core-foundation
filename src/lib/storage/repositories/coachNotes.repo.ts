/**
 * @file Notas de los coaches sobre cada socio (solo staff).
 *
 * Scoped por tenant. En Supabase, los socios no pueden leer esta colección.
 */
import type { CoachNote } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const coachNotesRepo = new BaseRepo<CoachNote>("coach_notes", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});
