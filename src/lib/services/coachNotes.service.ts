/**
 * @file Notas de los coaches sobre los socios y avisos en las clases.
 *
 * Una nota puede ir atada a un ejercicio. Cuando el WOD del día de una clase tiene ese
 * ejercicio, el coach ve el aviso al lado del socio en la lista de la clase.
 */
import type { CoachNote, Exercise } from "@/types";
import { coachNotesRepo } from "@/lib/storage/repositories/coachNotes.repo";
import { exercisesRepo } from "@/lib/storage/repositories/exercises.repo";
import { wodsRepo } from "@/lib/storage/repositories/wods.repo";
import { findExercisesInText } from "@/lib/services/prs.service";

export function notesOf(memberId: string): CoachNote[] {
  return coachNotesRepo.query({ memberId }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addNote(input: { tenantId: string; memberId: string; authorId: string; exerciseId?: string; text: string }): CoachNote {
  return coachNotesRepo.create({ ...input, text: input.text.trim(), exerciseId: input.exerciseId || undefined });
}

export function updateNote(id: string, patch: { exerciseId?: string; text: string }): void {
  coachNotesRepo.update(id, { text: patch.text.trim(), exerciseId: patch.exerciseId || undefined });
}

export function deleteNote(id: string): void {
  coachNotesRepo.remove(id);
}

/** Ejercicios que aparecen en el WOD de una fecha (título y bloques). */
export function exercisesInWodOf(date: string): Exercise[] {
  const wods = wodsRepo.query({ date });
  if (wods.length === 0) return [];
  const text = wods.map((w) => [w.title, ...w.blocks.map((b) => b.content)].join("\n")).join("\n");
  return findExercisesInText(text, exercisesRepo.list());
}

export interface ClassAlert {
  exercise: Exercise;
  note: CoachNote;
}

/** Avisos para una clase: notas de los asistentes sobre ejercicios del WOD de ese día. */
export function classAlerts(date: string, memberIds: string[]): Map<string, ClassAlert[]> {
  const out = new Map<string, ClassAlert[]>();
  const inWod = new Map(exercisesInWodOf(date).map((e) => [e.id, e]));
  if (inWod.size === 0) return out;
  for (const id of memberIds) {
    const alerts = notesOf(id)
      .filter((n) => n.exerciseId && inWod.has(n.exerciseId))
      .map((n) => ({ exercise: inWod.get(n.exerciseId!)!, note: n }));
    if (alerts.length) out.set(id, alerts);
  }
  return out;
}
