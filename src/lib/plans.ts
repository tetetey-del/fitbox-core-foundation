/**
 * @file Planes de Kinflow (Starter, Pro, Business) y lo que incluye cada uno.
 * El plan de cada box lo decide la plataforma (tabla tenant_plans en Supabase);
 * el dueño solo lo ve. Los límites también los controla la base de datos.
 */
import type { PlanId, Tenant, TenantModules, TenantSubscription } from "@/types";
import { usersRepo } from "@/lib/storage/repositories/users.repo";

/** Lo que se puede activar o no según el plan. */
export type PlanFeature =
  | "prs"
  | "challenges"
  | "programs"
  | "shop"
  | "health"
  | "coachNotes"
  | "wodCycles"
  | "themes";

export interface PlanInfo {
  id: PlanId;
  name: string;
  priceMonthly: number;
  desc: string;
  maxMembers: number | null;
  maxCoaches: number | null;
  maxAdmins: number | null;
  maxLocations: number | null;
  features: PlanFeature[];
  highlights: string[];
}

const ALL_FEATURES: PlanFeature[] = ["prs", "challenges", "programs", "shop", "health", "coachNotes", "wodCycles", "themes"];

export const PLANS: Record<PlanId, PlanInfo> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 29,
    desc: "Para boxes pequeños o que están empezando.",
    maxMembers: 50,
    maxCoaches: 1,
    maxAdmins: 1,
    maxLocations: 1,
    features: [],
    highlights: ["Hasta 50 socios", "Reservas y cuotas", "Clases y WOD", "1 administrador y 1 coach", "Tu logo", "Comunidad del box"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 59,
    desc: "Para boxes en crecimiento.",
    maxMembers: null,
    maxCoaches: null,
    maxAdmins: null,
    maxLocations: 2,
    features: ALL_FEATURES,
    highlights: [
      "Socios y coaches ilimitados",
      "Hasta 2 sedes",
      "Marcas y ranking",
      "Retos, rutinas, tienda y salud",
      "Notas del coach y ciclos de programación",
      "Tu logo y tus colores",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    priceMonthly: 99,
    desc: "Para cadenas y varias sedes.",
    maxMembers: null,
    maxCoaches: null,
    maxAdmins: null,
    maxLocations: null,
    features: ALL_FEATURES,
    highlights: ["Todo lo del plan Pro", "Varias sedes en un panel", "Exportación de datos", "Soporte prioritario", "Puesta en marcha acompañada"],
  },
};

export const PLAN_FEATURE_LABEL: Record<PlanFeature, string> = {
  prs: "Marcas y ranking",
  challenges: "Retos",
  programs: "Rutinas personalizadas",
  shop: "Tienda",
  health: "Salud",
  coachNotes: "Notas del coach",
  wodCycles: "Ciclos de programación",
  themes: "Colores y temas",
};

/** Plan del box. Las demos y los boxes sin dato se tratan como Pro activo. */
export function subscriptionOf(tenant: Tenant | null | undefined): TenantSubscription {
  return tenant?.subscription ?? { plan: "pro", status: "active" };
}

export function planOf(tenant: Tenant | null | undefined): PlanInfo {
  return PLANS[subscriptionOf(tenant).plan] ?? PLANS.pro;
}

export function planAllows(tenant: Tenant | null | undefined, feature: PlanFeature): boolean {
  return planOf(tenant).features.includes(feature);
}

/** Días que le quedan a la prueba (redondeado hacia arriba). null si no está en prueba. */
export function trialDaysLeft(sub: TenantSubscription, now = new Date()): number | null {
  if (sub.status !== "trial" || !sub.trialEndsAt) return null;
  return Math.ceil((new Date(sub.trialEndsAt).getTime() - now.getTime()) / 86_400_000);
}

/** ¿Está bloqueado? (a mano, o la prueba terminó sin activar un plan) */
export function isBlocked(sub: TenantSubscription, now = new Date()): boolean {
  if (sub.status === "blocked") return true;
  const left = trialDaysLeft(sub, now);
  return left !== null && new Date(sub.trialEndsAt!).getTime() < now.getTime();
}

/** Módulos que el plan deja usar (se combinan con los que el dueño activa). */
export function modulesAllowedByPlan(tenant: Tenant | null | undefined): Partial<TenantModules> {
  const p = planOf(tenant);
  const has = (f: PlanFeature) => p.features.includes(f);
  return {
    prs: has("prs"),
    challenges: has("challenges"),
    programs: has("programs"),
    shop: has("shop"),
    health: has("health"),
  };
}

/** Cuántas personas activas hay de un rol. */
export function countActive(role: "member" | "coach" | "admin"): number {
  return usersRepo.list().filter((u) => u.role === role && u.status !== "suspended").length;
}

export type LimitKind = "members" | "coaches" | "admins";

/** Si se puede sumar una persona más de ese tipo. Devuelve el límite cuando no. */
export function limitReached(tenant: Tenant | null | undefined, kind: LimitKind): number | null {
  const p = planOf(tenant);
  const max = kind === "members" ? p.maxMembers : kind === "coaches" ? p.maxCoaches : p.maxAdmins;
  if (max === null) return null;
  const role = kind === "members" ? "member" : kind === "coaches" ? "coach" : "admin";
  return countActive(role) >= max ? max : null;
}

/** Explicación de cada límite, para el cartel "Pásate a Pro". */
export function limitMessage(kind: LimitKind, max: number): { title: string; body: string } {
  if (kind === "members") {
    return {
      title: `Has llegado a los ${max} socios del plan Starter`,
      body: "El plan Starter está pensado para boxes que están empezando y llega hasta 50 socios. Con el plan Pro tienes socios ilimitados, y además marcas y ranking, retos, rutinas, tienda y tus propios colores.",
    };
  }
  if (kind === "coaches") {
    return {
      title: "El plan Starter incluye 1 coach",
      body: "Starter incluye 1 administrador y 1 coach, para boxes chicos donde el dueño también da clases. Si tu equipo crece, con el plan Pro tienes coaches ilimitados, cada uno con su propio acceso.",
    };
  }
  return {
    title: "El plan Starter incluye 1 administrador",
    body: "Starter incluye 1 administrador (tú) y 1 coach. Con el plan Pro puedes sumar más personas al equipo.",
  };
}

/** Traduce los errores de límite que devuelve la base de datos. */
export function limitFromError(message: string | undefined): LimitKind | null {
  if (!message) return null;
  if (message.includes("KF_LIMIT_MEMBERS")) return "members";
  if (message.includes("KF_LIMIT_COACHES")) return "coaches";
  if (message.includes("KF_LIMIT_ADMINS")) return "admins";
  return null;
}
