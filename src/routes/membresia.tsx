import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BadgeCheck, CalendarClock, Receipt, Ticket } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { MembershipBadge } from "@/components/members/MembershipBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion } from "@/lib/data-bus";
import { getActiveMembership, getMembershipStatus, getPlan } from "@/lib/services/membership.service";
import { paymentsRepo } from "@/lib/storage/repositories/payments.repo";
import { membershipPlansRepo } from "@/lib/storage/repositories/membershipPlans.repo";
import { daysBetween, formatDate, parseDateKey } from "@/lib/date";
import { formatMoney, formatPlanPrice } from "@/lib/format";
import { PAYMENT_METHOD_LABEL, PLAN_DURATION_LABEL } from "@/types";

export const Route = createFileRoute("/membresia")({
  head: () => ({ meta: [{ title: "Mi membresía — Kinflow" }] }),
  component: MembershipPage,
});

/** Membresía del socio: su plan, cuántas clases le quedan, hasta cuándo, sus pagos y los planes del box. */
function MembershipPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  useDataVersion();

  useEffect(() => {
    if (currentUser && currentUser.role !== "member") navigate({ to: "/dashboard" });
  }, [currentUser, navigate]);

  if (!currentUser) return <AppLayout>{null}</AppLayout>;

  const membership = getActiveMembership(currentUser.id);
  const plan = membership ? getPlan(membership.planId) : null;
  const status = getMembershipStatus(currentUser.id);
  const payments = paymentsRepo
    .query({ userId: currentUser.id })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12);
  const plans = membershipPlansRepo.list().filter((p) => p.active);

  const total = plan?.type === "credits" ? plan.creditsPerMonth ?? 0 : 0;
  const left = membership?.creditsRemaining ?? 0;
  const daysLeft = membership ? daysBetween(new Date(), parseDateKey(membership.endDate)) : 0;

  return (
    <AppLayout>
      <PageHeader title="Mi membresía" description="Tu plan, tus clases y tus pagos." />

      <div className="grid gap-5 max-w-2xl">
        {/* Plan actual, con el color del box */}
        <section
          className="relative overflow-hidden rounded-2xl p-5 text-white"
          style={{ background: "linear-gradient(135deg, var(--brand), color-mix(in srgb, var(--brand) 45%, #0E2A3A))" }}
        >
          <BadgeCheck className="absolute -right-4 -top-4 h-28 w-28 opacity-15" strokeWidth={1.25} aria-hidden />
          {membership && plan ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider opacity-80">Tu plan</span>
                <MembershipBadge status={status} />
              </div>
              <div className="mt-1 text-2xl font-semibold">{plan.name}</div>
              {plan.type === "credits" ? (
                <div className="mt-4">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-bold leading-none">{left}</span>
                    <span className="pb-1 text-sm opacity-90">
                      {left === 1 ? "clase disponible" : "clases disponibles"}
                      {total > 0 && ` de ${total}`}
                    </span>
                  </div>
                  {total > 0 && (
                    <div className="mt-3 h-2 rounded-full bg-white/25">
                      <div
                        className="h-2 rounded-full bg-white"
                        style={{ width: `${Math.min(100, Math.round((left / total) * 100))}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 text-lg font-medium">Clases ilimitadas</div>
              )}
              <div className="mt-4 flex items-center gap-2 text-sm opacity-95">
                <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
                Vigente hasta el {formatDate(membership.endDate)}
                {daysLeft >= 0 && ` · ${daysLeft === 0 ? "vence hoy" : daysLeft === 1 ? "queda 1 día" : `quedan ${daysLeft} días`}`}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs uppercase tracking-wider opacity-80">Tu plan</div>
              <div className="mt-1 text-xl font-semibold">Todavía no tienes un plan activo</div>
              <p className="mt-2 text-sm opacity-90">Habla con tu box para elegir uno y empezar a reservar clases.</p>
            </>
          )}
        </section>

        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link to="/reservas">Reservar una clase</Link>
          </Button>
        </div>

        {/* Pagos */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Receipt className="h-4 w-4" strokeWidth={1.75} style={{ color: "var(--brand)" }} />
            Mis pagos
          </h2>
          {payments.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Todavía no hay pagos registrados.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{formatMoney(p.amount)}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {formatDate(p.date)} · {PAYMENT_METHOD_LABEL[p.method] ?? p.method}
                      {p.notes ? ` · ${p.notes}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Planes del box */}
        {plans.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Ticket className="h-4 w-4" strokeWidth={1.75} style={{ color: "var(--brand)" }} />
              Planes del box
            </h2>
            <ul className="mt-2 divide-y divide-border">
              {plans.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className={p.id === plan?.id ? "font-semibold" : "font-medium"}>
                      {p.name}
                      {p.id === plan?.id && (
                        <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ backgroundColor: "var(--brand)", color: "var(--primary-foreground)" }}>
                          Tu plan
                        </span>
                      )}
                    </div>
                    {p.durationMonths && p.durationMonths > 1 && (
                      <div className="text-xs text-muted-foreground">{PLAN_DURATION_LABEL[p.durationMonths] ?? `${p.durationMonths} meses`}</div>
                    )}
                  </div>
                  <div className="shrink-0 font-medium">{formatPlanPrice(p.priceMonthly)}</div>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Para cambiar de plan o renovarlo, habla con tu box.</p>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
