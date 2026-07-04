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
import { DEFAULT_EXERCISES } from "./services/prs.service";
import { addDays, addMonths, startOfWeek, toDateKey } from "./date";
import type { ClassTemplate, ClassType, Exercise, MembershipPlan, Tenant, User } from "@/types";


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
  extras?: boolean;
}): SeedResult {
  const tenant = tenantsRepo.create({
    name: input.name,
    slug: slugify(input.name),
    brandColor: input.brandColor,
    settings: { cancellationWindowHours: 2 },
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

  // Catálogo de ejercicios por defecto
  const exercisesRepo = exercisesRepoFor(tenant.id);
  DEFAULT_EXERCISES.forEach((d) => exercisesRepo.create({ tenantId: tenant.id, isCustom: false, ...d }));

  return { tenant, owner, users: [owner, ...extras] };
}


/** Seed completo: box, usuarios, plantillas, sesiones y algunas reservas. */
export function loadDemoData(): SeedResult {
  const base = createTenantWithSeed({
    name: "CrossFit Norte",
    ownerName: "Sergio Torres",
    ownerEmail: "sergio@crossfitnorte.com",
    brandColor: "#F97316",
  });

  seedClassesFor(base);
  seedPRsFor(base);
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
    { name: "Front Squat", values: [{ daysAgo: 180, value: 90 }, { daysAgo: 60, value: 105 }, { daysAgo: 10, value: 110 }] },
    { name: "Clean & Jerk", values: [{ daysAgo: 200, value: 80 }, { daysAgo: 90, value: 92 }, { daysAgo: 20, value: 100 }] },
    { name: "Snatch", values: [{ daysAgo: 180, value: 60 }, { daysAgo: 60, value: 72 }, { daysAgo: 15, value: 78 }] },
    { name: "Fran", values: [{ daysAgo: 150, value: 5 * 60 + 20 }, { daysAgo: 60, value: 4 * 60 + 40 }, { daysAgo: 20, value: 4 * 60 + 12 }] },
    { name: "Grace", values: [{ daysAgo: 90, value: 3 * 60 + 30 }, { daysAgo: 20, value: 3 * 60 + 5 }] },
    { name: "Murph", values: [{ daysAgo: 200, value: 55 * 60 }, { daysAgo: 30, value: 48 * 60 + 30 }] },
    { name: "Cindy", values: [{ daysAgo: 120, value: 16 }, { daysAgo: 30, value: 21 }] },
    { name: "HSPU max", values: [{ daysAgo: 120, value: 6 }, { daysAgo: 20, value: 12 }] },
  ];
  const lauraSets: PRSeed[] = [
    { name: "Back Squat", values: [{ daysAgo: 120, value: 95 }, { daysAgo: 20, value: 105 }] },
    { name: "Snatch", values: [{ daysAgo: 100, value: 55 }, { daysAgo: 30, value: 60 }] },
    { name: "Fran", values: [{ daysAgo: 90, value: 4 * 60 + 55 }, { daysAgo: 15, value: 4 * 60 + 20 }] },
    { name: "Pull-ups max", values: [{ daysAgo: 60, value: 15 }, { daysAgo: 10, value: 18 }] },
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

  // Planes de membresía
  const planDefs: Array<Omit<MembershipPlan, keyof import("@/types").BaseEntity>> = [
    { tenantId: tenant.id, name: "Ilimitado", priceMonthly: 89, type: "unlimited", active: true },
    { tenantId: tenant.id, name: "12 clases", priceMonthly: 69, type: "credits", creditsPerMonth: 12, active: true },
    { tenantId: tenant.id, name: "8 clases", priceMonthly: 55, type: "credits", creditsPerMonth: 8, active: true },
  ];
  const [planUnlimited, plan12, plan8] = planDefs.map((p) => plansRepo.create(p));

  // Membresías: Ana con 12 clases (expira pronto en 4 días), Diego con Ilimitado
  const today = new Date();
  if (ana) {
    const startAna = addDays(today, -26); // así queda a 4 días de expirar
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
    // Pagos: alta hace ~2 meses, renovación este mes
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
    paymentsRepo.create({
      tenantId: tenant.id, userId: diego.id, membershipId: membershipDiego.id,
      amount: planUnlimited.priceMonthly, method: "tarjeta",
      date: toDateKey(addDays(today, -70)), notes: "Alta Ilimitado",
    });
    paymentsRepo.create({
      tenantId: tenant.id, userId: diego.id, membershipId: membershipDiego.id,
      amount: planUnlimited.priceMonthly, method: "tarjeta",
      date: toDateKey(addDays(today, -40)), notes: "Renovación mensual",
    });
    paymentsRepo.create({
      tenantId: tenant.id, userId: diego.id, membershipId: membershipDiego.id,
      amount: planUnlimited.priceMonthly, method: "tarjeta",
      date: toDateKey(startDiego), notes: "Renovación mensual",
    });
  }

  // Pagos históricos adicionales (últimos 5 meses) para alimentar la gráfica
  // de ingresos: simulamos cuotas mensuales del box.
  for (let m = 5; m >= 2; m--) {
    const d = addMonths(today, -m);
    if (ana) paymentsRepo.create({
      tenantId: tenant.id, userId: ana.id,
      amount: plan12.priceMonthly, method: "domiciliacion",
      date: toDateKey(d), notes: "Cuota mensual",
    });
    if (diego) paymentsRepo.create({
      tenantId: tenant.id, userId: diego.id,
      amount: planUnlimited.priceMonthly, method: "tarjeta",
      date: toDateKey(d), notes: "Cuota mensual",
    });
  }

  // El plan de 8 clases queda disponible para futuros socios
  void plan8;




  const defs: Array<Omit<ClassTemplate, keyof import("@/types").BaseEntity | "tenantId">> = [
    { name: "WOD", type: "wod" as ClassType, durationMinutes: 60, defaultCapacity: 14, defaultCoachId: laura?.id, color: "#F97316" },
    { name: "Halterofilia", type: "halterofilia", durationMinutes: 75, defaultCapacity: 10, defaultCoachId: marcos?.id, color: "#3B82F6" },
    { name: "Gimnásticos", type: "gimnasticos", durationMinutes: 60, defaultCapacity: 10, defaultCoachId: laura?.id, color: "#10B981" },
    { name: "Movilidad", type: "movilidad", durationMinutes: 45, defaultCapacity: 12, defaultCoachId: marcos?.id, color: "#A855F7" },
    { name: "Open Box", type: "open_box", durationMinutes: 60, defaultCapacity: 16, color: "#64748B" },
  ];

  const templates = defs.map((d) => templatesRepo.create({ ...d, tenantId: tenant.id }));
  const wod = templates[0];
  const halt = templates[1];
  const gim = templates[2];
  const mov = templates[3];
  const open = templates[4];

  const monday = startOfWeek(new Date());
  // Semanas -3..+1 (5 semanas): pasadas para gráficas + próximas 2 para reservar
  const days = Array.from({ length: 5 * 7 }, (_, i) => addDays(monday, i - 21));


  // Horario realista L-V: 7:00, 9:30, 13:30, 17:30, 19:00. Sábado: 10:00.
  const weekdaySlots = [
    { time: "07:00", tpl: wod, coach: laura?.id },
    { time: "09:30", tpl: mov, coach: marcos?.id },
    { time: "13:30", tpl: wod, coach: marcos?.id },
    { time: "17:30", tpl: gim, coach: laura?.id },
    { time: "19:00", tpl: halt, coach: marcos?.id },
  ];
  const saturdaySlots = [{ time: "10:00", tpl: open, coach: laura?.id }];

  const created: { id: string; date: string; time: string; capacity: number }[] = [];

  for (const day of days) {
    const isoWd = (day.getDay() + 6) % 7; // 0 lun..6 dom
    if (isoWd >= 5) {
      // fin de semana
      if (isoWd === 5) {
        for (const slot of saturdaySlots) {
          const s = sessionsRepo.create({
            tenantId: tenant.id,
            templateId: slot.tpl.id,
            date: toDateKey(day),
            startTime: slot.time,
            durationMinutes: slot.tpl.durationMinutes,
            capacity: slot.tpl.defaultCapacity,
            coachId: slot.coach,
            status: "scheduled",
          });
          created.push({ id: s.id, date: s.date, time: s.startTime, capacity: s.capacity });
        }
      }
      continue;
    }
    for (const slot of weekdaySlots) {
      const s = sessionsRepo.create({
        tenantId: tenant.id,
        templateId: slot.tpl.id,
        date: toDateKey(day),
        startTime: slot.time,
        durationMinutes: slot.tpl.durationMinutes,
        capacity: slot.tpl.defaultCapacity,
        coachId: slot.coach,
        status: "scheduled",
      });
      created.push({ id: s.id, date: s.date, time: s.startTime, capacity: s.capacity });
    }
  }

  // Reservas y check-ins de ejemplo, coherentes con los créditos de Ana.
  const todayKey = toDateKey(new Date());

  let anaConfirmed = 0;
  const anaCreditCap = 7; // así deja 5/12 en el badge
  created.forEach((s, i) => {
    // Diego (Ilimitado) reserva en pasado y en las próximas sesiones
    if (diego && i % 2 === 0) {
      const b = bookingsRepo.create({
        tenantId: tenant.id,
        sessionId: s.id,
        userId: diego.id,
        status: "confirmed",
      });
      if (s.date < todayKey || (s.date === todayKey && s.time < "12:00")) {
        checkinsRepo.create({
          tenantId: tenant.id,
          bookingId: b.id,
          sessionId: s.id,
          userId: diego.id,
          checkedInAt: new Date(s.date + "T" + s.time + ":00").toISOString(),
        });
      }
    }
    // Ana (12 clases) — solo hasta llenar la cuota simulada
    if (ana && i % 3 === 1 && anaConfirmed < anaCreditCap) {
      anaConfirmed++;
      const b = bookingsRepo.create({
        tenantId: tenant.id,
        sessionId: s.id,
        userId: ana.id,
        status: "confirmed",
      });
      if (s.date < todayKey || (s.date === todayKey && s.time < "12:00")) {
        checkinsRepo.create({
          tenantId: tenant.id,
          bookingId: b.id,
          sessionId: s.id,
          userId: ana.id,
          checkedInAt: new Date(s.date + "T" + s.time + ":00").toISOString(),
        });

      }
    }
  });
}

