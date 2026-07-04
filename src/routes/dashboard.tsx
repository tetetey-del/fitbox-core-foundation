import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight, Calendar, TrendingUp, Users, UserPlus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion } from "@/lib/data-bus";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { bookingsRepo } from "@/lib/storage/repositories/bookings.repo";
import { toDateKey, formatDate, daysBetween, parseDateKey } from "@/lib/date";
import { SessionCard } from "@/components/classes/SessionCard";
import { RoleGate } from "@/components/RoleGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MembershipBadge } from "@/components/members/MembershipBadge";
import { CreditsBadge } from "@/components/members/CreditsBadge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  getActiveMembership,
  getMembershipStatus,
  getPlan,
} from "@/lib/services/membership.service";
import {
  getExpiringMemberships,
  getMonthlyKpis,
  getMonthlyRevenue,
  getOccupancyByWeekday,
} from "@/lib/services/analytics.service";
import { getLastPRs } from "@/lib/services/prs.service";
import { formatMoney, formatMonthShort, formatPrValue } from "@/lib/format";
import { FeedWidget } from "@/components/dashboard/FeedWidget";
import { useModules } from "@/hooks/useModules";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { currentUser, currentTenant, tenantUsers } = useAuth();
  const navigate = useNavigate();
  useDataVersion();
  const modules = useModules();

  const templates = useMemo(() => classTemplatesRepo.list(), []);
  const templateById = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates]);
  const userById = useMemo(() => new Map(tenantUsers.map((u) => [u.id, u])), [tenantUsers]);

  const today = toDateKey(new Date());
  const todaySessions = classSessionsRepo
    .query({ date: today })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const isAdmin = currentUser?.role === "admin";
  const isMember = currentUser?.role === "member";
  const isCoach = currentUser?.role === "coach";

  const membership = isMember && currentUser ? getActiveMembership(currentUser.id) : null;
  const membershipStatus = isMember && currentUser ? getMembershipStatus(currentUser.id) : null;
  const plan = membership ? getPlan(membership.planId) : null;
  const daysToExpire = membership ? daysBetween(new Date(), parseDateKey(membership.endDate)) : null;

  return (
    <AppLayout>
      <PageHeader
        title={`Hola, ${currentUser?.name.split(" ")[0] ?? ""}`}
        description={`Panel de ${currentTenant?.name}`}
      />

      {modules.feed && (
        <div className="mb-6 max-w-2xl">
          <FeedWidget />
        </div>
      )}

      {isMember && membershipStatus === "expiring_soon" && membership && plan && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" strokeWidth={1.5} />
          <div className="text-sm">
            <div className="font-medium text-amber-100">Tu plan expira pronto</div>
            <div className="text-amber-200/80 text-xs mt-0.5">
              {plan.name} · caduca en {daysToExpire} día{daysToExpire === 1 ? "" : "s"} ({formatDate(membership.endDate)}).
              Habla con el box para renovarlo.
            </div>
          </div>
        </div>
      )}

      {isMember && membershipStatus === "none" && (
        <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4 text-sm">
          Aún no tienes ningún plan activo. Pide al box que te asigne uno para poder reservar.
        </div>
      )}

      {isAdmin && <OwnerDashboard />}
      {isCoach && (
        <CoachOrOwnerToday
          sessions={todaySessions}
          templateById={templateById}
          userById={userById}
          onOpenAgenda={() => navigate({ to: "/reservas" })}
        />
      )}
      {isMember && currentUser && (
        <MemberDashboard
          userId={currentUser.id}
          membership={membership}
          membershipStatus={membershipStatus}
          plan={plan}
        />
      )}
    </AppLayout>
  );
}

// ---- Owner ----

function OwnerDashboard() {
  useDataVersion();
  const kpis = useMemo(() => getMonthlyKpis(), []);
  const revenue = useMemo(() => getMonthlyRevenue(6), []);
  const occupancy = useMemo(() => getOccupancyByWeekday(4), []);
  const expiring = useMemo(() => getExpiringMemberships(7), []);

  const revenueData = revenue.map((r) => ({ ...r, label: formatMonthShort(r.month) }));

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ingresos del mes"
          value={formatMoney(kpis.revenue)}
          icon={<TrendingUp className="h-4 w-4" strokeWidth={1.5} />}
        />
        <KpiCard
          label="Socios activos"
          value={kpis.activeMembers}
          icon={<Users className="h-4 w-4" strokeWidth={1.5} />}
        />
        <KpiCard
          label="Altas del mes"
          value={kpis.newMembersThisMonth}
          icon={<UserPlus className="h-4 w-4" strokeWidth={1.5} />}
        />
        <KpiCard
          label="Asistencias del mes"
          value={kpis.attendancesThisMonth}
          icon={<Calendar className="h-4 w-4" strokeWidth={1.5} />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium mb-1">Ingresos por mes</h3>
          <p className="text-xs text-muted-foreground mb-4">Últimos 6 meses</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [formatMoney(v), "Ingresos"]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium mb-1">Ocupación media por día</h3>
          <p className="text-xs text-muted-foreground mb-4">Últimas 4 semanas · % del aforo</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="weekday" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v}%`, "Ocupación"]}
                />
                <Bar dataKey="occupancy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium">Membresías que expiran pronto</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Próximos 7 días</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/socios">Ver socios <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} /></Link>
          </Button>
        </div>
        {expiring.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay membresías próximas a expirar.</p>
        ) : (
          <div className="divide-y divide-border">
            {expiring.map((e) => (
              <div key={e.userId} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium">{e.userName}</div>
                  <div className="text-xs text-muted-foreground">Caduca {formatDate(e.endDate)}</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {e.daysLeft === 0 ? "Hoy" : `${e.daysLeft} día${e.daysLeft === 1 ? "" : "s"}`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Coach ----

interface CoachOrOwnerTodayProps {
  sessions: import("@/types").ClassSession[];
  templateById: Map<string, import("@/types").ClassTemplate>;
  userById: Map<string, import("@/types").User>;
  onOpenAgenda: () => void;
}


function CoachOrOwnerToday({ sessions, templateById, userById, onOpenAgenda }: CoachOrOwnerTodayProps) {
  return (
    <RoleGate allowed={["admin", "coach"]}>
      <section className="mt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Clases de hoy</h2>
          <Button variant="ghost" size="sm" onClick={onOpenAgenda}>
            Ver calendario
            <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
          </Button>
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin clases programadas hoy.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                template={templateById.get(s.templateId)}
                coach={s.coachId ? userById.get(s.coachId) : undefined}
                onClick={onOpenAgenda}
              />
            ))}
          </div>

        )}
      </section>
    </RoleGate>
  );
}

// ---- Member ----

interface MemberDashboardProps {
  userId: string;
  membership: ReturnType<typeof getActiveMembership>;
  membershipStatus: ReturnType<typeof getMembershipStatus> | null;
  plan: ReturnType<typeof getPlan>;
}

function MemberDashboard({ userId, membership, membershipStatus, plan }: MemberDashboardProps) {
  useDataVersion();
  const now = new Date();
  const upcoming = useMemo(() => {
    const nowKey = toDateKey(now);
    const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return bookingsRepo
      .query({ userId })
      .filter((b) => b.status === "confirmed" || b.status === "waitlist")
      .map((b) => ({ b, s: classSessionsRepo.getById(b.sessionId) }))
      .filter((x): x is { b: typeof x.b; s: NonNullable<typeof x.s> } => !!x.s && x.s.status !== "cancelled")
      .filter(({ s }) => s.date > nowKey || (s.date === nowKey && s.startTime >= nowTime))
      .sort((a, b) => (a.s.date + a.s.startTime).localeCompare(b.s.date + b.s.startTime))
      .slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const lastPRs = useMemo(() => getLastPRs(userId, 3), [userId]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Mi membresía</div>
          {membership ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-medium">{plan?.name ?? "—"}</span>
                {membershipStatus && <MembershipBadge status={membershipStatus} />}
                <CreditsBadge userId={userId} />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Vigencia: {formatDate(membership.startDate)} → {formatDate(membership.endDate)}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sin plan activo.</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Últimos PRs</div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/prs">Ver todos <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} /></Link>
            </Button>
          </div>
          {lastPRs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no has registrado PRs.</p>
          ) : (
            <div className="space-y-2">
              {lastPRs.map(({ pr, exercise }) => (
                <div key={pr.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{exercise.name}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(pr.date)}</div>
                  </div>
                  <div className="font-mono">{formatPrValue(pr.value, exercise.unit)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Mis próximas reservas</h3>
          <Button asChild variant="ghost" size="sm">
            <Link to="/reservas">Reservar <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} /></Link>
          </Button>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes reservas próximas.</p>
        ) : (
          <div className="divide-y divide-border">
            {upcoming.map(({ b, s }) => (
              <div key={b.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium">{formatDate(s.date)} · {s.startTime}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.status === "waitlist" ? `Lista de espera · #${b.position ?? "?"}` : "Confirmada"}
                  </div>
                </div>
                <Badge variant={b.status === "waitlist" ? "outline" : "default"} className="text-[10px]">
                  {b.status === "waitlist" ? "Espera" : "OK"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
