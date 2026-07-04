/**
 * @file Servicio de export/import de datos de un tenant.
 * Responsabilidad: serializar todas las colecciones de un box a JSON con
 * meta versionada, validarlo al importar y crear un tenant NUEVO remapeando
 * IDs para evitar colisiones con datos existentes.
 *
 * Schema v2 añade: retos, participantes de retos, programas y sus sesiones,
 * asignaciones/progresos, productos, pedidos, mediciones corporales.
 * v1 sigue siendo importable: los campos nuevos se rellenan con arrays vacíos.
 */
import type {
  BaseEntity,
  BodyMetric,
  Booking,
  Challenge,
  ChallengeParticipant,
  CheckIn,
  ClassSession,
  ClassTemplate,
  Exercise,
  Membership,
  MembershipPlan,
  Order,
  Payment,
  PersonalRecord,
  Product,
  Program,
  ProgramAssignment,
  ProgramProgress,
  ProgramSession,
  Tenant,
  User,
} from "@/types";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { listUsersOfTenant } from "@/lib/storage/repositories/users.repo";
import { BaseRepo } from "@/lib/storage/repositories/base.repo";
import { classTemplatesRepoFor } from "@/lib/storage/repositories/classTemplates.repo";
import { classSessionsRepoFor } from "@/lib/storage/repositories/classSessions.repo";
import { bookingsRepoFor } from "@/lib/storage/repositories/bookings.repo";
import { checkinsRepoFor } from "@/lib/storage/repositories/checkins.repo";
import { membershipPlansRepoFor } from "@/lib/storage/repositories/membershipPlans.repo";
import { membershipsRepoFor } from "@/lib/storage/repositories/memberships.repo";
import { paymentsRepoFor } from "@/lib/storage/repositories/payments.repo";
import { exercisesRepoFor } from "@/lib/storage/repositories/exercises.repo";
import { personalRecordsRepoFor } from "@/lib/storage/repositories/personalRecords.repo";
import {
  challengeParticipantsRepoFor,
  challengesRepoFor,
} from "@/lib/storage/repositories/challenges.repo";
import {
  programAssignmentsRepoFor,
  programProgressRepoFor,
  programSessionsRepoFor,
  programsRepoFor,
} from "@/lib/storage/repositories/programs.repo";
import { productsRepoFor } from "@/lib/storage/repositories/products.repo";
import { ordersRepoFor } from "@/lib/storage/repositories/orders.repo";
import { bodyMetricsRepoFor } from "@/lib/storage/repositories/bodyMetrics.repo";
import { newId, nowIso } from "@/lib/storage/db";
import { slugify } from "@/lib/seed";

export const BACKUP_SCHEMA_VERSION = 2;
export const APP_VERSION = "0.11.0";

export interface BackupPayload {
  meta: {
    schemaVersion: number;
    appVersion: string;
    exportedAt: string;
    tenantName: string;
  };
  tenant: Tenant;
  users: User[];
  classTemplates: ClassTemplate[];
  classSessions: ClassSession[];
  bookings: Booking[];
  checkins: CheckIn[];
  membershipPlans: MembershipPlan[];
  memberships: Membership[];
  payments: Payment[];
  exercises: Exercise[];
  personalRecords: PersonalRecord[];
  challenges: Challenge[];
  challengeParticipants: ChallengeParticipant[];
  programs: Program[];
  programSessions: ProgramSession[];
  programAssignments: ProgramAssignment[];
  programProgress: ProgramProgress[];
  products: Product[];
  orders: Order[];
  bodyMetrics: BodyMetric[];
}

export function exportTenantData(tenantId: string): BackupPayload {
  const tenant = tenantsRepo.getById(tenantId);
  if (!tenant) throw new Error("Box no encontrado");

  return {
    meta: {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      exportedAt: nowIso(),
      tenantName: tenant.name,
    },
    tenant,
    users: listUsersOfTenant(tenantId),
    classTemplates: classTemplatesRepoFor(tenantId).list(),
    classSessions: classSessionsRepoFor(tenantId).list(),
    bookings: bookingsRepoFor(tenantId).list(),
    checkins: checkinsRepoFor(tenantId).list(),
    membershipPlans: membershipPlansRepoFor(tenantId).list(),
    memberships: membershipsRepoFor(tenantId).list(),
    payments: paymentsRepoFor(tenantId).list(),
    exercises: exercisesRepoFor(tenantId).list(),
    personalRecords: personalRecordsRepoFor(tenantId).list(),
    challenges: challengesRepoFor(tenantId).list(),
    challengeParticipants: challengeParticipantsRepoFor(tenantId).list(),
    programs: programsRepoFor(tenantId).list(),
    programSessions: programSessionsRepoFor(tenantId).list(),
    programAssignments: programAssignmentsRepoFor(tenantId).list(),
    programProgress: programProgressRepoFor(tenantId).list(),
    products: productsRepoFor(tenantId).list(),
    orders: ordersRepoFor(tenantId).list(),
    bodyMetrics: bodyMetricsRepoFor(tenantId).list(),
  };
}

export function downloadBackup(payload: BackupPayload): void {
  const iso = payload.meta.exportedAt.slice(0, 10);
  const slug = slugify(payload.tenant.slug || payload.tenant.name);
  const filename = `fitbox-backup-${slug}-${iso}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export class BackupValidationError extends Error {}

function assertArray(v: unknown, name: string): void {
  if (!Array.isArray(v)) throw new BackupValidationError(`Campo "${name}" debe ser un array`);
}

export function validateBackup(raw: unknown): BackupPayload {
  if (!raw || typeof raw !== "object") {
    throw new BackupValidationError("El archivo no contiene un backup válido");
  }
  const p = raw as Partial<BackupPayload>;
  if (!p.meta || typeof p.meta !== "object") {
    throw new BackupValidationError("Falta la sección de metadatos");
  }
  if (p.meta.schemaVersion !== BACKUP_SCHEMA_VERSION && p.meta.schemaVersion !== 1) {
    throw new BackupValidationError(
      `Versión del backup no soportada (${p.meta.schemaVersion}, esperada 1 o ${BACKUP_SCHEMA_VERSION})`,
    );
  }
  if (!p.tenant || typeof p.tenant !== "object" || !("id" in (p.tenant as object))) {
    throw new BackupValidationError("Falta la información del box");
  }
  const requiredV1: Array<keyof BackupPayload> = [
    "users", "classTemplates", "classSessions", "bookings", "checkins",
    "membershipPlans", "memberships", "payments", "exercises", "personalRecords",
  ];
  for (const k of requiredV1) assertArray(p[k], k);

  const optionalV2: Array<keyof BackupPayload> = [
    "challenges", "challengeParticipants", "programs", "programSessions",
    "programAssignments", "programProgress", "products", "orders", "bodyMetrics",
  ];
  for (const k of optionalV2) {
    if (p[k] === undefined) (p as Record<string, unknown>)[k] = [];
    else assertArray(p[k], k);
  }
  return p as BackupPayload;
}

export interface ImportResult {
  newTenantId: string;
  ownerId: string | null;
  counts: Record<string, number>;
}

export function importTenantData(payload: BackupPayload): ImportResult {
  const importedSlug = `${slugify(payload.tenant.slug || payload.tenant.name)}-import-${Date.now().toString(36)}`;
  const newTenant = tenantsRepo.create({
    name: `${payload.tenant.name} (importado)`,
    slug: importedSlug,
    logo: payload.tenant.logo,
    brandColor: payload.tenant.brandColor,
    settings: payload.tenant.settings,
  });
  const tid = newTenant.id;

  const userMap = new Map<string, string>();
  const templateMap = new Map<string, string>();
  const sessionMap = new Map<string, string>();
  const planMap = new Map<string, string>();
  const membershipMap = new Map<string, string>();
  const bookingMap = new Map<string, string>();
  const exerciseMap = new Map<string, string>();
  const challengeMap = new Map<string, string>();
  const programMap = new Map<string, string>();
  const programSessionMap = new Map<string, string>();
  const assignmentMap = new Map<string, string>();
  const productMap = new Map<string, string>();

  const remap = <T extends { id: string }>(list: T[], target: Map<string, string>): T[] =>
    list.map((item) => {
      const newIdVal = newId();
      target.set(item.id, newIdVal);
      return { ...item, id: newIdVal };
    });

  const now = nowIso();
  const withStamps = <T extends { createdAt?: string; updatedAt?: string }>(item: T): T => ({
    ...item,
    createdAt: item.createdAt ?? now,
    updatedAt: item.updatedAt ?? now,
  });

  const users = remap(payload.users, userMap).map((u) => withStamps({ ...u, tenantId: tid }));
  const templates = remap(payload.classTemplates, templateMap).map((t) =>
    withStamps({
      ...t,
      tenantId: tid,
      defaultCoachId: t.defaultCoachId ? userMap.get(t.defaultCoachId) : undefined,
    }),
  );
  const sessions = remap(payload.classSessions, sessionMap).map((s) =>
    withStamps({
      ...s,
      tenantId: tid,
      templateId: templateMap.get(s.templateId) ?? s.templateId,
      coachId: s.coachId ? userMap.get(s.coachId) : undefined,
    }),
  );
  const plans = remap(payload.membershipPlans, planMap).map((p) =>
    withStamps({ ...p, tenantId: tid }),
  );
  const memberships = remap(payload.memberships, membershipMap).map((m) =>
    withStamps({
      ...m,
      tenantId: tid,
      userId: userMap.get(m.userId) ?? m.userId,
      planId: planMap.get(m.planId) ?? m.planId,
    }),
  );
  const bookings = remap(payload.bookings, bookingMap).map((b) =>
    withStamps({
      ...b,
      tenantId: tid,
      userId: userMap.get(b.userId) ?? b.userId,
      sessionId: sessionMap.get(b.sessionId) ?? b.sessionId,
    }),
  );
  const checkins = payload.checkins.map((c) =>
    withStamps({
      ...c,
      id: newId(),
      tenantId: tid,
      bookingId: bookingMap.get(c.bookingId) ?? c.bookingId,
      sessionId: sessionMap.get(c.sessionId) ?? c.sessionId,
      userId: userMap.get(c.userId) ?? c.userId,
    }),
  );
  const payments = payload.payments.map((p) =>
    withStamps({
      ...p,
      id: newId(),
      tenantId: tid,
      userId: userMap.get(p.userId) ?? p.userId,
      membershipId: p.membershipId ? membershipMap.get(p.membershipId) : undefined,
    }),
  );
  const exercises = remap(payload.exercises, exerciseMap).map((e) =>
    withStamps({ ...e, tenantId: tid }),
  );
  const personalRecords = payload.personalRecords.map((pr) =>
    withStamps({
      ...pr,
      id: newId(),
      tenantId: tid,
      userId: userMap.get(pr.userId) ?? pr.userId,
      exerciseId: exerciseMap.get(pr.exerciseId) ?? pr.exerciseId,
    }),
  );

  // v2
  const challenges = remap(payload.challenges, challengeMap).map((c) =>
    withStamps({
      ...c,
      tenantId: tid,
      goal: c.type === "benchmark" ? exerciseMap.get(String(c.goal)) ?? c.goal : c.goal,
    }),
  );
  const challengeParticipants = payload.challengeParticipants.map((cp) =>
    withStamps({
      ...cp,
      id: newId(),
      tenantId: tid,
      challengeId: challengeMap.get(cp.challengeId) ?? cp.challengeId,
      userId: userMap.get(cp.userId) ?? cp.userId,
    }),
  );
  const programs = remap(payload.programs, programMap).map((p) =>
    withStamps({
      ...p,
      tenantId: tid,
      createdBy: userMap.get(p.createdBy) ?? p.createdBy,
    }),
  );
  const programSessions = remap(payload.programSessions, programSessionMap).map((ps) =>
    withStamps({
      ...ps,
      tenantId: tid,
      programId: programMap.get(ps.programId) ?? ps.programId,
    }),
  );
  const programAssignments = remap(payload.programAssignments, assignmentMap).map((a) =>
    withStamps({
      ...a,
      tenantId: tid,
      programId: programMap.get(a.programId) ?? a.programId,
      userId: userMap.get(a.userId) ?? a.userId,
      assignedBy: userMap.get(a.assignedBy) ?? a.assignedBy,
    }),
  );
  const programProgress = payload.programProgress.map((pp) =>
    withStamps({
      ...pp,
      id: newId(),
      tenantId: tid,
      assignmentId: assignmentMap.get(pp.assignmentId) ?? pp.assignmentId,
      programSessionId: programSessionMap.get(pp.programSessionId) ?? pp.programSessionId,
    }),
  );
  const products = remap(payload.products, productMap).map((p) =>
    withStamps({ ...p, tenantId: tid }),
  );
  const orders = payload.orders.map((o) =>
    withStamps({
      ...o,
      id: newId(),
      tenantId: tid,
      userId: userMap.get(o.userId) ?? o.userId,
      items: o.items.map((it) => ({
        ...it,
        productId: productMap.get(it.productId) ?? it.productId,
      })),
    }),
  );
  const bodyMetrics = payload.bodyMetrics.map((m) =>
    withStamps({
      ...m,
      id: newId(),
      tenantId: tid,
      userId: userMap.get(m.userId) ?? m.userId,
    }),
  );

  const write = <T extends BaseEntity>(repo: BaseRepo<T>, list: T[]) => repo.replaceAll(list);

  const usersRepoForTenant = new BaseRepo<User>("users", {
    scoped: true,
    getTenantId: () => tid,
  });
  write(usersRepoForTenant, users);
  write(classTemplatesRepoFor(tid), templates);
  write(classSessionsRepoFor(tid), sessions);
  write(membershipPlansRepoFor(tid), plans);
  write(membershipsRepoFor(tid), memberships);
  write(bookingsRepoFor(tid), bookings);
  write(checkinsRepoFor(tid), checkins);
  write(paymentsRepoFor(tid), payments);
  write(exercisesRepoFor(tid), exercises);
  write(personalRecordsRepoFor(tid), personalRecords);
  write(challengesRepoFor(tid), challenges);
  write(challengeParticipantsRepoFor(tid), challengeParticipants);
  write(programsRepoFor(tid), programs);
  write(programSessionsRepoFor(tid), programSessions);
  write(programAssignmentsRepoFor(tid), programAssignments);
  write(programProgressRepoFor(tid), programProgress);
  write(productsRepoFor(tid), products);
  write(ordersRepoFor(tid), orders);
  write(bodyMetricsRepoFor(tid), bodyMetrics);

  const owner = users.find((u) => u.role === "admin") ?? users[0] ?? null;

  return {
    newTenantId: tid,
    ownerId: owner?.id ?? null,
    counts: {
      users: users.length,
      classTemplates: templates.length,
      classSessions: sessions.length,
      bookings: bookings.length,
      checkins: checkins.length,
      membershipPlans: plans.length,
      memberships: memberships.length,
      payments: payments.length,
      exercises: exercises.length,
      personalRecords: personalRecords.length,
      challenges: challenges.length,
      challengeParticipants: challengeParticipants.length,
      programs: programs.length,
      programSessions: programSessions.length,
      programAssignments: programAssignments.length,
      programProgress: programProgress.length,
      products: products.length,
      orders: orders.length,
      bodyMetrics: bodyMetrics.length,
    },
  };
}

export async function readBackupFile(file: File): Promise<BackupPayload> {
  const text = await file.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new BackupValidationError("El archivo no es un JSON válido");
  }
  return validateBackup(json);
}
