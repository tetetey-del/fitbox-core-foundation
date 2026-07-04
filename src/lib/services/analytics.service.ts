/**
 * @file Servicio de analítica de gestión.
 * Responsabilidad: KPIs mensuales, series de ingresos, ocupación media por
 * día de la semana, próximas expiraciones de plan y estadísticas por socio.
 * Solo lecturas agregadas: nunca escribe en repos.
 */
import { paymentsRepo } from "@/lib/storage/repositories/payments.repo";
import { membershipsRepo } from "@/lib/storage/repositories/memberships.repo";
import { checkinsRepo } from "@/lib/storage/repositories/checkins.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { bookingsRepo } from "@/lib/storage/repositories/bookings.repo";
import { usersRepo } from "@/lib/storage/repositories/users.repo";
import { addDays, daysBetween, parseDateKey, startOfWeek, toDateKey, DAY_LABELS } from "@/lib/date";
import type { User } from "@/types";

// ---- KPIs mensuales ----

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface MonthlyKpis {
  revenue: number;
  activeMembers: number;
  newMembersThisMonth: number;
  attendancesThisMonth: number;
}

export function getMonthlyKpis(reference: Date = new Date()): MonthlyKpis {
  const m = monthKey(reference);
  const startOfMonth = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const endOfMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  const startKey = toDateKey(startOfMonth);
  const endKey = toDateKey(endOfMonth);

  const revenue = paymentsRepo
    .list()
    .filter((p) => p.date >= startKey && p.date <= endKey)
    .reduce((sum, p) => sum + p.amount, 0);

  const today = toDateKey(new Date());
  const activeMembers = membershipsRepo
    .list()
    .filter((mem) => mem.status === "active" && mem.startDate <= today && mem.endDate >= today).length;

  const newMembersThisMonth = usersRepo
    .list()
    .filter((u) => u.role === "member" && u.createdAt.slice(0, 7) === m).length;

  const attendancesThisMonth = checkinsRepo
    .list()
    .filter((c) => c.checkedInAt.slice(0, 7) === m).length;

  return { revenue, activeMembers, newMembersThisMonth, attendancesThisMonth };
}

// ---- Ingresos por mes (últimos N meses) ----

export interface MonthlyRevenuePoint {
  month: string; // "YYYY-MM"
  revenue: number;
}

export function getMonthlyRevenue(months: number = 6): MonthlyRevenuePoint[] {
  const now = new Date();
  const buckets: MonthlyRevenuePoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ month: monthKey(d), revenue: 0 });
  }
  const byMonth = new Map(buckets.map((b) => [b.month, b]));
  for (const p of paymentsRepo.list()) {
    const key = p.date.slice(0, 7);
    const bucket = byMonth.get(key);
    if (bucket) bucket.revenue += p.amount;
  }
  return buckets;
}

// ---- Ocupación media por día de la semana ----

export interface OccupancyByWeekday {
  weekday: string; // Lun..Dom
  occupancy: number; // 0-100
}

export function getOccupancyByWeekday(weeks: number = 4): OccupancyByWeekday[] {
  const today = new Date();
  const currentMonday = startOfWeek(today);
  const from = addDays(currentMonday, -7 * (weeks - 1));
  const fromKey = toDateKey(from);
  const toKey = toDateKey(addDays(currentMonday, 6));

  const sessions = classSessionsRepo
    .list()
    .filter(
      (s) =>
        s.status !== "cancelled" &&
        s.date >= fromKey &&
        s.date <= toKey,
    );

  const bookingsBySession = new Map<string, number>();
  for (const b of bookingsRepo.list()) {
    if (b.status !== "confirmed") continue;
    bookingsBySession.set(b.sessionId, (bookingsBySession.get(b.sessionId) ?? 0) + 1);
  }

  const totals = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }));
  for (const s of sessions) {
    const d = parseDateKey(s.date);
    const idx = (d.getDay() + 6) % 7;
    const confirmed = bookingsBySession.get(s.id) ?? 0;
    const pct = s.capacity > 0 ? (confirmed / s.capacity) * 100 : 0;
    totals[idx].sum += pct;
    totals[idx].count += 1;
  }

  return totals.map((t, i) => ({
    weekday: DAY_LABELS[i],
    occupancy: t.count > 0 ? Math.round(t.sum / t.count) : 0,
  }));
}

// ---- Membresías que expiran pronto ----

export interface ExpiringMembership {
  userId: string;
  userName: string;
  endDate: string;
  daysLeft: number;
  planId: string;
}

export function getExpiringMemberships(daysAhead: number = 7): ExpiringMembership[] {
  const today = new Date();
  const userMap = new Map<string, User>(usersRepo.list().map((u) => [u.id, u]));
  return membershipsRepo
    .list()
    .filter((m) => m.status === "active")
    .map((m) => ({ m, days: daysBetween(today, parseDateKey(m.endDate)) }))
    .filter(({ days }) => days >= 0 && days <= daysAhead)
    .sort((a, b) => a.days - b.days)
    .map(({ m, days }) => ({
      userId: m.userId,
      userName: userMap.get(m.userId)?.name ?? "—",
      endDate: m.endDate,
      daysLeft: days,
      planId: m.planId,
    }));
}

// ---- Estadísticas por socio ----

export interface MemberStats {
  attendancesThisMonth: number;
  favoriteTemplateId: string | null;
  favoriteCount: number;
}

export function getMemberStats(userId: string): MemberStats {
  const m = monthKey(new Date());
  const checkins = checkinsRepo.query({ userId });
  const thisMonth = checkins.filter((c) => c.checkedInAt.slice(0, 7) === m);

  const templateCounts = new Map<string, number>();
  for (const c of checkins) {
    const s = classSessionsRepo.getById(c.sessionId);
    if (!s) continue;
    templateCounts.set(s.templateId, (templateCounts.get(s.templateId) ?? 0) + 1);
  }
  let favoriteTemplateId: string | null = null;
  let favoriteCount = 0;
  for (const [tid, count] of templateCounts) {
    if (count > favoriteCount) {
      favoriteTemplateId = tid;
      favoriteCount = count;
    }
  }

  return {
    attendancesThisMonth: thisMonth.length,
    favoriteTemplateId,
    favoriteCount,
  };
}
