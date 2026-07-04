/**
 * @file Servicio de invitaciones a un box.
 * Responsabilidad: generar códigos legibles con TTL, resolver un código para
 * la landing pública de aceptación, y crear el usuario + membresía en la
 * aceptación. Marca invitaciones caducadas como tal.
 */
import type { Invitation, InvitationStatus } from "@/types";
import {
  invitationsRepoFor,
  findInvitationByCode,
} from "@/lib/storage/repositories/invitations.repo";
import { membershipPlansRepoFor } from "@/lib/storage/repositories/membershipPlans.repo";
import { membershipsRepoFor } from "@/lib/storage/repositories/memberships.repo";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { generateReadableCode } from "@/lib/crypto";
import { addDays, toDateKey, addMonths } from "@/lib/date";
import { createUserFromInvitation } from "./auth.service";

const INVITE_TTL_DAYS = 7;

export interface CreateInvitationInput {
  tenantId: string;
  invitedBy: string;
  role: "coach" | "member";
  email?: string;
  planId?: string;
}

export function createInvitation(input: CreateInvitationInput): Invitation {
  const repo = invitationsRepoFor(input.tenantId);
  return repo.create({
    tenantId: input.tenantId,
    code: generateReadableCode(8),
    role: input.role,
    email: input.email?.trim().toLowerCase() || undefined,
    planId: input.planId,
    invitedBy: input.invitedBy,
    status: "pending",
    expiresAt: new Date(
      Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60_000,
    ).toISOString(),
  });
}

export function revokeInvitation(tenantId: string, id: string): void {
  invitationsRepoFor(tenantId).update(id, { status: "revoked" });
}

export function regenerateInvitation(
  tenantId: string,
  id: string,
): Invitation | null {
  return invitationsRepoFor(tenantId).update(id, {
    code: generateReadableCode(8),
    status: "pending",
    expiresAt: new Date(
      Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60_000,
    ).toISOString(),
  });
}

export function listInvitationsForTenant(tenantId: string): Invitation[] {
  return invitationsRepoFor(tenantId)
    .list()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface ResolvedInvitation {
  invitation: Invitation;
  status: InvitationStatus | "expired";
  tenantName: string;
  tenantLogo?: string;
  brandColor?: string;
}

export function resolveInvitation(code: string): ResolvedInvitation | null {
  const inv = findInvitationByCode(code);
  if (!inv) return null;
  const tenant = tenantsRepo.getById(inv.tenantId);
  let status: InvitationStatus | "expired" = inv.status;
  if (status === "pending" && new Date(inv.expiresAt).getTime() < Date.now()) {
    status = "expired";
  }
  return {
    invitation: inv,
    status,
    tenantName: tenant?.name ?? "Box",
    tenantLogo: tenant?.logo,
    brandColor: tenant?.brandColor,
  };
}

export interface AcceptInvitationInput {
  code: string;
  name: string;
  email: string;
  password: string;
}

export async function acceptInvitation(input: AcceptInvitationInput) {
  const resolved = resolveInvitation(input.code);
  if (!resolved) throw new Error("Invitación no encontrada");
  if (resolved.status !== "pending") {
    throw new Error(
      resolved.status === "expired"
        ? "La invitación ha caducado"
        : resolved.status === "revoked"
          ? "La invitación fue revocada"
          : "La invitación ya se usó",
    );
  }
  const inv = resolved.invitation;

  const { user, session } = await createUserFromInvitation({
    tenantId: inv.tenantId,
    role: inv.role,
    name: input.name,
    email: input.email,
    password: input.password,
  });

  // Asignar plan si venía preasignado
  if (inv.planId && inv.role === "member") {
    const plan = membershipPlansRepoFor(inv.tenantId).getById(inv.planId);
    if (plan) {
      const start = new Date();
      membershipsRepoFor(inv.tenantId).create({
        tenantId: inv.tenantId,
        userId: user.id,
        planId: plan.id,
        startDate: toDateKey(start),
        endDate: toDateKey(addMonths(start, 1)),
        status: "active",
        creditsRemaining:
          plan.type === "credits" ? plan.creditsPerMonth : undefined,
      });
    }
  }

  invitationsRepoFor(inv.tenantId).update(inv.id, {
    status: "accepted",
    acceptedByUserId: user.id,
  });

  return { user, session, invitation: inv };
}

export function buildInvitationLink(code: string): string {
  if (typeof window === "undefined") return `/invitacion/${code}`;
  return `${window.location.origin}/invitacion/${code}`;
}

/** Marca automáticamente como expiradas las invitaciones vencidas de un tenant. */
export function expireOutdatedInvitations(tenantId: string): void {
  const repo = invitationsRepoFor(tenantId);
  const now = Date.now();
  repo.list().forEach((i) => {
    if (i.status === "pending" && new Date(i.expiresAt).getTime() < now) {
      repo.update(i.id, { status: "expired" });
    }
  });
}

// Re-exports para conveniencia
export { addDays };
