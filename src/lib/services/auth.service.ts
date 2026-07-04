import type { Session, User } from "@/types";
import {
  findUserByEmailGlobal,
  updateUserById,
  usersRepoFor,
} from "@/lib/storage/repositories/users.repo";
import { sessionStore } from "@/lib/storage/session";
import { superAdminsStore, superSessionStore } from "@/lib/storage/superadmins";
import { passwordResetsRepo } from "@/lib/storage/repositories/passwordResets.repo";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { generateOtpCode, hashPassword, verifyPassword } from "@/lib/crypto";
import { DEFAULT_MODULES } from "@/types";
import { slugify } from "@/lib/seed";
import { exercisesRepoFor } from "@/lib/storage/repositories/exercises.repo";
import { DEFAULT_EXERCISES } from "./prs.service";

export type AuthErrorCode =
  | "email_not_found"
  | "wrong_password"
  | "suspended"
  | "email_already_used"
  | "invalid_code"
  | "code_expired"
  | "weak_password";

export class AuthError extends Error {
  constructor(public code: AuthErrorCode, message: string) {
    super(message);
  }
}

const MESSAGES: Record<AuthErrorCode, string> = {
  email_not_found: "No existe ninguna cuenta con ese email.",
  wrong_password: "Contraseña incorrecta.",
  suspended: "Esta cuenta está suspendida. Contacta con soporte.",
  email_already_used: "Ya existe una cuenta con ese email.",
  invalid_code: "El código no es válido.",
  code_expired: "El código ha caducado. Solicita uno nuevo.",
  weak_password: "La contraseña debe tener al menos 8 caracteres.",
};

function fail(code: AuthErrorCode): never {
  throw new AuthError(code, MESSAGES[code]);
}

export interface LoginResult {
  kind: "user" | "super_admin";
  session?: Session;
  superAdminId?: string;
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<LoginResult> {
  const cleanEmail = email.trim().toLowerCase();

  // 1) ¿Es super admin?
  const sa = superAdminsStore.findByEmail(cleanEmail);
  if (sa) {
    const ok = await verifyPassword(password, sa.passwordHash);
    if (!ok) fail("wrong_password");
    superSessionStore.write({ superAdminId: sa.id });
    sessionStore.clear();
    return { kind: "super_admin", superAdminId: sa.id };
  }

  // 2) Usuario de tenant
  const found = findUserByEmailGlobal(cleanEmail);
  if (!found) fail("email_not_found");
  const { user, tenantId } = found;
  if (user.status === "suspended") fail("suspended");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) fail("wrong_password");

  const tenant = tenantsRepo.getById(tenantId);
  if (tenant?.status === "suspended" && user.role !== "admin") fail("suspended");

  const session: Session = { tenantId, userId: user.id, role: user.role };
  sessionStore.write(session);
  superSessionStore.clear();
  return { kind: "user", session };
}

export function logout(): void {
  sessionStore.clear();
  superSessionStore.clear();
}

export interface RegisterOwnerInput {
  boxName: string;
  ownerName: string;
  email: string;
  password: string;
  brandColor?: string;
}

/** Registra un nuevo OWNER + tenant vacío. Devuelve la sesión iniciada. */
export async function registerOwner(input: RegisterOwnerInput): Promise<Session> {
  const email = input.email.trim().toLowerCase();
  if (input.password.length < 8) fail("weak_password");

  if (superAdminsStore.findByEmail(email)) fail("email_already_used");
  if (findUserByEmailGlobal(email)) fail("email_already_used");

  const passwordHash = await hashPassword(input.password);

  const tenant = tenantsRepo.create({
    name: input.boxName.trim(),
    slug: `${slugify(input.boxName)}-${Date.now().toString(36).slice(-4)}`,
    brandColor: input.brandColor ?? "#F97316",
    themeId: "dark-carbon",
    status: "active",
    settings: { cancellationWindowHours: 2, enabledModules: DEFAULT_MODULES },
  });

  // Sembrar ejercicios base
  const ex = exercisesRepoFor(tenant.id);
  DEFAULT_EXERCISES.forEach((d) =>
    ex.create({ tenantId: tenant.id, isCustom: false, ...d }),
  );

  const owner = usersRepoFor(tenant.id).create({
    tenantId: tenant.id,
    name: input.ownerName.trim(),
    email,
    role: "admin",
    status: "active",
    passwordHash,
  });

  const session: Session = { tenantId: tenant.id, userId: owner.id, role: "admin" };
  sessionStore.write(session);
  superSessionStore.clear();
  return session;
}

export interface RegisterFromInvitationInput {
  tenantId: string;
  role: "coach" | "member";
  name: string;
  email: string;
  password: string;
}

export async function createUserFromInvitation(
  input: RegisterFromInvitationInput,
): Promise<{ user: User; session: Session }> {
  const email = input.email.trim().toLowerCase();
  if (input.password.length < 8) fail("weak_password");
  if (superAdminsStore.findByEmail(email)) fail("email_already_used");
  if (findUserByEmailGlobal(email)) fail("email_already_used");

  const passwordHash = await hashPassword(input.password);

  const user = usersRepoFor(input.tenantId).create({
    tenantId: input.tenantId,
    name: input.name.trim(),
    email,
    role: input.role,
    status: "active",
    passwordHash,
  });
  const session: Session = {
    tenantId: input.tenantId,
    userId: user.id,
    role: user.role,
  };
  sessionStore.write(session);
  superSessionStore.clear();
  return { user, session };
}

// ---- Password reset ----

const RESET_TTL_MIN = 15;

export interface RequestResetResult {
  code: string; // devolvemos el código porque no hay email real (modo demo)
  expiresAt: string;
}

export async function requestPasswordReset(
  email: string,
): Promise<RequestResetResult> {
  const cleanEmail = email.trim().toLowerCase();
  const sa = superAdminsStore.findByEmail(cleanEmail);
  const found = findUserByEmailGlobal(cleanEmail);
  if (!sa && !found) fail("email_not_found");
  const userId = sa ? `sa:${sa.id}` : found!.user.id;

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60_000).toISOString();
  passwordResetsRepo.create({ userId, code, expiresAt, used: false });
  return { code, expiresAt };
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (newPassword.length < 8) fail("weak_password");
  const sa = superAdminsStore.findByEmail(cleanEmail);
  const found = sa ? null : findUserByEmailGlobal(cleanEmail);
  if (!sa && !found) fail("email_not_found");
  const userIdKey = sa ? `sa:${sa.id}` : found!.user.id;

  const now = Date.now();
  const codes = passwordResetsRepo
    .query({ userId: userIdKey })
    .filter((c) => !c.used)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const match = codes.find((c) => c.code === code.trim());
  if (!match) fail("invalid_code");
  if (new Date(match.expiresAt).getTime() < now) fail("code_expired");

  const passwordHash = await hashPassword(newPassword);
  if (sa) {
    superAdminsStore.update(sa.id, { passwordHash });
  } else {
    updateUserById(found!.tenantId, found!.user.id, { passwordHash });
  }
  passwordResetsRepo.update(match.id, { used: true });
}

/** Cambio de contraseña autenticado (para /mi-cuenta). */
export async function changePassword(
  tenantId: string,
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = usersRepoFor(tenantId).getById(userId);
  if (!user) fail("email_not_found");
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) fail("wrong_password");
  if (newPassword.length < 8) fail("weak_password");
  const passwordHash = await hashPassword(newPassword);
  updateUserById(tenantId, userId, { passwordHash });
}
