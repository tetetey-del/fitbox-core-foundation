import type { ClassSession, ClassTemplate } from "@/types";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { addDays, toDateKey } from "@/lib/date";
import { sessionStore } from "@/lib/storage/session";

export interface GenerateOptions {
  templateId: string;
  weekdays: number[]; // 0 = Lunes ... 6 = Domingo
  startTime: string; // HH:mm
  startDate: Date;
  endDate: Date;
  coachId?: string;
  capacity: number;
  durationMinutes: number;
}

export interface GenerateResult {
  created: ClassSession[];
  skipped: ClassSession[]; // sesiones ya existentes al mismo horario ese día
}

/**
 * Genera sesiones recurrentes evitando duplicados exactos (misma fecha + hora).
 */
export function generateRecurringSessions(opts: GenerateOptions): GenerateResult {
  const tenantId = sessionStore.read()?.tenantId;
  if (!tenantId) return { created: [], skipped: [] };

  const existing = classSessionsRepo.list();
  const created: ClassSession[] = [];
  const skipped: ClassSession[] = [];

  const cursor = new Date(
    opts.startDate.getFullYear(),
    opts.startDate.getMonth(),
    opts.startDate.getDate(),
  );
  const end = new Date(
    opts.endDate.getFullYear(),
    opts.endDate.getMonth(),
    opts.endDate.getDate(),
  );

  while (cursor <= end) {
    const isoWeekday = (cursor.getDay() + 6) % 7;
    if (opts.weekdays.includes(isoWeekday)) {
      const date = toDateKey(cursor);
      const clash = existing.find(
        (s) => s.date === date && s.startTime === opts.startTime && s.status !== "cancelled",
      );
      if (clash) {
        skipped.push(clash);
      } else {
        const s = classSessionsRepo.create({
          tenantId,
          templateId: opts.templateId,
          date,
          startTime: opts.startTime,
          durationMinutes: opts.durationMinutes,
          capacity: opts.capacity,
          coachId: opts.coachId,
          status: "scheduled",
        });
        created.push(s);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return { created, skipped };
}

export function sessionsForRange(from: Date, to: Date): ClassSession[] {
  const fromKey = toDateKey(from);
  const toKey = toDateKey(to);
  return classSessionsRepo
    .list()
    .filter((s) => s.date >= fromKey && s.date <= toKey)
    .sort((a, b) =>
      a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date),
    );
}

export function sessionsForDay(day: Date): ClassSession[] {
  const key = toDateKey(day);
  return classSessionsRepo
    .query({ date: key })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function findTemplate(templates: ClassTemplate[], id: string): ClassTemplate | undefined {
  return templates.find((t) => t.id === id);
}

// Re-export utilities
export function addWeeks(d: Date, n: number): Date {
  return addDays(d, n * 7);
}
