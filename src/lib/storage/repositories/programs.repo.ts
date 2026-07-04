/**
 * @file Rutinas / programas semanales asignables a socios.
 * Cuatro colecciones scoped por tenant: programs, program_sessions,
 * program_assignments y program_progress.
 */
import type {
  Program,
  ProgramAssignment,
  ProgramProgress,
  ProgramSession,
} from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

const getTid = () => sessionStore.read()?.tenantId ?? null;

export const programsRepo = new BaseRepo<Program>("programs", {
  scoped: true,
  getTenantId: getTid,
});
export const programSessionsRepo = new BaseRepo<ProgramSession>("program_sessions", {
  scoped: true,
  getTenantId: getTid,
});
export const programAssignmentsRepo = new BaseRepo<ProgramAssignment>(
  "program_assignments",
  { scoped: true, getTenantId: getTid },
);
export const programProgressRepo = new BaseRepo<ProgramProgress>("program_progress", {
  scoped: true,
  getTenantId: getTid,
});

export function programsRepoFor(tenantId: string) {
  return new BaseRepo<Program>("programs", { scoped: true, getTenantId: () => tenantId });
}
export function programSessionsRepoFor(tenantId: string) {
  return new BaseRepo<ProgramSession>("program_sessions", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
export function programAssignmentsRepoFor(tenantId: string) {
  return new BaseRepo<ProgramAssignment>("program_assignments", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
export function programProgressRepoFor(tenantId: string) {
  return new BaseRepo<ProgramProgress>("program_progress", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
