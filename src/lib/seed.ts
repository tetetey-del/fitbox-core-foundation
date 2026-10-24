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
import { buildKey, get, isBrowser, remove, set } from "./storage/db";
import { sessionStore } from "./storage/session";
import { superSessionStore } from "./storage/superadmins";
import { notifyDataChanged } from "./data-bus";
import { hashPassword } from "./crypto";
import { usersRepoFor } from "./storage/repositories/users.repo";
import { createInvitation } from "./services/invitations.service";
import type { ClassTemplate, Exercise, MembershipPlan, PaymentMethod, PostType, Tenant, ThemeId, User, WodBlock } from "@/types";
import { DEFAULT_MODULES } from "@/types";

const SEEDED_KEY = buildKey(null, "seeded");
const DEMO_CLEARED_KEY = buildKey(null, "demo_cleared");
/** Versión del gimnasio de demo. Si cambia, los navegadores con la demo vieja se vuelven a sembrar. */
const DEMO_VERSION_KEY = buildKey(null, "demo_version");
const DEMO_VERSION = 2;
/** Boxes de la demo anterior (FitBox) que se borran al pasar a la versión 2. */
const OLD_DEMO_SLUGS = ["crossfit-norte", "box-sur"];
const OLD_SUPERADMIN_EMAILS = ["isaac@fitbox.io"];

export interface SeedResult {
  tenant: Tenant;
  owner: User;
  coaches: User[];
  members: User[];
  users: User[];
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Generador pseudoaleatorio con semilla: la demo sale igual en todos los navegadores. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Gimnasio de demo: Chia Training (Córdoba, Argentina) ----

const CHIA = {
  name: "Chia Training",
  domain: "chiatraining.com",
  brandColor: "#A3226E",
  themeId: "chia" as ThemeId,
  owner: { name: "Celeste Teyssedou", email: "celeste@chiatraining.com" },
  coaches: [
    { key: "lucas", name: "Lucas", email: "lucas@chiatraining.com" },
    { key: "ana", name: "Ana", email: "ana@chiatraining.com" },
    { key: "paula", name: "Paula", email: "paula@chiatraining.com" },
  ],
};

/**
 * Planes en pesos argentinos. Precios orientativos para un box de Córdoba a fines de 2026,
 * estimados a partir de cuotas publicadas en 2025 y ajustados por inflación.
 * `priceMonthly` es el precio de cada período (6 meses en el semestral, 12 en el anual).
 */
const CHIA_PLANS: Array<{ key: string; name: string; price: number; type: "credits" | "unlimited"; credits?: number; months?: number; perWeek: number }> = [
  { key: "8", name: "8 clases · 2 por semana", price: 30000, type: "credits", credits: 8, perWeek: 2 },
  { key: "12", name: "12 clases · 3 por semana", price: 36000, type: "credits", credits: 12, perWeek: 3 },
  { key: "16", name: "16 clases · 4 por semana", price: 41000, type: "credits", credits: 16, perWeek: 4 },
  { key: "libre", name: "Pase libre", price: 46000, type: "unlimited", perWeek: 5 },
  { key: "semestral", name: "Pase libre semestral (-10%)", price: 248400, type: "unlimited", months: 6, perWeek: 5 },
  { key: "anual", name: "Pase libre anual (-15%)", price: 469200, type: "unlimited", months: 12, perWeek: 5 },
];

/** Socios de la demo: plan, horario preferido y hace cuánto renovaron. */
interface ChiaMemberDef {
  name: string;
  email: string;
  plan: string;
  times: string[];
  startedDaysAgo: number;
  method: PaymentMethod;
  /** Hace cuántos días se hizo socio (para "altas del mes"). */
  joinedDaysAgo?: number;
}

const CHIA_MEMBERS: ChiaMemberDef[] = [
  { name: "Sofía Martínez", email: "sofia@chiatraining.com", plan: "12", times: ["19:00", "18:00"], startedDaysAgo: 24, method: "transferencia" },
  { name: "Martín Gómez", email: "martin@chiatraining.com", plan: "libre", times: ["07:00", "06:00"], startedDaysAgo: 10, method: "transferencia" },
  { name: "Valentina López", email: "valentina@chiatraining.com", plan: "8", times: ["08:00", "17:00"], startedDaysAgo: 27, method: "efectivo" },
  { name: "Juan Pablo Ríos", email: "juanpablo@chiatraining.com", plan: "semestral", times: ["18:00", "20:00"], startedDaysAgo: 60, method: "transferencia" },
  { name: "Camila Fernández", email: "camila@chiatraining.com", plan: "16", times: ["09:00", "10:00"], startedDaysAgo: 14, method: "tarjeta" },
  { name: "Tomás Herrera", email: "tomas@chiatraining.com", plan: "anual", times: ["06:00", "12:00"], startedDaysAgo: 120, method: "transferencia" },
  { name: "Lucía Benítez", email: "lucia@chiatraining.com", plan: "12", times: ["17:00", "19:00"], startedDaysAgo: 5, method: "efectivo" },
  { name: "Nicolás Sosa", email: "nicolas@chiatraining.com", plan: "libre", times: ["19:00", "20:00"], startedDaysAgo: 18, method: "tarjeta" },
  { name: "Florencia Acosta", email: "florencia@chiatraining.com", plan: "8", times: ["10:00", "09:00"], startedDaysAgo: 2, method: "transferencia" },
  { name: "Agustín Molina", email: "agustin@chiatraining.com", plan: "16", times: ["07:00", "18:00"], startedDaysAgo: 21, method: "transferencia" },
  { name: "Micaela Castro", email: "micaela@chiatraining.com", plan: "12", times: ["08:00", "17:00"], startedDaysAgo: 29, method: "efectivo" },
  { name: "Federico Ruiz", email: "federico@chiatraining.com", plan: "libre", times: ["12:00", "18:00"], startedDaysAgo: 8, method: "tarjeta" },
];

const FIRST_NAMES = ["Juli", "Mateo", "Carolina", "Santiago", "Rocío", "Facundo", "Paz", "Ignacio", "Milagros", "Gonzalo", "Antonella", "Joaquín", "Brenda", "Matías", "Victoria", "Lautaro", "Daniela", "Franco", "Josefina", "Ezequiel", "Carla", "Emiliano", "Belén", "Ramiro", "Aldana", "Bruno", "Celina", "Maximiliano", "Lourdes", "Diego"];
const LAST_NAMES = ["Pereyra", "Quiroga", "Vega", "Romero", "Suárez", "Aguirre", "Medina", "Navarro", "Paz", "Ojeda", "Cabrera", "Domínguez", "Giménez", "Luna", "Ibarra", "Correa", "Ledesma", "Villalba", "Godoy", "Bustos"];
const CLASS_TIMES = ["06:00", "07:00", "08:00", "09:00", "10:00", "12:00", "17:00", "18:00", "18:00", "19:00", "19:00", "20:00"];
const PLAN_MIX = ["8", "8", "12", "12", "12", "16", "16", "libre", "libre", "semestral", "anual", "12"];
const METHODS: PaymentMethod[] = ["transferencia", "transferencia", "efectivo", "tarjeta"];
const EXTRA_MEMBERS = 58;

/** Socios de la demo: los 12 con nombre propio más ~60 generados, para que el box se vea con vida. */
function chiaMemberDefs(): ChiaMemberDef[] {
  const rnd = seededRandom(1987);
  const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];
  const extra: ChiaMemberDef[] = [];
  for (let i = 0; i < EXTRA_MEMBERS; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 7 + 3) % LAST_NAMES.length];
    const plan = pick(PLAN_MIX);
    const months = CHIA_PLANS.find((p) => p.key === plan)?.months ?? 1;
    const t1 = pick(CLASS_TIMES);
    let t2 = pick(CLASS_TIMES);
    if (t2 === t1) t2 = CLASS_TIMES[(CLASS_TIMES.indexOf(t1) + 1) % CLASS_TIMES.length];
    extra.push({
      name: `${first} ${last}`,
      email: `${slugify(first)}.${slugify(last)}${i}@ejemplo.com`,
      plan,
      times: [t1, t2],
      startedDaysAgo: Math.floor(rnd() * 28 * months),
      method: pick(METHODS),
      joinedDaysAgo: rnd() < 0.08 ? Math.floor(rnd() * 20) : 30 + Math.floor(rnd() * 700),
    });
  }
  return [...CHIA_MEMBERS.map((m, i) => ({ ...m, joinedDaysAgo: m.joinedDaysAgo ?? 40 + i * 37 })), ...extra];
}

function createChiaTenant(): SeedResult {
  const tenant = tenantsRepo.create({
    name: CHIA.name,
    slug: slugify(CHIA.name),
    brandColor: CHIA.brandColor,
    themeId: CHIA.themeId,
    status: "active",
    settings: { cancellationWindowHours: 2, enabledModules: DEFAULT_MODULES, currency: "ARS" },
  });
  const owner = createUserInTenant(tenant.id, { ...CHIA.owner, role: "admin" });
  const coaches = CHIA.coaches.map((c) => createUserInTenant(tenant.id, { name: c.name, email: c.email, role: "coach" }));
  const defs = chiaMemberDefs();
  const members = defs.map((m) => createUserInTenant(tenant.id, { name: m.name, email: m.email, role: "member" }));
  // Fecha de alta realista: la mayoría son socios de hace meses.
  const usersRepo = usersRepoFor(tenant.id);
  const joined = new Map(members.map((u, i) => [u.id, addDays(new Date(), -(defs[i].joinedDaysAgo ?? 60)).toISOString()]));
  usersRepo.replaceAll(usersRepo.list().map((u) => (joined.has(u.id) ? { ...u, createdAt: joined.get(u.id)! } : u)));

  const exercisesRepo = exercisesRepoFor(tenant.id);
  DEFAULT_EXERCISES.forEach((d) => exercisesRepo.create({ tenantId: tenant.id, isCustom: false, ...d }));

  return { tenant, owner, coaches, members, users: [owner, ...coaches, ...members] };
}

/** Auto-seed: super admin de Kinflow + gimnasio de demo Chia Training. Idempotente. */
export function bootstrapDemoIfNeeded(): void {
  if (get<boolean>(DEMO_CLEARED_KEY, false)) return;
  const seeded = get<boolean>(SEEDED_KEY, false);
  const version = get<number>(DEMO_VERSION_KEY, seeded ? 1 : 0);
  if (seeded && version >= DEMO_VERSION) return;
  if (seeded) removeOldDemo();

  // Ejecuta el trabajo asíncrono (hash de passwords). No bloquea la UI:
  // los datos aparecen tras el primer tick y las páginas usan useDataVersion.
  void seedAsync();
}

/** Borra los boxes de la demo anterior sin tocar boxes creados por la persona. */
function removeOldDemo(): void {
  const old = tenantsRepo.list().filter((t) => OLD_DEMO_SLUGS.includes(t.slug));
  if (isBrowser()) {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && old.some((t) => k.startsWith(buildKey(t.id, "")))) keys.push(k);
    }
    keys.forEach((k) => remove(k));
  }
  old.forEach((t) => tenantsRepo.remove(t.id));

  const session = sessionStore.read();
  if (session && old.some((t) => t.id === session.tenantId)) sessionStore.clear();

  const admins = superAdminsStore.list();
  const keptAdmins = admins.filter((a) => !OLD_SUPERADMIN_EMAILS.includes(a.email));
  if (keptAdmins.length !== admins.length) {
    set(buildKey(null, "superadmins"), keptAdmins);
    const superSession = superSessionStore.read();
    if (superSession && !keptAdmins.some((a) => a.id === superSession.superAdminId)) superSessionStore.clear();
  }
}

async function seedAsync(): Promise<void> {
  const demoHash = await hashPassword("demo1234");

  // Super admin de la plataforma (vos, como dueña de Kinflow)
  if (!superAdminsStore.list().some((a) => a.email === "admin@kinflow.app")) {
    superAdminsStore.create({
      name: "Celeste · Kinflow",
      email: "admin@kinflow.app",
      passwordHash: demoHash,
    });
  }

  if (!tenantsRepo.list().some((t) => t.slug === slugify(CHIA.name))) {
    const chia = createChiaTenant();
    applyPasswordToUsers(chia.tenant.id, demoHash);
    seedClassesFor(chia);
    seedPRsFor(chia);
    seedFeedFor(chia);
    seedWodsFor(chia);
    seedNotificationsFor(chia);
    seedChallengesFor(chia);
    seedProgramsFor(chia);
    seedShopFor(chia);
    seedHealthFor(chia);
    // Invitación de demo pendiente
    createInvitation({
      tenantId: chia.tenant.id,
      invitedBy: chia.owner.id,
      role: "member",
      email: "invitado@ejemplo.com",
    });
  }

  set(SEEDED_KEY, true);
  set(DEMO_VERSION_KEY, DEMO_VERSION);
  notifyDataChanged();
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

interface PRSeed {
  name: string;
  values: Array<{ daysAgo: number; value: number; rx?: boolean }>;
}

function seedPRsFor({ tenant, members, coaches }: SeedResult) {
  const exercisesRepo = exercisesRepoFor(tenant.id);
  const prsRepo = personalRecordsRepoFor(tenant.id);
  const allExercises: Exercise[] = exercisesRepo.list();
  const byName = new Map(allExercises.map((e) => [e.name, e]));
  const today = new Date();

  const sets: Array<[User | undefined, PRSeed[]]> = [
    [members[0], [
      { name: "Back Squat", values: [{ daysAgo: 180, value: 60 }, { daysAgo: 120, value: 67.5 }, { daysAgo: 60, value: 72.5 }, { daysAgo: 15, value: 77.5 }] },
      { name: "Deadlift", values: [{ daysAgo: 200, value: 80 }, { daysAgo: 90, value: 92.5 }, { daysAgo: 20, value: 100 }] },
      { name: "Fran", values: [{ daysAgo: 120, value: 9 * 60 + 10 }, { daysAgo: 40, value: 7 * 60 + 25, rx: false }] },
      { name: "Run 5K", values: [{ daysAgo: 150, value: 29 * 60 + 40 }, { daysAgo: 30, value: 26 * 60 + 55 }] },
    ]],
    [members[1], [
      { name: "Back Squat", values: [{ daysAgo: 240, value: 100 }, { daysAgo: 150, value: 115 }, { daysAgo: 60, value: 127.5 }, { daysAgo: 5, value: 135 }] },
      { name: "Clean & Jerk", values: [{ daysAgo: 200, value: 75 }, { daysAgo: 90, value: 87.5 }, { daysAgo: 20, value: 95 }] },
      { name: "Fran", values: [{ daysAgo: 150, value: 5 * 60 + 40 }, { daysAgo: 60, value: 4 * 60 + 50 }, { daysAgo: 20, value: 4 * 60 + 22 }] },
      { name: "Murph", values: [{ daysAgo: 200, value: 56 * 60 }, { daysAgo: 30, value: 49 * 60 + 15 }] },
    ]],
    [members[4], [
      { name: "Snatch", values: [{ daysAgo: 150, value: 32.5 }, { daysAgo: 60, value: 40 }, { daysAgo: 10, value: 42.5 }] },
      { name: "Pull-ups max", values: [{ daysAgo: 90, value: 4 }, { daysAgo: 30, value: 9 }] },
    ]],
    [members[3], [
      { name: "Deadlift", values: [{ daysAgo: 120, value: 140 }, { daysAgo: 25, value: 152.5 }] },
      { name: "Back Squat", values: [{ daysAgo: 100, value: 110 }, { daysAgo: 12, value: 120 }] },
    ]],
    [coaches[0], [
      { name: "Snatch", values: [{ daysAgo: 100, value: 85 }, { daysAgo: 30, value: 90 }] },
      { name: "Back Squat", values: [{ daysAgo: 120, value: 150 }, { daysAgo: 20, value: 160 }] },
    ]],
  ];

  for (const [user, prs] of sets) {
    if (!user) continue;
    for (const s of prs) {
      const ex = byName.get(s.name);
      if (!ex) continue;
      for (const v of s.values) {
        prsRepo.create({
          tenantId: tenant.id,
          userId: user.id,
          exerciseId: ex.id,
          value: v.value,
          rx: v.rx ?? true,
          date: toDateKey(addDays(today, -v.daysAgo)),
        });
      }
    }
  }
}

function seedFeedFor({ tenant, owner }: SeedResult) {
  const postsRepo = postsRepoFor(tenant.id);
  const today = new Date();

  const items: Array<{ type: PostType; title: string; content: string; pinned?: boolean; daysAgo: number }> = [
    { type: "wod", title: "WOD del día: Fran", content: "21-15-9 de Thrusters (43/30 kg) y Pull-ups. RX si vas al peso; si no, escalamos con banda o anillas. ¡A romperla!", pinned: true, daysAgo: 0 },
    { type: "aviso", title: "Feriado del lunes: horario especial", content: "El lunes abrimos de 9 a 13 con CrossFit a las 9, Funcional a las 10 y Open Box de 11 a 13. El martes volvemos al horario de siempre.", daysAgo: 1 },
    { type: "aviso", title: "Nuevo Open Box de mediodía", content: "Sumamos Open Box de 12 a 14 de lunes a viernes para que entrenes a tu ritmo. Reservá tu lugar desde la app.", daysAgo: 3 },
    { type: "consejo", title: "Movilidad: 10 minutos que cambian tu sentadilla", content: "1) 2 min de tobillo contra la pared. 2) 2 min de 90/90 de cadera. 3) 2 min de sentadilla profunda con apoyo. 4) 2 min de apertura torácica. 5) 2 min de hombros con banda. Hacelo antes de cada clase de Halterofilia.", daysAgo: 5 },
    { type: "receta", title: "Licuado post entreno", content: "300 ml de leche, 1 banana, 2 cucharadas de avena, 1 cucharada de mantequilla de maní y canela. Licuá y tomalo dentro de la media hora después del WOD.", daysAgo: 8 },
    { type: "wod", title: "Benchmark del mes: Cindy", content: "AMRAP 20 min: 5 pull-ups, 10 push-ups, 15 air squats. Anotá tus rondas en la app para el ranking del mes.", daysAgo: 12 },
  ];

  items.forEach((it) => {
    const post = postsRepo.create({
      tenantId: tenant.id,
      authorId: owner.id,
      type: it.type,
      title: it.title,
      content: it.content,
      pinned: it.pinned ?? false,
    });
    const target = addDays(today, -it.daysAgo);
    postsRepo.replaceAll(postsRepo.list().map((p) => (p.id === post.id ? { ...p, createdAt: target.toISOString() } : p)));
  });
}

function seedClassesFor({ tenant, coaches, members }: SeedResult) {
  const templatesRepo = classTemplatesRepoFor(tenant.id);
  const sessionsRepo = classSessionsRepoFor(tenant.id);
  const bookingsRepo = bookingsRepoFor(tenant.id);
  const checkinsRepo = checkinsRepoFor(tenant.id);
  const plansRepo = membershipPlansRepoFor(tenant.id);
  const membershipsRepo = membershipsRepoFor(tenant.id);
  const paymentsRepo = paymentsRepoFor(tenant.id);
  const [lucas, ana, paula] = coaches;
  const today = new Date();
  const rnd = seededRandom(2026);

  // Planes
  const plans = new Map<string, MembershipPlan>();
  for (const p of CHIA_PLANS) {
    plans.set(
      p.key,
      plansRepo.create({
        tenantId: tenant.id,
        name: p.name,
        priceMonthly: p.price,
        type: p.type,
        creditsPerMonth: p.credits,
        durationMonths: p.months ?? 1,
        active: true,
      }),
    );
  }

  const defs = chiaMemberDefs();

  // Membresías y pagos
  defs.forEach((def, i) => {
    const user = members[i];
    const planDef = CHIA_PLANS.find((p) => p.key === def.plan);
    const plan = plans.get(def.plan);
    if (!user || !plan || !planDef) return;
    const months = planDef.months ?? 1;
    const start = addDays(today, -def.startedDaysAgo);
    const membership = membershipsRepo.create({
      tenantId: tenant.id,
      userId: user.id,
      planId: plan.id,
      startDate: toDateKey(start),
      endDate: toDateKey(addMonths(start, months)),
      status: "active",
      creditsRemaining: plan.type === "credits" ? Math.max(1, Math.round((plan.creditsPerMonth ?? 0) * (1 - def.startedDaysAgo / 30))) : undefined,
    });
    // Pago del período actual y, en los mensuales, los anteriores desde que se hizo socio (hasta 6)
    const periods = months === 1 ? Math.max(1, Math.min(6, Math.ceil((def.joinedDaysAgo ?? 30) / 30))) : 1;
    for (let k = 0; k < periods; k++) {
      paymentsRepo.create({
        tenantId: tenant.id,
        userId: user.id,
        membershipId: membership.id,
        amount: plan.priceMonthly,
        method: def.method,
        date: toDateKey(addMonths(start, -k)),
        notes: k === 0 ? (months === 1 ? "Cuota del mes" : `Pago ${planDef.name}`) : "Cuota del mes",
      });
    }
  });

  // Plantillas de clase
  const tpl = {
    crossfit: templatesRepo.create({ tenantId: tenant.id, name: "CrossFit", type: "wod", durationMinutes: 60, defaultCapacity: 14, defaultCoachId: lucas?.id, color: "#A3226E" }),
    funcional: templatesRepo.create({ tenantId: tenant.id, name: "Funcional", type: "funcional", durationMinutes: 60, defaultCapacity: 16, defaultCoachId: paula?.id, color: "#F2D04A" }),
    halterofilia: templatesRepo.create({ tenantId: tenant.id, name: "Halterofilia", type: "halterofilia", durationMinutes: 60, defaultCapacity: 8, defaultCoachId: ana?.id, color: "#14B8A6" }),
    openBox: templatesRepo.create({ tenantId: tenant.id, name: "Open Box", type: "open_box", durationMinutes: 120, defaultCapacity: 10, color: "#64748B" }),
    movilidad: templatesRepo.create({ tenantId: tenant.id, name: "Movilidad", type: "movilidad", durationMinutes: 60, defaultCapacity: 12, defaultCoachId: paula?.id, color: "#22C55E" }),
  };

  // Horario: lunes a viernes de 6 a 21, sábados de 9 a 13.
  type Slot = { time: string; t: ClassTemplate; coach?: User; minutes?: number };
  const weekday = (d: number): Slot[] => {
    const monWedFri = d === 0 || d === 2 || d === 4;
    const slots: Slot[] = [
      { time: "06:00", t: tpl.crossfit, coach: lucas },
      { time: "07:00", t: tpl.crossfit, coach: lucas },
      { time: "08:00", t: tpl.funcional, coach: paula },
      { time: "09:00", t: tpl.crossfit, coach: ana },
      monWedFri ? { time: "10:00", t: tpl.movilidad, coach: paula } : { time: "10:00", t: tpl.halterofilia, coach: ana },
      { time: "12:00", t: tpl.openBox },
      { time: "17:00", t: tpl.funcional, coach: paula },
      { time: "18:00", t: tpl.crossfit, coach: lucas },
      { time: "19:00", t: tpl.crossfit, coach: ana },
    ];
    if (d === 0 || d === 2) slots.push({ time: "20:00", t: tpl.halterofilia, coach: lucas });
    else if (d === 1 || d === 3) slots.push({ time: "20:00", t: tpl.movilidad, coach: paula });
    else slots.push({ time: "20:00", t: tpl.openBox, minutes: 60 });
    return slots;
  };
  const saturday: Slot[] = [
    { time: "09:00", t: tpl.crossfit, coach: lucas },
    { time: "10:00", t: tpl.funcional, coach: paula },
    { time: "11:00", t: tpl.openBox },
  ];

  const weekStart = startOfWeek(today);
  for (let w = -3; w <= 2; w++) {
    for (let d = 0; d < 6; d++) {
      const day = addDays(weekStart, w * 7 + d);
      for (const slot of d === 5 ? saturday : weekday(d)) {
        sessionsRepo.create({
          tenantId: tenant.id,
          templateId: slot.t.id,
          date: toDateKey(day),
          startTime: slot.time,
          durationMinutes: slot.minutes ?? slot.t.durationMinutes,
          capacity: slot.t.defaultCapacity,
          coachId: slot.coach?.id ?? slot.t.defaultCoachId,
          status: "scheduled",
        });
      }
    }
  }

  // Reservas: cada socio va según su plan, en sus horarios preferidos.
  const sessions = sessionsRepo.list();
  const booked = new Map<string, number>();
  const from = addDays(today, -21);
  const until = addDays(today, 6);
  defs.forEach((def, i) => {
    const user = members[i];
    const perWeek = CHIA_PLANS.find((p) => p.key === def.plan)?.perWeek ?? 2;
    if (!user) return;
    const byWeek = new Map<string, number>();
    // Orden mezclado para repartir las reservas en toda la semana, no solo al principio
    const order = sessions.map((s) => ({ s, k: rnd() })).sort((a, b) => a.k - b.k).map((x) => x.s);
    for (const s of order) {
      const when = new Date(s.date + "T" + s.startTime + ":00");
      if (when < from || when > until) continue;
      if (!def.times.includes(s.startTime)) continue;
      const wk = toDateKey(startOfWeek(when));
      if ((byWeek.get(wk) ?? 0) >= perWeek) continue;
      if (rnd() < 0.35) continue;
      const count = booked.get(s.id) ?? 0;
      if (count >= s.capacity) continue;
      const bk = bookingsRepo.create({ tenantId: tenant.id, sessionId: s.id, userId: user.id, status: "confirmed" });
      booked.set(s.id, count + 1);
      byWeek.set(wk, (byWeek.get(wk) ?? 0) + 1);
      if (when < today) {
        checkinsRepo.create({ tenantId: tenant.id, bookingId: bk.id, sessionId: s.id, userId: user.id, checkedInAt: when.toISOString() });
      }
    }
  });
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

function seedNotificationsFor({ tenant, members }: SeedResult) {
  const repo = notificationsRepoFor(tenant.id);
  const [ana, diego] = members;
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
    mk(ana.id, "membership_expiring", "Tu plan vence pronto", "Tu plan de 12 clases vence en 6 días.", "/dashboard", 60 * 6);
    mk(ana.id, "waitlist_promoted", "¡Saliste de la lista de espera!", "CrossFit · mañana a las 19:00", "/reservas", 60 * 26, true);
  }
  if (diego) {
    mk(diego.id, "new_post", "Nuevo WOD publicado", "Fran · WOD del día", "/feed", 30);
    mk(diego.id, "session_cancelled", "Clase cancelada", "Se canceló el CrossFit del jueves a las 07:00.", "/reservas", 60 * 12);
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

function seedChallengesFor({ tenant, members }: SeedResult) {
  const chRepo = challengesRepoFor(tenant.id);
  const partsRepo = challengeParticipantsRepoFor(tenant.id);
  const exRepo = exercisesRepoFor(tenant.id);
  const [ana, diego] = members;
  const today = new Date();
  const start = toDateKey(addDays(today, -10));
  const end = toDateKey(addDays(today, 20));

  const c1 = chRepo.create({
    tenantId: tenant.id,
    title: "12 clases este mes",
    description: "Vení al box 12 veces durante el reto y llevate la insignia.",
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
      description: "Registrá tu mejor Fran, RX o escalado, durante el reto.",
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
  const ana = users.find((u) => u.role === "member");
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

function seedShopFor({ tenant, members }: SeedResult) {
  const pRepo = productsRepoFor(tenant.id);
  const items = [
    { name: "Remera Chia", description: "Remera técnica con logo, talles S a XL.", price: 25000, category: "ropa" as const, stock: 30 },
    { name: "Muñequeras", description: "Par de muñequeras negras.", price: 12000, category: "accesorios" as const, stock: 20 },
    { name: "Magnesio líquido", description: "Frasco de 250 ml.", price: 9000, category: "accesorios" as const, stock: 15 },
    { name: "Proteína whey 1 kg", description: "Sabor chocolate.", price: 45000, category: "suplementacion" as const, stock: 10 },
    { name: "Botella 750 ml", description: "Botella de acero inoxidable.", price: 15000, category: "accesorios" as const, stock: 8 },
    { name: "Buzo Chia", description: "Buzo negro con logo bordado.", price: 55000, category: "ropa" as const, stock: 12 },
  ];
  const created = items.map((it) => pRepo.create({ tenantId: tenant.id, ...it, imageUrl: undefined, active: true }));
  const [ana, diego] = members;
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

function seedHealthFor({ tenant, members }: SeedResult) {
  const ana = members[0];
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
