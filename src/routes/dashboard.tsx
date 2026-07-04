import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion } from "@/lib/data-bus";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { toDateKey, formatDate, daysBetween, parseDateKey } from "@/lib/date";
import { SessionCard } from "@/components/classes/SessionCard";
import { RoleGate } from "@/components/RoleGate";
import { Button } from "@/components/ui/button";
import { MembershipBadge } from "@/components/members/MembershipBadge";
import { CreditsBadge } from "@/components/members/CreditsBadge";
import {
  getActiveMembership,
  getMembershipStatus,
  getPlan,
} from "@/lib/services/membership.service";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { currentUser, currentTenant, tenantUsers } = useAuth();
  const navigate = useNavigate();
  useDataVersion();

  const templates = useMemo(() => classTemplatesRepo.list(), []);
  const templateById = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates]);
  const userById = useMemo(() => new Map(tenantUsers.map((u) => [u.id, u])), [tenantUsers]);

  const today = toDateKey(new Date());
  const todaySessions = classSessionsRepo
    .query({ date: today })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const stats = [
    { label: "Miembros del box", value: tenantUsers.length },
    { label: "Coaches", value: tenantUsers.filter((u) => u.role === "coach").length },
    { label: "Clases hoy", value: todaySessions.length },
  ];

  const isMember = currentUser?.role === "member";
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

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>

      {isMember && currentUser && membership && (
        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Mi membresía
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-medium">{plan?.name ?? "—"}</span>
            {membershipStatus && <MembershipBadge status={membershipStatus} />}
            <CreditsBadge userId={currentUser.id} />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Vigencia: {formatDate(membership.startDate)} → {formatDate(membership.endDate)}
          </div>
        </div>
      )}

      <RoleGate allowed={["owner", "coach"]}>
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Clases de hoy</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/reservas" })}>
              Ver calendario
              <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
            </Button>
          </div>

          {todaySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin clases programadas hoy.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {todaySessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  template={templateById.get(s.templateId)}
                  coach={s.coachId ? userById.get(s.coachId) : undefined}
                  onClick={() => navigate({ to: "/reservas" })}
                />
              ))}
            </div>
          )}
        </section>
      </RoleGate>
    </AppLayout>
  );
}
