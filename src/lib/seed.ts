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
    role: "owner",
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
  return base;
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
  const days = Array.from({ length: 14 }, (_, i) => addDays(monday, i));

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
          checkedInAt: new Date().toISOString(),
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
          checkedInAt: new Date().toISOString(),
        });
      }
    }
  });
}

