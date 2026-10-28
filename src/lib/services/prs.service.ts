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
  aliases?: string[];
}

export const DEFAULT_EXERCISES: DefaultExercise[] = [
  // Fuerza
  { name: "Back Squat", category: "fuerza", unit: "kg", aliases: ["Sentadilla trasera"] },
  { name: "Front Squat", category: "fuerza", unit: "kg", aliases: ["Sentadilla frontal"] },
  { name: "Deadlift", category: "fuerza", unit: "kg", aliases: ["Peso muerto", "DL"] },
  { name: "Bench Press", category: "fuerza", unit: "kg", aliases: ["Press de banca", "Press banca"] },
  { name: "Strict Press", category: "fuerza", unit: "kg", aliases: ["Press estricto", "Press militar", "Shoulder Press"] },
  // Olímpicos
  { name: "Clean & Jerk", category: "olimpico", unit: "kg", aliases: ["Clean and Jerk", "C&J", "Dos tiempos"] },
  { name: "Snatch", category: "olimpico", unit: "kg", aliases: ["Arranque"] },
  // Benchmark WODs
  { name: "Fran", category: "benchmark_wod", unit: "tiempo" },
  { name: "Grace", category: "benchmark_wod", unit: "tiempo" },
  { name: "Helen", category: "benchmark_wod", unit: "tiempo" },
  { name: "Murph", category: "benchmark_wod", unit: "tiempo" },
  { name: "Cindy", category: "benchmark_wod", unit: "reps" },
  // Gimnásticos
  { name: "Pull-ups max", category: "gimnastico", unit: "reps", aliases: ["Pull-ups", "Pull-up", "Dominadas"] },
  { name: "HSPU max", category: "gimnastico", unit: "reps", aliases: ["HSPU", "Handstand Push-ups", "Flexiones de pino"] },
  // Cardio
  { name: "Run 5K", category: "cardio", unit: "tiempo", aliases: ["5K"] },
];

export function seedDefaultExercisesFor(tenantId: string): Exercise[] {
  const repo = exercisesRepoFor(tenantId);
  return DEFAULT_EXERCISES.map((d) =>
    repo.create({ tenantId, isCustom: false, ...d }),
  );
}

// ---- Editar el catálogo (staff) ----

export interface ExerciseInput {
  name: string;
  category: ExerciseCategory;
  unit: ExerciseUnit;
  aliases?: string[];
}

function cleanAliases(list: string[] | undefined, name: string): string[] {
  const seen = new Set([normalizeText(name)]);
  const out: string[] = [];
  for (const a of list ?? []) {
    const t = a.trim();
    const k = normalizeText(t);
    if (t && !seen.has(k)) {
      seen.add(k);
      out.push(t);
    }
  }
  return out;
}

/** Busca otro ejercicio con el mismo nombre (sin importar mayúsculas ni acentos). */
export function exerciseNameTaken(name: string, exceptId?: string): boolean {
  const k = normalizeText(name);
  return exercisesRepo.list().some((e) => e.id !== exceptId && normalizeText(e.name) === k);
}

export function createExercise(tenantId: string, input: ExerciseInput): Exercise {
  const name = input.name.trim();
  return exercisesRepo.create({
    tenantId,
    name,
    category: input.category,
    unit: input.unit,
    aliases: cleanAliases(input.aliases, name),
    isCustom: true,
  });
}

export function updateExercise(id: string, input: ExerciseInput): Exercise | null {
  const name = input.name.trim();
  return exercisesRepo.update(id, {
    name,
    category: input.category,
    unit: input.unit,
    aliases: cleanAliases(input.aliases, name),
  });
}

/** Cuántas marcas tiene registradas un ejercicio (para avisar antes de borrarlo). */
export function exercisePRCount(exerciseId: string): number {
  return personalRecordsRepo.query({ exerciseId }).length;
}

/** Borra el ejercicio y sus marcas. */
export function deleteExercise(id: string): void {
  personalRecordsRepo.query({ exerciseId: id }).forEach((pr) => personalRecordsRepo.remove(pr.id));
  exercisesRepo.remove(id);
}

// ---- Encontrar ejercicios en un texto (WOD) ----

/** Minúsculas, sin acentos y sin signos, para comparar nombres. */
export function normalizeText(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Otros nombres de los ejercicios base, para boxes creados antes de que existieran. */
const BUILTIN_ALIASES = new Map(DEFAULT_EXERCISES.map((d) => [normalizeText(d.name), d.aliases ?? []]));

/** Todos los nombres con los que se puede escribir un ejercicio. */
export function exerciseKeywords(ex: Exercise): string[] {
  const names = [ex.name, ...(ex.aliases ?? []), ...(BUILTIN_ALIASES.get(normalizeText(ex.name)) ?? [])];
  // "Pull-ups max" también se reconoce como "Pull-ups".
  names.push(ex.name.replace(/\s+max$/i, ""));
  return [...new Set(names.map(normalizeText).filter((k) => k.length >= 2))];
}

/** Ejercicios que aparecen en un texto (por nombre u otro nombre; admite plural con "s"). */
export function findExercisesInText(text: string, exercises: Exercise[]): Exercise[] {
  const t = ` ${normalizeText(text)} `;
  if (!t.trim()) return [];
  return exercises.filter((ex) =>
    exerciseKeywords(ex).some((k) => t.includes(` ${k} `) || t.includes(` ${k}s `) || t.includes(` ${k}es `)),
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
