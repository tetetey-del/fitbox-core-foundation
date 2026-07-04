/**
 * @file Servicio de mediciones corporales (peso, % graso, FC reposo, medidas).
 * Provee CRUD y series temporales por métrica para las gráficas.
 */
import type { BodyMetric } from "@/types";
import { bodyMetricsRepo } from "@/lib/storage/repositories/bodyMetrics.repo";

export function addMetric(input: Omit<BodyMetric, keyof import("@/types").BaseEntity>): BodyMetric {
  return bodyMetricsRepo.create(input);
}
export function updateMetric(id: string, patch: Partial<BodyMetric>) {
  return bodyMetricsRepo.update(id, patch);
}
export function deleteMetric(id: string): void {
  bodyMetricsRepo.remove(id);
}

export function listUserMetrics(userId: string): BodyMetric[] {
  return bodyMetricsRepo
    .query({ userId })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type MetricKey = "weightKg" | "bodyFatPct" | "restingHr";

export interface SeriesPoint {
  date: string;
  value: number;
}

export function series(userId: string, key: MetricKey): SeriesPoint[] {
  return listUserMetrics(userId)
    .map((m) => ({ date: m.date, value: m[key] as number | undefined }))
    .filter((p): p is SeriesPoint => typeof p.value === "number");
}

export function latestMetric(userId: string): BodyMetric | null {
  const list = listUserMetrics(userId);
  return list[list.length - 1] ?? null;
}
