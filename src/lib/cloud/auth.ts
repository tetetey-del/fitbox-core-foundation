/**
 * @file Login, registro e invitaciones con Supabase Auth (boxes reales).
 */
import type { Session, UserRole } from "@/types";
import { DEFAULT_MODULES } from "@/types";
import { AuthError, MESSAGES, type AuthErrorCode } from "@/lib/services/auth.errors";
import { DEFAULT_CANCELLATION_HOURS, LEGAL_VERSION } from "@/lib/constants";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { exercisesRepoFor } from "@/lib/storage/repositories/exercises.repo";
import { DEFAULT_EXERCISES } from "@/lib/services/prs.service";
import { sb } from "./client";
import { clearLocalTenant, flush, getCloudContext, pullTenant, setCloudContext, startCloudRefresh, stopCloudRefresh } from "./sync";

function fail(code: AuthErrorCode, message?: string): never {
  throw new AuthError(code, message ?? MESSAGES[code]);
}

function origin(): string {
  return typeof window === "undefined" ? "" : window.location.origin;
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface MyTenant {
  tenant_id: string;
  role: UserRole;
  app_user_id: string;
  status: string;
  tenant_name: string;
}

/** Después de tener sesión en Supabase: elige el box, baja los datos y arma la sesión de la app. */
async function enterTenant(): Promise<Session> {
  const client = sb();
  const { data, error } = await client.rpc("kf_my_tenants");
  if (error) fail("network");
  const mine = (data ?? []) as MyTenant[];
  const t = mine.find((x) => x.status !== "suspended") ?? mine[0];
  if (!t) {
    await client.auth.signOut();
    fail("no_tenant");
  }
  if (t.status === "suspended") {
    await client.auth.signOut();
    fail("suspended");
  }
  setCloudContext({ tenantId: t.tenant_id, role: t.role, appUserId: t.app_user_id });
  try {
    await pullTenant();
  } catch {
    setCloudContext(null);
    fail("network");
  }
  if (t.role === "admin") ensureTenantDefaults(t.tenant_id);
  startCloudRefresh();
  return { tenantId: t.tenant_id, userId: t.app_user_id, role: t.role, cloud: true };
}

/** Completa lo que la base no sabe crear sola (ajustes por defecto y ejercicios base). */
function ensureTenantDefaults(tenantId: string): void {
  const tenant = tenantsRepo.getById(tenantId);
  if (tenant && !tenant.settings) {
    tenantsRepo.update(tenantId, {
      slug: tenant.slug && tenant.slug !== tenantId ? tenant.slug : `${slugify(tenant.name)}-${tenantId.slice(0, 4)}`,
      settings: { cancellationWindowHours: DEFAULT_CANCELLATION_HOURS, enabledModules: DEFAULT_MODULES, currency: "EUR" },
    });
  }
  const ex = exercisesRepoFor(tenantId);
  if (ex.list().length === 0) {
    DEFAULT_EXERCISES.forEach((d) => ex.create({ tenantId, isCustom: false, ...d }));
  }
}

function mapAuthError(message: string | undefined): never {
  const m = (message ?? "").toLowerCase();
  if (m.includes("email not confirmed")) fail("email_not_confirmed");
  if (m.includes("invalid login credentials")) fail("wrong_credentials");
  if (m.includes("already registered") || m.includes("already been registered")) fail("email_already_used");
  if (m.includes("password") && m.includes("at least")) fail("weak_password");
  if (m.includes("fetch") || m.includes("network")) fail("network");
  fail("network", message || MESSAGES.network);
}

export async function cloudLogin(email: string, password: string): Promise<Session> {
  const { error } = await sb().auth.signInWithPassword({ email, password });
  if (error) mapAuthError(error.message);
  return enterTenant();
}

/** Al abrir la app con una sesión de la nube guardada: reconecta y refresca los datos. */
export async function cloudResume(session: Session): Promise<Session | null> {
  const { data } = await sb().auth.getSession();
  if (!data.session) return null;
  setCloudContext({ tenantId: session.tenantId, role: session.role, appUserId: session.userId });
  startCloudRefresh();
  try {
    await pullTenant();
  } catch {
    // sin conexión: se sigue con la copia local
  }
  return session;
}

/** Activa la sincronización enseguida (antes de bajar datos), para no perder escrituras. */
export function cloudAttach(session: Session): void {
  setCloudContext({ tenantId: session.tenantId, role: session.role, appUserId: session.userId });
}

export async function cloudLogout(): Promise<void> {
  const c = getCloudContext();
  try {
    await flush();
  } catch {
    /* nada */
  }
  stopCloudRefresh();
  setCloudContext(null);
  if (c) clearLocalTenant(c.tenantId);
  await sb().auth.signOut();
}

export interface CloudRegisterOwnerInput {
  boxName: string;
  ownerName: string;
  email: string;
  password: string;
}

/**
 * Crea la cuenta del dueño. La base crea el box sola (trigger kf_handle_new_user).
 * Si Supabase pide confirmar el email, lanza `confirm_email`.
 */
export async function cloudRegisterOwner(input: CloudRegisterOwnerInput): Promise<Session> {
  const { data, error } = await sb().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${origin()}/login?confirmado=1`,
      data: {
        box_name: input.boxName.trim(),
        name: input.ownerName.trim(),
        terms_version: LEGAL_VERSION,
        accepted_terms_at: new Date().toISOString(),
      },
    },
  });
  if (error) mapAuthError(error.message);
  // Supabase no avisa si el email ya existía (por privacidad): devuelve un usuario sin identidades.
  if (data.user && data.user.identities && data.user.identities.length === 0) fail("email_already_used");
  if (!data.session) fail("confirm_email");
  return enterTenant();
}

export interface CloudInvitation {
  tenantId: string;
  tenantName: string;
  tenantLogo?: string;
  brandColor?: string;
  role: "coach" | "member";
  email?: string;
  expiresAt: string;
  status: "pending" | "accepted" | "revoked" | "expired";
}

export async function cloudGetInvitation(code: string): Promise<CloudInvitation | null> {
  const { data, error } = await sb().rpc("kf_get_invitation", { p_code: code });
  if (error || !data) return null;
  return data as CloudInvitation;
}

export async function cloudAcceptInvitation(input: {
  code: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<Session> {
  const { data, error } = await sb().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${origin()}/login?confirmado=1`,
      data: {
        invitation_code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        phone: input.phone?.trim() || undefined,
        terms_version: LEGAL_VERSION,
        accepted_terms_at: new Date().toISOString(),
      },
    },
  });
  if (error) {
    if ((error.message ?? "").toLowerCase().includes("database error")) {
      fail("invalid_code", "No se pudo usar la invitación: puede que ya se haya usado, que haya caducado o que el email no coincida con el invitado.");
    }
    mapAuthError(error.message);
  }
  if (data.user && data.user.identities && data.user.identities.length === 0) fail("email_already_used");
  if (!data.session) fail("confirm_email");
  return enterTenant();
}

export async function cloudRequestPasswordReset(email: string): Promise<void> {
  const { error } = await sb().auth.resetPasswordForEmail(email, { redirectTo: `${origin()}/restablecer` });
  if (error) mapAuthError(error.message);
}

/** Nueva contraseña desde el enlace del email (la sesión de recuperación ya está activa). */
export async function cloudSetNewPassword(newPassword: string): Promise<void> {
  if (newPassword.length < 8) fail("weak_password");
  const { error } = await sb().auth.updateUser({ password: newPassword });
  if (error) mapAuthError(error.message);
}

/** Cambio de contraseña desde Mi cuenta: se verifica la actual primero. */
export async function cloudChangePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (newPassword.length < 8) fail("weak_password");
  const { data } = await sb().auth.getUser();
  const email = data.user?.email;
  if (!email) fail("network");
  const { error: e1 } = await sb().auth.signInWithPassword({ email, password: currentPassword });
  if (e1) fail("wrong_password");
  const { error } = await sb().auth.updateUser({ password: newPassword });
  if (error) mapAuthError(error.message);
}

/** Si ya hay sesión de Supabase (por ejemplo, al volver del enlace de confirmación), entra al box. */
export async function cloudEnterIfSignedIn(): Promise<Session | null> {
  const { data } = await sb().auth.getSession();
  if (!data.session) return null;
  return enterTenant();
}
