/**
 * @file Servicio de PRs (personal records) y catálogo de ejercicios.
 * Responsabilidad: registrar marcas, calcular mejores por usuario y construir
 * el leaderboard aplicando la comparación específica por unidad (kg, reps,
 * tiempo — donde menos es mejor).
 */
import type { Exercise, ExerciseCategory, ExerciseUnit, PersonalRecord } from "@/types";
import { exercisesRepo, exercisesRepoFor } from "@/lib/storage/repositories/exercises.repo";
import { personalRecordsRepo } from "@/lib/storage/repositories/personalRecords.repo";
import { isBetter } from "@/lib/format";

// ---- Catálogo por defecto ----

interface DefaultExercise {
  name: string;
  category: ExerciseCategory;
  unit: ExerciseUnit;
}

export const DEFAULT_EXERCISES: DefaultExercise[] = [
  // Fuerza
  { name: "Back Squat", category: "fuerza", unit: "kg" },
  { name: "Front Squat", category: "fuerza", unit: "kg" },
  { name: "Deadlift", category: "fuerza", unit: "kg" },
  { name: "Bench Press", category: "fuerza", unit: "kg" },
  { name: "Strict Press", category: "fuerza", unit: "kg" },
  // Olímpicos
  { name: "Clean & Jerk", category: "olimpico", unit: "kg" },
  { name: "Snatch", category: "olimpico", unit: "kg" },
  // Benchmark WODs
  { name: "Fran", category: "benchmark_wod", unit: "tiempo" },
  { name: "Grace", category: "benchmark_wod", unit: "tiempo" },
  { name: "Helen", category: "benchmark_wod", unit: "tiempo" },
  { name: "Murph", category: "benchmark_wod", unit: "tiempo" },
  { name: "Cindy", category: "benchmark_wod", unit: "reps" },
  // Gimnásticos
  { name: "Pull-ups max", category: "gimnastico", unit: "reps" },
  { name: "HSPU max", category: "gimnastico", unit: "reps" },
  // Cardio
  { name: "Run 5K", category: "cardio", unit: "tiempo" },
];

export function seedDefaultExercisesFor(tenantId: string): Exercise[] {
  const repo = exercisesRepoFor(tenantId);
  return DEFAULT_EXERCISES.map((d) =>
    repo.create({ tenantId, isCustom: false, ...d }),
  );
}

// ---- PRs ----

export interface RegisterPRInput {
  userId: string;
  exerciseId: string;
  value: number;
  rx: boolean;
  date: string;
  notes?: string;
}

export function registerPR(input: RegisterPRInput): PersonalRecord | null {
  const exercise = exercisesRepo.getById(input.exerciseId);
  if (!exercise) return null;
  return personalRecordsRepo.create({
    tenantId: exercise.tenantId,
    ...input,
  });
}

export function deletePR(id: string): boolean {
  return personalRecordsRepo.remove(id);
}

export interface ExercisePRSummary {
  exercise: Exercise;
  best: PersonalRecord | null;
  total: number;
}

/** PRs del usuario agrupados por ejercicio con el mejor destacado. */
export function getUserPRs(userId: string): ExercisePRSummary[] {
  const all = exercisesRepo.list();
  const prs = personalRecordsRepo.query({ userId });
  const byExercise = new Map<string, PersonalRecord[]>();
  for (const pr of prs) {
    const arr = byExercise.get(pr.exerciseId) ?? [];
    arr.push(pr);
    byExercise.set(pr.exerciseId, arr);
  }

  return all
    .map((ex) => {
      const list = byExercise.get(ex.id) ?? [];
      const best = list.reduce<PersonalRecord | null>((acc, cur) => {
        if (!acc) return cur;
        return isBetter(cur.value, acc.value, ex.unit) ? cur : acc;
      }, null);
      return { exercise: ex, best, total: list.length };
    })
    .sort((a, b) => a.exercise.name.localeCompare(b.exercise.name));
}

export function getExerciseHistory(userId: string, exerciseId: string): PersonalRecord[] {
  return personalRecordsRepo
    .query({ userId, exerciseId })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type RxFilter = "all" | "rx" | "scaled";

export interface LeaderboardEntry {
  userId: string;
  best: PersonalRecord;
}

export function getLeaderboard(
  exerciseId: string,
  opts: { rxFilter?: RxFilter } = {},
): LeaderboardEntry[] {
  const exercise = exercisesRepo.getById(exerciseId);
  if (!exercise) return [];
  const rxFilter: RxFilter = opts.rxFilter ?? "all";

  const prs = personalRecordsRepo.query({ exerciseId }).filter((pr) => {
    if (rxFilter === "rx") return pr.rx;
    if (rxFilter === "scaled") return !pr.rx;
    return true;
  });

  const bestByUser = new Map<string, PersonalRecord>();
  for (const pr of prs) {
    const prev = bestByUser.get(pr.userId);
    if (!prev || isBetter(pr.value, prev.value, exercise.unit)) {
      bestByUser.set(pr.userId, pr);
    }
  }

  return Array.from(bestByUser.entries())
    .map(([userId, best]) => ({ userId, best }))
    .sort((a, b) =>
      isBetter(a.best.value, b.best.value, exercise.unit) ? -1 : 1,
    );
}

export function getLastPRs(userId: string, limit: number): Array<{ pr: PersonalRecord; exercise: Exercise }> {
  const exById = new Map(exercisesRepo.list().map((e) => [e.id, e]));
  return personalRecordsRepo
    .query({ userId })
    .filter((pr) => exById.has(pr.exerciseId))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map((pr) => ({ pr, exercise: exById.get(pr.exerciseId)! }));
}
