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
import { notificationsRepoFor } from "./storage/repositories/notifications.repo";
import { seedWod } from "./services/wods.service";
import { superAdminsStore } from "./storage/superadmins";
import { DEFAULT_EXERCISES } from "./services/prs.service";
import { addDays, addMonths, startOfWeek, toDateKey } from "./date";
import { buildKey, get, set } from "./storage/db";
import { hashPassword } from "./crypto";
import { usersRepoFor } from "./storage/repositories/users.repo";
import { createInvitation } from "./services/invitations.service";
import type { Exercise, MembershipPlan, PostType, Tenant, ThemeId, User, WodBlock } from "@/types";
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

  // Ejecuta el trabajo asíncrono (hash de passwords). No bloquea la UI:
  // los datos aparecen tras el primer tick y las páginas usan useDataVersion.
  void seedAsync();
}

async function seedAsync(): Promise<void> {
  const demoHash = await hashPassword("demo1234");

  // Super admin demo con password
  if (superAdminsStore.list().length === 0) {
    superAdminsStore.create({
      name: "Isaac Plataforma",
      email: "isaac@fitbox.io",
      passwordHash: demoHash,
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
  applyPasswordToUsers(norte.tenant.id, demoHash);
  seedClassesFor(norte);
  seedPRsFor(norte);
  seedFeedFor(norte);
  seedWodsFor(norte);
  seedNotificationsFor(norte);
  seedChallengesFor(norte);
  seedProgramsFor(norte);
  seedShopFor(norte);
  seedHealthFor(norte);
  // Invitación demo pendiente
  createInvitation({
    tenantId: norte.tenant.id,
    invitedBy: norte.owner.id,
    role: "member",
    email: "invitado@ejemplo.com",
  });

  // Box secundario
  const sur = createTenantWithSeed({
    name: "Box Sur",
    ownerName: "Marta Ríos",
    ownerEmail: "marta@boxsur.com",
    brandColor: "#0EA5E9",
    themeId: "light-clean",
    extras: false,
  });
  createUserInTenant(sur.tenant.id, { name: "Carla Coach", email: "carla@boxsur.com", role: "coach" });
  createUserInTenant(sur.tenant.id, { name: "Nico Socio", email: "nico@boxsur.com", role: "member" });
  applyPasswordToUsers(sur.tenant.id, demoHash);
  seedFeedFor(sur, 2);

  set(SEEDED_KEY, true);
}

/** Rellena passwordHash y status para todos los usuarios de un tenant. */
function applyPasswordToUsers(tenantId: string, hash: string): void {
  const repo = usersRepoFor(tenantId);
  const list = repo.list();
  repo.replaceAll(
    list.map((u) => ({
      ...u,
      passwordHash: u.passwordHash ?? hash,
      status: u.status ?? "active",
    })),
  );
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

// ---- WODs ----

interface WodSeedDef {
  title: string;
  blocks: WodBlock[];
}

const WOD_LIBRARY: WodSeedDef[] = [
  {
    title: "Fran",
    blocks: [
      { type: "calentamiento", content: "3 rondas: 200m row + 10 air squats + 10 pass-throughs con PVC + 10 scap pull-ups" },
      { type: "fuerza", content: "Thruster técnico 5x3 subiendo hasta encontrar peso cómodo" },
      { type: "metcon", content: "For time: 21-15-9 de Thrusters (43/30 kg) y Pull-ups. Cap: 10 min." },
    ],
  },
  {
    title: "5x5 Back Squat + AMRAP",
    blocks: [
      { type: "calentamiento", content: "500m bike easy + 2 rondas de: 10 goblet squats + 10 band pull-aparts" },
      { type: "fuerza", content: "5x5 Back Squat @ 75-80% 1RM. Descanso 2-3 min." },
      { type: "metcon", content: "AMRAP 12': 10 wall-balls + 10 KBS 24/16 + 200m run" },
    ],
  },
  {
    title: "Cindy",
    blocks: [
      { type: "calentamiento", content: "400m run + 3 rondas de 5 pull-ups + 10 push-ups + 15 air squats a ritmo suave" },
      { type: "metcon", content: "AMRAP 20': 5 pull-ups + 10 push-ups + 15 air squats. Anota rondas completas." },
      { type: "accesorio", content: "Opcional: 3x8 hollow rocks + 3x30s plancha lateral por lado" },
    ],
  },
  {
    title: "DT",
    blocks: [
      { type: "calentamiento", content: "3 rondas: 250m row + 10 barbell RDL + 5 clean high pull técnicos" },
      { type: "fuerza", content: "Complex técnico: 3 deadlift + 2 hang power clean + 1 push jerk. 4 sets sin fallo." },
      { type: "metcon", content: "5 rondas for time: 12 deadlift + 9 hang power clean + 6 push jerk (60/42 kg)" },
    ],
  },
  {
    title: "Snatch + Row",
    blocks: [
      { type: "calentamiento", content: "3 rondas: 200m row + 10 OHS con PVC + 5 snatch pulls" },
      { type: "fuerza", content: "EMOM 10': 2 power snatch subiendo peso cada 2 min" },
      { type: "metcon", content: "3 rondas for time: 500m row + 15 OHS 40/30 kg + 10 T2B" },
    ],
  },
  {
    title: "Helen",
    blocks: [
      { type: "calentamiento", content: "400m jog + 2 rondas de 10 KBS ligeros + 5 pull-ups estrictos" },
      { type: "metcon", content: "3 rondas for time: 400m run + 21 KBS 24/16 + 12 pull-ups" },
      { type: "accesorio", content: "3x10 GHD sit-ups o V-ups si no hay GHD" },
    ],
  },
  {
    title: "Deadlift heavy",
    blocks: [
      { type: "calentamiento", content: "3 rondas: 10 glute bridges + 10 good mornings + 5 deadlift ligeros" },
      { type: "fuerza", content: "Deadlift: 5-5-3-3-1-1-1 subiendo hasta 90% 1RM" },
      { type: "metcon", content: "3 rondas: 10 deadlift 100/70 + 15 box jumps 60/50 + 200m run" },
    ],
  },
  {
    title: "Grace",
    blocks: [
      { type: "calentamiento", content: "500m row + 2 rondas: 10 push press vacío + 10 front squats vacío" },
      { type: "metcon", content: "For time: 30 clean & jerk 60/42 kg. Cap: 8 min." },
    ],
  },
  {
    title: "Push day",
    blocks: [
      { type: "calentamiento", content: "3 rondas: 10 band pull-aparts + 10 push-ups + 10 dislocaciones" },
      { type: "fuerza", content: "Strict press: 5x5 progresivos + 3x8 push-ups strict" },
      { type: "metcon", content: "AMRAP 10': 10 dumbbell push press 22.5/15 + 10 burpees over dumbbell" },
    ],
  },
  {
    title: "Filthy Fifty (scaled)",
    blocks: [
      { type: "calentamiento", content: "5 min movilidad libre + 400m jog" },
      { type: "metcon", content: "For time: 50 box jumps 24/20 + 50 jumping pull-ups + 50 KB swings 16/12 + 50 walking lunges + 50 K2E + 50 push press 20/15 + 50 back extensions + 50 wall balls + 50 burpees + 50 double unders" },
    ],
  },
  {
    title: "Nancy",
    blocks: [
      { type: "calentamiento", content: "400m jog + 2 rondas: 10 OHS con PVC + 5 snatch balance ligero" },
      { type: "metcon", content: "5 rondas for time: 400m run + 15 OHS 43/30" },
    ],
  },
  {
    title: "Hero WOD — Murph (partido)",
    blocks: [
      { type: "calentamiento", content: "5 min bike + movilidad de hombro y cadera" },
      { type: "metcon", content: "For time: 1600m run + 100 pull-ups + 200 push-ups + 300 air squats + 1600m run. Partido en rondas de 5-10-15." },
      { type: "accesorio", content: "10 min de foam roller y estiramiento" },
    ],
  },
  {
    title: "Karen",
    blocks: [
      { type: "calentamiento", content: "3 rondas: 10 air squats + 10 wall-balls ligeros + 10 glute bridges" },
      { type: "metcon", content: "For time: 150 wall-balls 9/6 kg. Cap: 15 min." },
    ],
  },
  {
    title: "EMOM técnico",
    blocks: [
      { type: "calentamiento", content: "400m row + 3 rondas de 10 kip swings + 5 muscle-ups progresivos" },
      { type: "fuerza", content: "EMOM 12': min1 5 pull-ups estrictos, min2 8 HSPU, min3 10 pistols" },
      { type: "metcon", content: "AMRAP 8': 5 HSPU + 10 T2B + 15 air squats" },
    ],
  },
];

function seedWodsFor({ tenant, users }: SeedResult) {
  const admin = users.find((u) => u.role === "admin") ?? users[0];
  if (!admin) return;
  const today = new Date();
  // 14 días: ayer y 13 días hacia adelante (para que "hoy" tenga WOD)
  for (let i = -1; i < 13; i++) {
    const d = addDays(today, i);
    const def = WOD_LIBRARY[(i + 1) % WOD_LIBRARY.length];
    seedWod(tenant.id, admin.id, {
      date: toDateKey(d),
      title: def.title,
      blocks: def.blocks,
      publish: true,
    });
  }
}

function seedNotificationsFor({ tenant, users }: SeedResult) {
  const repo = notificationsRepoFor(tenant.id);
  const ana = users.find((u) => u.name === "Ana Socia");
  const diego = users.find((u) => u.name === "Diego Socio");
  const now = Date.now();
  const mk = (
    userId: string,
    type: import("@/types").NotificationType,
    title: string,
    body: string,
    linkTo: string,
    minutesAgo: number,
    read = false,
  ) => {
    const n = repo.create({ tenantId: tenant.id, userId, type, title, body, linkTo, read });
    const iso = new Date(now - minutesAgo * 60_000).toISOString();
    repo.replaceAll(repo.list().map((x) => (x.id === n.id ? { ...x, createdAt: iso } : x)));
  };
  if (ana) {
    mk(ana.id, "new_post", "Nuevo WOD publicado", "Fran · WOD del día", "/feed", 45);
    mk(ana.id, "membership_expiring", "Tu plan expira pronto", "Tu bono de 12 clases caduca en 5 días.", "/dashboard", 60 * 6);
    mk(ana.id, "waitlist_promoted", "¡Has pasado de lista de espera!", "WOD Tarde · mañana a las 19:00", "/reservas", 60 * 26, true);
  }
  if (diego) {
    mk(diego.id, "new_post", "Nuevo WOD publicado", "Fran · WOD del día", "/feed", 30);
    mk(diego.id, "session_cancelled", "Sesión cancelada", "WOD Tarde del jueves a las 19:00 ha sido cancelada.", "/reservas", 60 * 12);
  }
}

// ---- Seeds Fase 11 ----

import { challengesRepoFor, challengeParticipantsRepoFor } from "./storage/repositories/challenges.repo";
import {
  programsRepoFor,
  programSessionsRepoFor,
  programAssignmentsRepoFor,
  programProgressRepoFor,
} from "./storage/repositories/programs.repo";
import { productsRepoFor } from "./storage/repositories/products.repo";
import { ordersRepoFor } from "./storage/repositories/orders.repo";
import { bodyMetricsRepoFor } from "./storage/repositories/bodyMetrics.repo";

function seedChallengesFor({ tenant, users }: SeedResult) {
  const chRepo = challengesRepoFor(tenant.id);
  const partsRepo = challengeParticipantsRepoFor(tenant.id);
  const exRepo = exercisesRepoFor(tenant.id);
  const ana = users.find((u) => u.name === "Ana Socia");
  const diego = users.find((u) => u.name === "Diego Socio");
  const today = new Date();
  const start = toDateKey(addDays(today, -10));
  const end = toDateKey(addDays(today, 20));

  const c1 = chRepo.create({
    tenantId: tenant.id,
    title: "12 clases este mes",
    description: "Ven al box 12 veces en el periodo del reto y llévate la insignia.",
    type: "attendance",
    goal: 12,
    startDate: start,
    endDate: end,
    status: "active",
    badge: "🏋️",
  });
  const fran = exRepo.list().find((e) => e.name === "Fran");
  if (fran) {
    const c2 = chRepo.create({
      tenantId: tenant.id,
      title: "Baja tu Fran",
      description: "Registra tu mejor Fran RX o escalado en el periodo del reto.",
      type: "benchmark",
      goal: fran.id,
      startDate: start,
      endDate: end,
      status: "active",
      badge: "🔥",
    });
    if (ana) partsRepo.create({ tenantId: tenant.id, challengeId: c2.id, userId: ana.id, progress: 0 });
    if (diego) partsRepo.create({ tenantId: tenant.id, challengeId: c2.id, userId: diego.id, progress: 0 });
  }
  if (ana) partsRepo.create({ tenantId: tenant.id, challengeId: c1.id, userId: ana.id, progress: 4 });
  if (diego) partsRepo.create({ tenantId: tenant.id, challengeId: c1.id, userId: diego.id, progress: 9 });
}

function seedProgramsFor({ tenant, users }: SeedResult) {
  const owner = users.find((u) => u.role === "admin") ?? users[0];
  if (!owner) return;
  const prog = programsRepoFor(tenant.id).create({
    tenantId: tenant.id,
    title: "Fuerza básica 4 semanas",
    description: "Programa progresivo de fuerza con 3 sesiones semanales.",
    weeks: 4,
    level: "iniciacion",
    createdBy: owner.id,
  });
  const sessionsRepo = programSessionsRepoFor(tenant.id);
  for (let w = 1; w <= 4; w++) {
    sessionsRepo.create({
      tenantId: tenant.id, programId: prog.id, weekNumber: w, dayNumber: 1,
      title: "Squat day",
      blocks: [
        { type: "calentamiento", content: "3 rondas: 10 goblet + 10 band pull-apart" },
        { type: "fuerza", content: `Back Squat 5x5 progresivo (semana ${w})` },
      ],
    });
    sessionsRepo.create({
      tenantId: tenant.id, programId: prog.id, weekNumber: w, dayNumber: 3,
      title: "Press day",
      blocks: [
        { type: "calentamiento", content: "3 rondas: 10 push-ups + 10 dislocaciones" },
        { type: "fuerza", content: `Strict Press 5x5 (semana ${w})` },
      ],
    });
    sessionsRepo.create({
      tenantId: tenant.id, programId: prog.id, weekNumber: w, dayNumber: 5,
      title: "Deadlift day",
      blocks: [
        { type: "calentamiento", content: "3 rondas: 10 good mornings + 10 glute bridges" },
        { type: "fuerza", content: `Deadlift 5-5-3-3-1 (semana ${w})` },
      ],
    });
  }
  const ana = users.find((u) => u.name === "Ana Socia");
  if (ana) {
    const assignment = programAssignmentsRepoFor(tenant.id).create({
      tenantId: tenant.id, programId: prog.id, userId: ana.id, assignedBy: owner.id,
      startDate: toDateKey(addDays(new Date(), -14)), status: "active",
    });
    const first3 = sessionsRepoFor_seed_helper(tenant.id, prog.id).slice(0, 3);
    for (const s of first3) {
      programProgressRepoFor(tenant.id).create({
        tenantId: tenant.id, assignmentId: assignment.id, programSessionId: s.id,
        completedAt: new Date().toISOString(),
      });
    }
  }
}

function sessionsRepoFor_seed_helper(tenantId: string, programId: string) {
  return programSessionsRepoFor(tenantId)
    .query({ programId })
    .sort((a, b) => a.weekNumber - b.weekNumber || a.dayNumber - b.dayNumber);
}

function seedShopFor({ tenant, users }: SeedResult) {
  const pRepo = productsRepoFor(tenant.id);
  const items = [
    { name: "Camiseta del box", description: "Camiseta técnica con logo, tallas S–XL.", price: 25, category: "ropa" as const, stock: 30 },
    { name: "Muñequeras", description: "Par de muñequeras negras.", price: 15, category: "accesorios" as const, stock: 20 },
    { name: "Magnesio líquido", description: "Bote 250 ml.", price: 12, category: "accesorios" as const, stock: 15 },
    { name: "Proteína whey 1 kg", description: "Sabor chocolate.", price: 32, category: "suplementacion" as const, stock: 10 },
    { name: "Botella 750 ml", description: "Botella de acero inoxidable.", price: 18, category: "accesorios" as const, stock: 8 },
    { name: "Sudadera del box", description: "Sudadera negra con logo bordado.", price: 45, category: "ropa" as const, stock: 12 },
  ];
  const created = items.map((it) => pRepo.create({ tenantId: tenant.id, ...it, imageUrl: undefined, active: true }));
  const ana = users.find((u) => u.name === "Ana Socia");
  const diego = users.find((u) => u.name === "Diego Socio");
  const oRepo = ordersRepoFor(tenant.id);
  if (ana) {
    const p = created[0];
    oRepo.create({
      tenantId: tenant.id, userId: ana.id,
      items: [{ productId: p.id, qty: 1, priceAtOrder: p.price, name: p.name }],
      total: p.price, status: "pendiente",
    });
  }
  if (diego) {
    const p1 = created[3], p2 = created[1];
    oRepo.create({
      tenantId: tenant.id, userId: diego.id,
      items: [
        { productId: p1.id, qty: 1, priceAtOrder: p1.price, name: p1.name },
        { productId: p2.id, qty: 1, priceAtOrder: p2.price, name: p2.name },
      ],
      total: p1.price + p2.price, status: "listo",
    });
  }
}

function seedHealthFor({ tenant, users }: SeedResult) {
  const ana = users.find((u) => u.name === "Ana Socia");
  if (!ana) return;
  const bm = bodyMetricsRepoFor(tenant.id);
  const today = new Date();
  const points = [
    { d: 240, w: 66.5, f: 27, hr: 68 },
    { d: 200, w: 66.2, f: 26.5, hr: 67 },
    { d: 160, w: 65.8, f: 26, hr: 66 },
    { d: 120, w: 65.4, f: 25.5, hr: 65 },
    { d: 90, w: 65.0, f: 24.8, hr: 64 },
    { d: 60, w: 64.7, f: 24.2, hr: 63 },
    { d: 30, w: 64.4, f: 23.8, hr: 62 },
    { d: 10, w: 64.1, f: 23.5, hr: 61 },
    { d: 2, w: 64.0, f: 23.3, hr: 60 },
  ];
  for (const p of points) {
    bm.create({
      tenantId: tenant.id, userId: ana.id,
      date: toDateKey(addDays(today, -p.d)),
      weightKg: p.w, bodyFatPct: p.f, restingHr: p.hr,
    });
  }
}
