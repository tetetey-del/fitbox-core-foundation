import { checkinsRepo } from "@/lib/storage/repositories/checkins.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { formatDate, toDateKey } from "@/lib/date";

export interface AttendanceEntry {
  id: string;
  date: string;
  time: string;
  className: string;
}

/** Devuelve el historial de asistencias de un socio ordenado por fecha desc. */
export function attendanceOf(userId: string): AttendanceEntry[] {
  const cis = checkinsRepo.query({ userId });
  const templates = classTemplatesRepo.list();
  const tplById = new Map(templates.map((t) => [t.id, t]));
  return cis
    .map((ci) => {
      const s = classSessionsRepo.getById(ci.sessionId);
      if (!s) return null;
      const tpl = tplById.get(s.templateId);
      return {
        id: ci.id,
        date: s.date,
        time: s.startTime,
        className: tpl?.name ?? "Clase",
      };
    })
    .filter((x): x is AttendanceEntry => !!x)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}

/** Nº total de clases hechas por el socio (cada check-in que le dio el coach). */
export function totalAttendance(userId: string): number {
  // Se cuentan todos los check-ins, aunque la clase sea vieja y ya no esté en el dispositivo.
  return checkinsRepo.query({ userId }).length;
}

/** "1 clase" / "N clases". */
export function classesLabel(n: number): string {
  return `${n} ${n === 1 ? "clase" : "clases"}`;
}

/** Nº de asistencias del socio dentro del mes calendario en curso. */
export function monthlyAttendance(userId: string): number {
  const now = new Date();
  const firstKey = toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
  return attendanceOf(userId).filter((a) => a.date >= firstKey).length;
}

/** Nombre de la clase más asistida por el socio, o null si nunca ha ido. */
export function favoriteClass(userId: string): string | null {
  const attendance = attendanceOf(userId);
  if (attendance.length === 0) return null;
  const counts = new Map<string, number>();
  attendance.forEach((a) => counts.set(a.className, (counts.get(a.className) ?? 0) + 1));
  let best: string | null = null;
  let bestCount = 0;
  counts.forEach((c, k) => {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  });
  return best;
}

/** Última asistencia formateada como "dd/mm/yyyy · HH:MM" o null. */
export function lastAttendanceOf(userId: string): string | null {
  const list = attendanceOf(userId);
  if (list.length === 0) return null;
  const first = list[0];
  return `${formatDate(first.date)} · ${first.time}`;
}
