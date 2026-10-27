/**
 * @file Servicio de membresías y pagos.
 * Responsabilidad: asignar/renovar/cancelar planes, gestionar créditos por
 * ciclo y registrar pagos asociados. Todas las fechas se serializan como
 * date-keys YYYY-MM-DD en zona local (ver lib/date).
 */
import type { Membership, MembershipPlan, MembershipUiStatus, Payment, PaymentMethod } from "@/types";
import { membershipsRepo } from "@/lib/storage/repositories/memberships.repo";
import { membershipPlansRepo } from "@/lib/storage/repositories/membershipPlans.repo";
import { paymentsRepo } from "@/lib/storage/repositories/payments.repo";
import { sessionStore } from "@/lib/storage/session";
import { addMonths, daysBetween, parseDateKey, toDateKey } from "@/lib/date";

const EXPIRING_SOON_DAYS = 7;

function currentTenantId(): string | null {
  return sessionStore.read()?.tenantId ?? null;
}

export function getPlan(planId: string): MembershipPlan | null {
  return membershipPlansRepo.getById(planId);
}

export function getActiveMembership(userId: string): Membership | null {
  const today = toDateKey(new Date());
  const memberships = membershipsRepo.query({ userId });
  const active = memberships.find(
    (m) => m.status === "active" && m.startDate <= today && m.endDate >= today,
  );
  return active ?? null;
}

export function getMembershipStatus(userId: string): MembershipUiStatus {
  const m = getActiveMembership(userId);
  if (!m) {
    // Podría existir una expirada
    const any = membershipsRepo.query({ userId }).find((x) => x.status !== "cancelled");
    return any ? "expired" : "none";
  }
  const days = daysBetween(new Date(), parseDateKey(m.endDate));
  if (days <= EXPIRING_SOON_DAYS) return "expiring_soon";
  return "active";
}

export interface AssignResult {
  ok: boolean;
  membership?: Membership;
  reason?: string;
}

/** ¿El socio ya tuvo alguna vez este plan? (para planes de una sola vez, como la clase de prueba) */
export function hasUsedPlan(userId: string, planId: string): boolean {
  return membershipsRepo.query({ userId }).some((m) => m.planId === planId);
}

export function assignMembership(
  userId: string,
  planId: string,
  startDate: Date,
): AssignResult {
  const tenantId = currentTenantId();
  if (!tenantId) return { ok: false, reason: "Sin sesión activa" };
  const plan = membershipPlansRepo.getById(planId);
  if (!plan) return { ok: false, reason: "Plan no encontrado" };
  if (plan.oncePerMember && hasUsedPlan(userId, planId)) {
    return { ok: false, reason: `"${plan.name}" solo se puede usar una vez por persona y este socio ya lo usó` };
  }

  // Expira cualquier membresía activa previa del mismo usuario
  const previous = membershipsRepo.query({ userId, status: "active" });
  previous.forEach((m) =>
    membershipsRepo.update(m.id, { status: "expired", endDate: toDateKey(new Date()) }),
  );

  const endDate = addMonths(startDate, plan.durationMonths ?? 1);
  const membership = membershipsRepo.create({
    tenantId,
    userId,
    planId,
    startDate: toDateKey(startDate),
    endDate: toDateKey(endDate),
    status: "active",
    creditsRemaining: plan.type === "credits" ? plan.creditsPerMonth : undefined,
  });
  return { ok: true, membership };
}

export interface RenewOptions {
  registerPayment?: {
    amount: number;
    method: PaymentMethod;
    notes?: string;
  };
}

export function renewMembership(
  membershipId: string,
  opts: RenewOptions = {},
): AssignResult {
  const tenantId = currentTenantId();
  if (!tenantId) return { ok: false, reason: "Sin sesión activa" };
  const m = membershipsRepo.getById(membershipId);
  if (!m) return { ok: false, reason: "Membresía no encontrada" };
  const plan = membershipPlansRepo.getById(m.planId);
  if (!plan) return { ok: false, reason: "Plan no encontrado" };

  const base = parseDateKey(m.endDate) > new Date() ? parseDateKey(m.endDate) : new Date();
  const newEnd = addMonths(base, plan.durationMonths ?? 1);
  const updated = membershipsRepo.update(m.id, {
    status: "active",
    endDate: toDateKey(newEnd),
    creditsRemaining: plan.type === "credits" ? plan.creditsPerMonth : undefined,
  });

  if (opts.registerPayment) {
    paymentsRepo.create({
      tenantId,
      userId: m.userId,
      membershipId: m.id,
      amount: opts.registerPayment.amount,
      method: opts.registerPayment.method,
      date: toDateKey(new Date()),
      notes: opts.registerPayment.notes,
    });
  }

  return { ok: true, membership: updated ?? undefined };
}

export function cancelMembership(membershipId: string): boolean {
  const m = membershipsRepo.getById(membershipId);
  if (!m) return false;
  membershipsRepo.update(m.id, { status: "cancelled" });
  return true;
}

export interface CreditCheck {
  needsCredit: boolean;
  hasMembership: boolean;
  hasCredits: boolean;
  membership: Membership | null;
  plan: MembershipPlan | null;
}

export function inspectCredits(userId: string): CreditCheck {
  const membership = getActiveMembership(userId);
  const plan = membership ? membershipPlansRepo.getById(membership.planId) : null;
  const needsCredit = plan?.type === "credits";
  const hasCredits = needsCredit
    ? (membership?.creditsRemaining ?? 0) > 0
    : true;
  return {
    needsCredit,
    hasMembership: !!membership,
    hasCredits,
    membership,
    plan,
  };
}

export function consumeCredit(userId: string): boolean {
  const { needsCredit, membership } = inspectCredits(userId);
  if (!needsCredit || !membership) return true; // unlimited o sin plan: no-op
  const remaining = membership.creditsRemaining ?? 0;
  if (remaining <= 0) return false;
  membershipsRepo.update(membership.id, { creditsRemaining: remaining - 1 });
  return true;
}

export function refundCredit(userId: string): void {
  const { needsCredit, membership, plan } = inspectCredits(userId);
  if (!needsCredit || !membership || !plan) return;
  const cap = plan.creditsPerMonth ?? Infinity;
  const remaining = membership.creditsRemaining ?? 0;
  membershipsRepo.update(membership.id, {
    creditsRemaining: Math.min(cap, remaining + 1),
  });
}

/**
 * Ajuste manual de créditos desde administración (quitar o devolver clases).
 * Nunca deja los créditos por debajo de 0.
 */
export function adjustCredits(userId: string, delta: number): { ok: boolean; remaining?: number; reason?: string } {
  const { needsCredit, membership } = inspectCredits(userId);
  if (!membership) return { ok: false, reason: "El socio no tiene un plan activo" };
  if (!needsCredit) return { ok: false, reason: "El plan es ilimitado: no usa créditos" };
  const remaining = Math.max(0, (membership.creditsRemaining ?? 0) + delta);
  membershipsRepo.update(membership.id, { creditsRemaining: remaining });
  return { ok: true, remaining };
}

// ---- Pagos ----

export function registerPayment(input: {
  userId: string;
  membershipId?: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  notes?: string;
}): Payment | null {
  const tenantId = currentTenantId();
  if (!tenantId) return null;
  return paymentsRepo.create({ tenantId, ...input });
}

export function paymentsOf(userId: string): Payment[] {
  return paymentsRepo
    .query({ userId })
    .sort((a, b) => b.date.localeCompare(a.date));
}
