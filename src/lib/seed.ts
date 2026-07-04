import { tenantsRepo } from "./storage/repositories/tenants.repo";
import { createUserInTenant } from "./storage/repositories/users.repo";
import { classTemplatesRepoFor } from "./storage/repositories/classTemplates.repo";
import { classSessionsRepoFor } from "./storage/repositories/classSessions.repo";
import { bookingsRepoFor } from "./storage/repositories/bookings.repo";
import { checkinsRepoFor } from "./storage/repositories/checkins.repo";
import { membershipPlansRepoFor } from "./storage/repositories/membershipPlans.repo";
import { membershipsRepoFor } from "./storage/repositories/memberships.repo";
import { paymentsRepoFor } from "./storage/repositories/payments.repo";
import { exercisesRepoFor } from "./storage/repositories/exercises.repo";
import { personalRecordsRepoFor } from "./storage/repositories/personalRecords.repo";
import { postsRepoFor } from "./storage/repositories/posts.repo";
import { superAdminsStore } from "./storage/superadmins";
import { DEFAULT_EXERCISES } from "./services/prs.service";
import { addDays, addMonths, startOfWeek, toDateKey } from "./date";
import { buildKey, get, set } from "./storage/db";
import type { Exercise, MembershipPlan, PostType, Tenant, ThemeId, User } from "@/types";
import { DEFAULT_MODULES } from "@/types";

const SEEDED_KEY = buildKey(null, "seeded");
const DEMO_CLEARED_KEY = buildKey(null, "demo_cleared");

export interface SeedResult {
  tenant: Tenant;
  owner: User;
  users: User[];
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createTenantWithSeed(input: {
  name: string;
  ownerName: string;
  ownerEmail: string;
  brandColor: string;
  themeId?: ThemeId;
  extras?: boolean;
}): SeedResult {
  const tenant = tenantsRepo.create({
    name: input.name,
    slug: slugify(input.name),
    brandColor: input.brandColor,
    themeId: input.themeId ?? "dark-carbon",
    status: "active",
    settings: { cancellationWindowHours: 2, enabledModules: DEFAULT_MODULES },
  });

  const owner = createUserInTenant(tenant.id, {
    name: input.ownerName,
    email: input.ownerEmail,
    role: "admin",
  });

  const extras: User[] = [];
  if (input.extras !== false) {
    extras.push(
      createUserInTenant(tenant.id, {
        name: "Laura Coach",
        email: "laura@" + tenant.slug + ".com",
        role: "coach",
      }),
      createUserInTenant(tenant.id, {
        name: "Marcos Coach",
        email: "marcos@" + tenant.slug + ".com",
        role: "coach",
      }),
      createUserInTenant(tenant.id, {
        name: "Ana Socia",
        email: "ana@" + tenant.slug + ".com",
        role: "member",
      }),
      createUserInTenant(tenant.id, {
        name: "Diego Socio",
        email: "diego@" + tenant.slug + ".com",
        role: "member",
      }),
    );
  }

  const exercisesRepo = exercisesRepoFor(tenant.id);
  DEFAULT_EXERCISES.forEach((d) =>
    exercisesRepo.create({ tenantId: tenant.id, isCustom: false, ...d }),
  );

  return { tenant, owner, users: [owner, ...extras] };
}

/** Auto-seed inicial: super admin + CrossFit Norte + Box Sur. Idempotente. */
export function bootstrapDemoIfNeeded(): void {
  if (get<boolean>(SEEDED_KEY, false)) return;
  if (get<boolean>(DEMO_CLEARED_KEY, false)) return;

  // Super admin demo
  if (superAdminsStore.list().length === 0) {
    superAdminsStore.create({
      name: "Isaac Plataforma",
      email: "isaac@fitbox.io",
    });
  }

  // Box principal
  const norte = createTenantWithSeed({
    name: "CrossFit Norte",
    ownerName: "Sergio Torres",
    ownerEmail: "sergio@crossfitnorte.com",
    brandColor: "#F97316",
    themeId: "dark-carbon",
  });
  seedClassesFor(norte);
  seedPRsFor(norte);
  seedFeedFor(norte);

  // Box secundario, más pequeño y con otro tema
  const sur = createTenantWithSeed({
    name: "Box Sur",
    ownerName: "Marta Ríos",
    ownerEmail: "marta@boxsur.com",
    brandColor: "#0EA5E9",
    themeId: "light-clean",
    extras: false,
  });
  // Un coach y un socio
  createUserInTenant(sur.tenant.id, { name: "Carla Coach", email: "carla@boxsur.com", role: "coach" });
  createUserInTenant(sur.tenant.id, { name: "Nico Socio", email: "nico@boxsur.com", role: "member" });
  seedFeedFor(sur, 2);

  set(SEEDED_KEY, true);
}

/** Legado: se mantiene el helper aunque ya no se llame desde UI. */
export function loadDemoData(): SeedResult {
  const base = createTenantWithSeed({
    name: "CrossFit Norte",
    ownerName: "Sergio Torres",
    ownerEmail: "sergio@crossfitnorte.com",
    brandColor: "#F97316",
  });
  seedClassesFor(base);
  seedPRsFor(base);
  seedFeedFor(base);
  return base;
}

interface PRSeed {
  name: string;
  values: Array<{ daysAgo: number; value: number; rx?: boolean }>;
}

function seedPRsFor({ tenant, users }: SeedResult) {
  const exercisesRepo = exercisesRepoFor(tenant.id);
  const prsRepo = personalRecordsRepoFor(tenant.id);
  const allExercises: Exercise[] = exercisesRepo.list();
  const byName = new Map(allExercises.map((e) => [e.name, e]));

  const ana = users.find((u) => u.name === "Ana Socia");
  const diego = users.find((u) => u.name === "Diego Socio");
  const laura = users.find((u) => u.name === "Laura Coach");
  const today = new Date();

  const anaSets: PRSeed[] = [
    { name: "Back Squat", values: [{ daysAgo: 180, value: 70 }, { daysAgo: 120, value: 75 }, { daysAgo: 60, value: 82 }, { daysAgo: 15, value: 85 }] },
    { name: "Deadlift", values: [{ daysAgo: 200, value: 90 }, { daysAgo: 90, value: 100 }, { daysAgo: 20, value: 110 }] },
    { name: "Snatch", values: [{ daysAgo: 150, value: 35 }, { daysAgo: 60, value: 42 }, { daysAgo: 10, value: 45 }] },
    { name: "Fran", values: [{ daysAgo: 120, value: 8 * 60 + 30 }, { daysAgo: 40, value: 6 * 60 + 55, rx: false }] },
    { name: "Pull-ups max", values: [{ daysAgo: 90, value: 5 }, { daysAgo: 30, value: 8, rx: false }] },
    { name: "Run 5K", values: [{ daysAgo: 150, value: 30 * 60 + 20 }, { daysAgo: 30, value: 27 * 60 + 45 }] },
  ];
  const diegoSets: PRSeed[] = [
    { name: "Back Squat", values: [{ daysAgo: 240, value: 100 }, { daysAgo: 150, value: 120 }, { daysAgo: 60, value: 135 }, { daysAgo: 5, value: 140 }] },
    { name: "Clean & Jerk", values: [{ daysAgo: 200, value: 80 }, { daysAgo: 90, value: 92 }, { daysAgo: 20, value: 100 }] },
    { name: "Fran", values: [{ daysAgo: 150, value: 5 * 60 + 20 }, { daysAgo: 60, value: 4 * 60 + 40 }, { daysAgo: 20, value: 4 * 60 + 12 }] },
    { name: "Murph", values: [{ daysAgo: 200, value: 55 * 60 }, { daysAgo: 30, value: 48 * 60 + 30 }] },
  ];
  const lauraSets: PRSeed[] = [
    { name: "Back Squat", values: [{ daysAgo: 120, value: 95 }, { daysAgo: 20, value: 105 }] },
    { name: "Snatch", values: [{ daysAgo: 100, value: 55 }, { daysAgo: 30, value: 60 }] },
  ];

  const insertFor = (userId: string, sets: PRSeed[]) => {
    for (const s of sets) {
      const ex = byName.get(s.name);
      if (!ex) continue;
      for (const v of s.values) {
        prsRepo.create({
          tenantId: tenant.id,
          userId,
          exerciseId: ex.id,
          value: v.value,
          rx: v.rx ?? true,
          date: toDateKey(addDays(today, -v.daysAgo)),
        });
      }
    }
  };
  if (ana) insertFor(ana.id, anaSets);
  if (diego) insertFor(diego.id, diegoSets);
  if (laura) insertFor(laura.id, lauraSets);
}

function seedFeedFor({ tenant, users }: SeedResult, count = 6) {
  const postsRepo = postsRepoFor(tenant.id);
  const author = users[0]?.id ?? "";
  const today = new Date();

  const items: Array<{ type: PostType; title: string; content: string; pinned?: boolean; daysAgo: number }> = [
    { type: "wod", title: "WOD del día — Fran", content: "21-15-9 de Thrusters (43/30 kg) y Pull-ups. RX si vas al peso. Escalado sale con anillas o goma.", pinned: true, daysAgo: 0 },
    { type: "aviso", title: "Clase de las 19:00 cancelada mañana", content: "Mañana la sesión de las 19:00 no se impartirá por formación. Podéis reubicaros en la de las 17:30.", daysAgo: 1 },
    { type: "consejo", title: "Cómo mejorar tu Snatch en 4 semanas", content: "1) Movilidad de tobillo y hombro diaria. 2) Overhead squat con PVC 3x/semana. 3) Snatch pull técnico ligero. 4) Foto en vídeo lateral cada semana.", daysAgo: 3 },
    { type: "receta", title: "Batido post-entreno alto en proteína", content: "300 ml de leche, 1 plátano, 30 g de proteína de suero, 1 cucharada de mantequilla de cacahuete, canela. Triturar y beber en los 30 min post-WOD.", daysAgo: 5 },
    { type: "wod", title: "Benchmark del mes — Cindy", content: "AMRAP 20 min: 5 pull-ups, 10 push-ups, 15 air squats. Apunta tu marca para el ranking del mes.", daysAgo: 8 },
    { type: "aviso", title: "Cerrado el 15 por festivo local", content: "El box permanecerá cerrado el 15. Ese día no habrá clases; el 16 volvemos con horario normal.", daysAgo: 12 },
  ];

  items.slice(0, count).forEach((it) => {
    postsRepo.create({
      tenantId: tenant.id,
      authorId: author,
      type: it.type,
      title: it.title,
      content: it.content,
      pinned: it.pinned ?? false,
      // Fake createdAt override para orden: usamos update tras crear.
    });
    // Ajustar createdAt manualmente
    const list = postsRepo.list();
    const last = list[list.length - 1];
    if (last) {
      postsRepo.update(last.id, {});
      const target = new Date(today);
      target.setDate(target.getDate() - it.daysAgo);
      // Sobreescribir createdAt directamente vía replaceAll
      const updated = postsRepo.list().map((p) =>
        p.id === last.id ? { ...p, createdAt: target.toISOString() } : p,
      );
      postsRepo.replaceAll(updated);
    }
  });
}

function seedClassesFor({ tenant, users }: SeedResult) {
  const templatesRepo = classTemplatesRepoFor(tenant.id);
  const sessionsRepo = classSessionsRepoFor(tenant.id);
  const bookingsRepo = bookingsRepoFor(tenant.id);
  const checkinsRepo = checkinsRepoFor(tenant.id);
  const plansRepo = membershipPlansRepoFor(tenant.id);
  const membershipsRepo = membershipsRepoFor(tenant.id);
  const paymentsRepo = paymentsRepoFor(tenant.id);

  const laura = users.find((u) => u.name === "Laura Coach");
  const marcos = users.find((u) => u.name === "Marcos Coach");
  const ana = users.find((u) => u.name === "Ana Socia");
  const diego = users.find((u) => u.name === "Diego Socio");

  const planDefs: Array<Omit<MembershipPlan, keyof import("@/types").BaseEntity>> = [
    { tenantId: tenant.id, name: "Ilimitado", priceMonthly: 89, type: "unlimited", active: true },
    { tenantId: tenant.id, name: "12 clases", priceMonthly: 69, type: "credits", creditsPerMonth: 12, active: true },
    { tenantId: tenant.id, name: "8 clases", priceMonthly: 55, type: "credits", creditsPerMonth: 8, active: true },
  ];
  const [planUnlimited, plan12] = planDefs.map((p) => plansRepo.create(p));

  const today = new Date();
  if (ana) {
    const startAna = addDays(today, -26);
    const endAna = addMonths(startAna, 1);
    const membershipAna = membershipsRepo.create({
      tenantId: tenant.id,
      userId: ana.id,
      planId: plan12.id,
      startDate: toDateKey(startAna),
      endDate: toDateKey(endAna),
      status: "active",
      creditsRemaining: 5,
    });
    paymentsRepo.create({
      tenantId: tenant.id, userId: ana.id, membershipId: membershipAna.id,
      amount: plan12.priceMonthly, method: "tarjeta",
      date: toDateKey(addDays(today, -56)), notes: "Alta 12 clases",
    });
    paymentsRepo.create({
      tenantId: tenant.id, userId: ana.id, membershipId: membershipAna.id,
      amount: plan12.priceMonthly, method: "domiciliacion",
      date: toDateKey(startAna), notes: "Renovación mensual",
    });
  }
  if (diego) {
    const startDiego = addDays(today, -10);
    const endDiego = addMonths(startDiego, 1);
    const membershipDiego = membershipsRepo.create({
      tenantId: tenant.id,
      userId: diego.id,
      planId: planUnlimited.id,
      startDate: toDateKey(startDiego),
      endDate: toDateKey(endDiego),
      status: "active",
    });
    for (let i = 0; i < 3; i++) {
      paymentsRepo.create({
        tenantId: tenant.id, userId: diego.id, membershipId: membershipDiego.id,
        amount: planUnlimited.priceMonthly, method: "tarjeta",
        date: toDateKey(addDays(today, -70 + i * 30)), notes: "Renovación mensual",
      });
    }
  }

  // Plantillas
  const templateDefs: Array<Parameters<typeof templatesRepo.create>[0]> = [
    { tenantId: tenant.id, name: "WOD Mañana", type: "wod", durationMinutes: 60, defaultCapacity: 12, defaultCoachId: laura?.id, color: "#F97316" },
    { tenantId: tenant.id, name: "WOD Tarde", type: "wod", durationMinutes: 60, defaultCapacity: 14, defaultCoachId: marcos?.id, color: "#EAB308" },
    { tenantId: tenant.id, name: "Halterofilia", type: "halterofilia", durationMinutes: 75, defaultCapacity: 8, defaultCoachId: laura?.id, color: "#22C55E" },
    { tenantId: tenant.id, name: "Open Box", type: "open_box", durationMinutes: 60, defaultCapacity: 10, color: "#0EA5E9" },
  ];
  const templates = templateDefs.map((t) => templatesRepo.create(t));
  const [tplWodM, tplWodT, tplHalter, tplOpen] = templates;

  // Sesiones ±3 semanas, L-V 7:00/9:30/13:30/17:30/19:00 + sábado 10:00
  const times = ["07:00", "09:30", "13:30", "17:30", "19:00"];
  const weekStart = startOfWeek(today);
  const range: number[] = [];
  for (let w = -3; w <= 2; w++) range.push(w);
  const pickTpl = (h: string) => {
    if (h === "07:00" || h === "09:30") return tplWodM;
    if (h === "13:30") return tplOpen;
    if (h === "17:30") return tplHalter;
    return tplWodT;
  };
  for (const w of range) {
    for (let d = 0; d < 6; d++) {
      const day = addDays(weekStart, w * 7 + d);
      if (d === 5) {
        // sábado
        const tpl = tplWodM;
        sessionsRepo.create({
          tenantId: tenant.id, templateId: tpl.id, date: toDateKey(day),
          startTime: "10:00", durationMinutes: tpl.durationMinutes, capacity: tpl.defaultCapacity,
          coachId: tpl.defaultCoachId, status: "scheduled",
        });
      } else {
        for (const h of times) {
          const tpl = pickTpl(h);
          sessionsRepo.create({
            tenantId: tenant.id, templateId: tpl.id, date: toDateKey(day),
            startTime: h, durationMinutes: tpl.durationMinutes, capacity: tpl.defaultCapacity,
            coachId: tpl.defaultCoachId, status: "scheduled",
          });
        }
      }
    }
  }

  // Reservas y check-ins de muestra
  const allSessions = sessionsRepo.list();
  const bookFor = (userId: string, count: number) => {
    let done = 0;
    for (const s of allSessions) {
      if (done >= count) break;
      const sessionDate = new Date(s.date + "T" + s.startTime + ":00");
      if (sessionDate < addDays(today, -21)) continue;
      const bk = bookingsRepo.create({
        tenantId: tenant.id, sessionId: s.id, userId, status: "confirmed",
      });
      if (sessionDate < today) {
        checkinsRepo.create({
          tenantId: tenant.id, bookingId: bk.id, sessionId: s.id, userId,
          checkedInAt: sessionDate.toISOString(),
        });
      }
      done++;
    }
  };
  if (ana) bookFor(ana.id, 6);
  if (diego) bookFor(diego.id, 10);
}
