/**
 * @file Ciclo de programación: WODs que se repiten cada N semanas.
 *
 * El staff arma una vez las N semanas. La app pone el WOD de cada día en el calendario
 * (como WOD publicado) para las próximas semanas, y al pasar la última semana vuelve a la 1.
 * - Los días generados llevan `cycleId`. Si el coach edita un día a mano, deja de ser
 *   del ciclo y ese cambio no se toca más.
 * - Los WODs generados tienen id fijo por ciclo y fecha, así dos dispositivos no los duplican.
 * - No se anuncian en el feed ni se notifica (serían muchos a la vez).
 */
import type { Wod, WodCycle, WodCycleDay } from "@/types";
import { wodCyclesRepo } from "@/lib/storage/repositories/wodCycles.repo";
import { wodsRepo } from "@/lib/storage/repositories/wods.repo";
import { sessionStore } from "@/lib/storage/session";
import { addDays, daysBetween, parseDateKey, startOfWeek, toDateKey } from "@/lib/date";

/** Cuántos días hacia adelante se dejan puestos los WODs del ciclo. */
export const CYCLE_DAYS_AHEAD = 28;
export const MAX_CYCLE_WEEKS = 52;

export const WEEKDAY_LABEL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function dayKey(week: number, day: number): string {
  return `${week}-${day}`;
}

/** Lunes de la semana de una fecha (YYYY-MM-DD). */
export function mondayOf(date: string): string {
  return toDateKey(startOfWeek(parseDateKey(date)));
}

/** Semana (1..N) y día (1 lunes … 7 domingo) del ciclo para una fecha; null si es antes del inicio. */
export function cyclePosition(cycle: Pick<WodCycle, "startDate" | "weeks">, date: string): { week: number; day: number } | null {
  const diff = daysBetween(parseDateKey(mondayOf(cycle.startDate)), parseDateKey(date));
  if (diff < 0) return null;
  const weeks = Math.max(1, cycle.weeks);
  return { week: (Math.floor(diff / 7) % weeks) + 1, day: (diff % 7) + 1 };
}

export function hasContent(d: WodCycleDay | undefined): d is WodCycleDay {
  return !!d && (!!d.title.trim() || d.blocks.some((b) => b.content.trim()));
}

export function activeCycle(): WodCycle | null {
  return wodCyclesRepo.list().find((c) => c.active) ?? null;
}

export function listCycles(): WodCycle[] {
  return wodCyclesRepo.list().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function generatedId(cycleId: string, date: string): string {
  return `cyc-${cycleId}-${date}`;
}

function sameContent(w: Wod, d: WodCycleDay): boolean {
  return w.title === d.title && JSON.stringify(w.blocks) === JSON.stringify(d.blocks);
}

/** Quita los WODs futuros que puso un ciclo (los editados a mano se dejan). */
function removeFutureOf(cycleId: string): void {
  const today = toDateKey(new Date());
  wodsRepo
    .list()
    .filter((w) => w.cycleId === cycleId && w.date >= today)
    .forEach((w) => wodsRepo.remove(w.id));
}

/**
 * Pone en el calendario los WODs del ciclo activo para hoy y los próximos días.
 * Respeta los días editados a mano y actualiza los que siguen siendo del ciclo.
 */
export function syncCycleWods(): number {
  const s = sessionStore.read();
  if (!s) return 0;
  // Ciclos apagados: se quitan sus días futuros.
  wodCyclesRepo.list().filter((c) => !c.active).forEach((c) => removeFutureOf(c.id));
  const cycle = activeCycle();
  if (!cycle) return 0;

  const today = toDateKey(new Date());
  const all = wodsRepo.list();
  const byDate = new Map<string, Wod[]>();
  all.forEach((w) => byDate.set(w.date, [...(byDate.get(w.date) ?? []), w]));

  const toAdd: Wod[] = [];
  let changes = 0;
  const now = new Date().toISOString();
  for (let i = 0; i <= CYCLE_DAYS_AHEAD; i++) {
    const date = toDateKey(addDays(parseDateKey(today), i));
    const pos = cyclePosition(cycle, date);
    if (!pos) continue;
    const entry = cycle.days[dayKey(pos.week, pos.day)];
    const existing = byDate.get(date) ?? [];
    // Un día escrito a mano (sin ciclo) manda: si había uno del ciclo, se quita.
    if (existing.some((w) => !w.cycleId)) {
      existing.filter((w) => w.cycleId).forEach((w) => {
        wodsRepo.remove(w.id);
        changes++;
      });
      continue;
    }
    const mine = existing.find((w) => w.cycleId === cycle.id);
    // WODs de otro ciclo (anterior) en días futuros: se reemplazan.
    existing.filter((w) => w.cycleId && w.cycleId !== cycle.id).forEach((w) => {
      wodsRepo.remove(w.id);
      changes++;
    });
    if (!hasContent(entry)) {
      if (mine) {
        wodsRepo.remove(mine.id);
        changes++;
      }
      continue;
    }
    if (mine) {
      if (!sameContent(mine, entry)) {
        wodsRepo.update(mine.id, { title: entry.title, blocks: entry.blocks, published: true });
        changes++;
      }
      continue;
    }
    toAdd.push({
      id: generatedId(cycle.id, date),
      tenantId: s.tenantId,
      date,
      title: entry.title.trim() || `Semana ${pos.week} · ${WEEKDAY_LABEL[pos.day - 1]}`,
      blocks: entry.blocks,
      published: true,
      publishedBy: s.userId,
      cycleId: cycle.id,
      createdAt: now,
      updatedAt: now,
    });
  }
  if (toAdd.length) {
    wodsRepo.replaceAll([...wodsRepo.list().filter((w) => !toAdd.some((n) => n.id === w.id)), ...toAdd]);
    changes += toAdd.length;
  }
  return changes;
}

export interface CycleInput {
  name: string;
  weeks: number;
  startDate: string;
  active: boolean;
  days: Record<string, WodCycleDay>;
}

/** Guarda el ciclo (solo puede haber uno activo) y actualiza el calendario. */
export function saveCycle(id: string | null, input: CycleInput): WodCycle {
  const s = sessionStore.read();
  if (!s) throw new Error("Sin sesión");
  const weeks = Math.min(MAX_CYCLE_WEEKS, Math.max(1, Math.round(input.weeks)));
  // Se descartan los días de semanas que ya no existen.
  const days = Object.fromEntries(
    Object.entries(input.days).filter(([k, d]) => Number(k.split("-")[0]) <= weeks && hasContent(d)),
  );
  const payload = { name: input.name.trim() || "Ciclo", weeks, startDate: mondayOf(input.startDate), active: input.active, days };
  if (input.active) {
    wodCyclesRepo.list().filter((c) => c.active && c.id !== id).forEach((c) => wodCyclesRepo.update(c.id, { active: false }));
  }
  const saved = id ? (wodCyclesRepo.update(id, payload) as WodCycle) : wodCyclesRepo.create({ tenantId: s.tenantId, ...payload });
  syncCycleWods();
  return saved;
}

export function deleteCycle(id: string): void {
  removeFutureOf(id);
  wodCyclesRepo.remove(id);
}
