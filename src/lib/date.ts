/**
 * Utilidades de fecha/hora en horario local del navegador.
 * Todo el módulo de clases opera con:
 *   - date  → "YYYY-MM-DD"
 *   - time  → "HH:mm"
 */

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function sessionStart(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

/** Devuelve el lunes 00:00 de la semana del día dado. */
export function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 dom, 1 lun...
  const diff = (day + 6) % 7; // días desde lunes
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
  return monday;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function weekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export function daysBetween(a: Date, b: Date): number {
  const ms = 1000 * 60 * 60 * 24;
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((b0 - a0) / ms);
}

export function formatDate(iso: string): string {
  const d = parseDateKey(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

export const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const DAY_LABELS_LONG = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export function hoursBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60);
}

export function formatDayHeader(d: Date): string {
  return `${DAY_LABELS[(d.getDay() + 6) % 7]} ${String(d.getDate()).padStart(2, "0")}`;
}

export function formatRange(monday: Date): string {
  const end = addDays(monday, 6);
  const sameMonth = monday.getMonth() === end.getMonth();
  const m = (d: Date) =>
    d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
  if (sameMonth) {
    return `${monday.getDate()} – ${end.getDate()} ${m(end)} ${end.getFullYear()}`;
  }
  return `${monday.getDate()} ${m(monday)} – ${end.getDate()} ${m(end)} ${end.getFullYear()}`;
}
