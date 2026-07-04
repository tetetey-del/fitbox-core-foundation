/**
 * @file Servicio del panel de super admin.
 * Responsabilidad: métricas globales de todos los boxes, resúmenes por
 * tenant y purga completa de un tenant (borra todas sus colecciones).
 */
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { listUsersOfTenant } from "@/lib/storage/repositories/users.repo";
import { membershipsRepoFor } from "@/lib/storage/repositories/memberships.repo";
import { paymentsRepoFor } from "@/lib/storage/repositories/payments.repo";
import { classSessionsRepoFor } from "@/lib/storage/repositories/classSessions.repo";
import { bookingsRepoFor } from "@/lib/storage/repositories/bookings.repo";
import { checkinsRepoFor } from "@/lib/storage/repositories/checkins.repo";
import { postsRepoFor } from "@/lib/storage/repositories/posts.repo";
import { classTemplatesRepoFor } from "@/lib/storage/repositories/classTemplates.repo";
import { membershipPlansRepoFor } from "@/lib/storage/repositories/membershipPlans.repo";
import { exercisesRepoFor } from "@/lib/storage/repositories/exercises.repo";
import { personalRecordsRepoFor } from "@/lib/storage/repositories/personalRecords.repo";
import { tenantModules } from "@/hooks/useModules";
import type { Tenant } from "@/types";
import { buildKey, remove as removeKey } from "@/lib/storage/db";

export interface TenantSummary {
  tenant: Tenant;
  users: number;
  activeMembers: number;
  createdAt: string;
  monthRevenue: number;
}

function monthStart(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function getTenantSummary(tenant: Tenant): TenantSummary {
  const users = listUsersOfTenant(tenant.id);
  const memberships = membershipsRepoFor(tenant.id).query({ status: "active" });
  const payments = paymentsRepoFor(tenant.id).list();
  const start = monthStart();
  const monthRevenue = payments
    .filter((p) => new Date(p.date) >= start)
    .reduce((s, p) => s + p.amount, 0);

  return {
    tenant,
    users: users.length,
    activeMembers: memberships.length,
    createdAt: tenant.createdAt,
    monthRevenue,
  };
}

export function getAllTenantSummaries(): TenantSummary[] {
  return tenantsRepo
    .list()
    .map(getTenantSummary)
    .sort((a, b) => a.tenant.name.localeCompare(b.tenant.name));
}

export interface GlobalMetrics {
  totalBoxes: number;
  totalUsers: number;
  monthRevenue: number;
}

export function getGlobalMetrics(): GlobalMetrics {
  const summaries = getAllTenantSummaries();
  return {
    totalBoxes: summaries.length,
    totalUsers: summaries.reduce((s, x) => s + x.users, 0),
    monthRevenue: summaries.reduce((s, x) => s + x.monthRevenue, 0),
  };
}

export function tenantModulesOf(t: Tenant) {
  return tenantModules(t.settings);
}

/** Borra por completo un tenant y todas sus colecciones. */
export function purgeTenant(tenantId: string): void {
  const collections = [
    "users",
    "class_templates",
    "class_sessions",
    "bookings",
    "checkins",
    "membership_plans",
    "memberships",
    "payments",
    "exercises",
    "personal_records",
    "posts",
  ];
  collections.forEach((c) => removeKey(buildKey(tenantId, c)));
  // Uso repos-scoped para asegurar limpieza total (por si cambia el naming).
  classTemplatesRepoFor(tenantId).replaceAll([]);
  classSessionsRepoFor(tenantId).replaceAll([]);
  bookingsRepoFor(tenantId).replaceAll([]);
  checkinsRepoFor(tenantId).replaceAll([]);
  membershipPlansRepoFor(tenantId).replaceAll([]);
  membershipsRepoFor(tenantId).replaceAll([]);
  paymentsRepoFor(tenantId).replaceAll([]);
  exercisesRepoFor(tenantId).replaceAll([]);
  personalRecordsRepoFor(tenantId).replaceAll([]);
  postsRepoFor(tenantId).replaceAll([]);
  tenantsRepo.remove(tenantId);
}
