import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion } from "@/lib/data-bus";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { toDateKey, formatDate, daysBetween, parseDateKey } from "@/lib/date";
import { FeedWidget } from "@/components/dashboard/FeedWidget";
import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard";
import { GettingStarted } from "@/components/dashboard/GettingStarted";
import { CoachOrOwnerToday } from "@/components/dashboard/CoachOrOwnerToday";
import { MemberDashboard } from "@/components/dashboard/MemberDashboard";
import {
  getActiveMembership,
  getMembershipStatus,
  getPlan,
} from "@/lib/services/membership.service";
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

      {isAdmin && (
        <div className="mb-6 max-w-2xl">
          <GettingStarted />
        </div>
      )}

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
