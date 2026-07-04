/**
 * @file Servicio de rutinas / programas asignables.
 * CRUD de programas + sesiones semanales, asignaciones a socios y progreso
 * marcado por el socio. Notifica al socio cuando le asignan un programa.
 */
import type {
  Program,
  ProgramAssignment,
  ProgramProgress,
  ProgramSession,
  WodBlock,
} from "@/types";
import {
  programAssignmentsRepo,
  programProgressRepo,
  programSessionsRepo,
  programsRepo,
} from "@/lib/storage/repositories/programs.repo";
import { toDateKey } from "@/lib/date";
import { notify } from "./notifications.service";

export interface ProgramInput {
  tenantId: string;
  title: string;
  description: string;
  weeks: number;
  level: Program["level"];
  createdBy: string;
}

export function createProgram(input: ProgramInput): Program {
  return programsRepo.create(input);
}

export function updateProgram(id: string, patch: Partial<Program>) {
  return programsRepo.update(id, patch);
}

export function deleteProgram(id: string): void {
  programSessionsRepo.query({ programId: id }).forEach((s) => programSessionsRepo.remove(s.id));
  programAssignmentsRepo.query({ programId: id }).forEach((a) => {
    programProgressRepo.query({ assignmentId: a.id }).forEach((p) => programProgressRepo.remove(p.id));
    programAssignmentsRepo.remove(a.id);
  });
  programsRepo.remove(id);
}

export function upsertProgramSession(input: {
  tenantId: string;
  programId: string;
  weekNumber: number;
  dayNumber: number;
  title: string;
  blocks: WodBlock[];
  id?: string;
}): ProgramSession {
  if (input.id) {
    const updated = programSessionsRepo.update(input.id, {
      weekNumber: input.weekNumber,
      dayNumber: input.dayNumber,
      title: input.title,
      blocks: input.blocks,
    });
    if (updated) return updated;
  }
  return programSessionsRepo.create({
    tenantId: input.tenantId,
    programId: input.programId,
    weekNumber: input.weekNumber,
    dayNumber: input.dayNumber,
    title: input.title,
    blocks: input.blocks,
  });
}

export function deleteProgramSession(id: string): void {
  programSessionsRepo.remove(id);
}

export function listProgramSessions(programId: string): ProgramSession[] {
  return programSessionsRepo
    .query({ programId })
    .sort((a, b) => a.weekNumber - b.weekNumber || a.dayNumber - b.dayNumber);
}

export function duplicateProgram(id: string, newTitle?: string): Program | null {
  const src = programsRepo.getById(id);
  if (!src) return null;
  const copy = programsRepo.create({
    tenantId: src.tenantId,
    title: newTitle ?? `${src.title} (copia)`,
    description: src.description,
    weeks: src.weeks,
    level: src.level,
    createdBy: src.createdBy,
  });
  listProgramSessions(id).forEach((s) => {
    programSessionsRepo.create({
      tenantId: s.tenantId,
      programId: copy.id,
      weekNumber: s.weekNumber,
      dayNumber: s.dayNumber,
      title: s.title,
      blocks: s.blocks,
    });
  });
  return copy;
}

export function assignProgram(input: {
  tenantId: string;
  programId: string;
  userId: string;
  assignedBy: string;
  startDate?: string;
}): ProgramAssignment {
  const assignment = programAssignmentsRepo.create({
    tenantId: input.tenantId,
    programId: input.programId,
    userId: input.userId,
    assignedBy: input.assignedBy,
    startDate: input.startDate ?? toDateKey(new Date()),
    status: "active",
  });
  const p = programsRepo.getById(input.programId);
  if (p) {
    notify({
      tenantId: input.tenantId,
      userId: input.userId,
      type: "program_assigned",
      title: "Nueva rutina asignada",
      body: `Te han asignado la rutina "${p.title}".`,
      linkTo: "/rutinas",
      dedupeKey: `program_assigned:${assignment.id}`,
    });
  }
  return assignment;
}

export function unassignProgram(assignmentId: string): void {
  programProgressRepo.query({ assignmentId }).forEach((p) => programProgressRepo.remove(p.id));
  programAssignmentsRepo.remove(assignmentId);
}

export function setAssignmentStatus(assignmentId: string, status: ProgramAssignment["status"]) {
  return programAssignmentsRepo.update(assignmentId, { status });
}

export function markSessionCompleted(input: {
  tenantId: string;
  assignmentId: string;
  programSessionId: string;
  notes?: string;
}): ProgramProgress | null {
  const existing = programProgressRepo
    .query({ assignmentId: input.assignmentId, programSessionId: input.programSessionId })[0];
  if (existing) {
    return programProgressRepo.update(existing.id, {
      completedAt: new Date().toISOString(),
      notes: input.notes,
    });
  }
  return programProgressRepo.create({
    tenantId: input.tenantId,
    assignmentId: input.assignmentId,
    programSessionId: input.programSessionId,
    completedAt: new Date().toISOString(),
    notes: input.notes,
  });
}

export function unmarkSession(assignmentId: string, programSessionId: string): void {
  programProgressRepo
    .query({ assignmentId, programSessionId })
    .forEach((p) => programProgressRepo.remove(p.id));
}

export function assignmentProgress(assignmentId: string): { done: number; total: number; pct: number } {
  const a = programAssignmentsRepo.getById(assignmentId);
  if (!a) return { done: 0, total: 0, pct: 0 };
  const total = listProgramSessions(a.programId).length;
  const done = programProgressRepo.query({ assignmentId }).length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function listMyAssignments(userId: string): Array<{
  assignment: ProgramAssignment;
  program: Program;
  progress: { done: number; total: number; pct: number };
}> {
  return programAssignmentsRepo
    .query({ userId })
    .map((a) => {
      const p = programsRepo.getById(a.programId);
      return p ? { assignment: a, program: p, progress: assignmentProgress(a.id) } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => b.assignment.createdAt.localeCompare(a.assignment.createdAt));
}

export function nextPendingSession(assignmentId: string): ProgramSession | null {
  const a = programAssignmentsRepo.getById(assignmentId);
  if (!a) return null;
  const done = new Set(
    programProgressRepo.query({ assignmentId }).map((p) => p.programSessionId),
  );
  return listProgramSessions(a.programId).find((s) => !done.has(s.id)) ?? null;
}
