import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion } from "@/lib/data-bus";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { toDateKey } from "@/lib/date";
import { SessionCard } from "@/components/classes/SessionCard";
import { RoleGate } from "@/components/RoleGate";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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

  return (
    <AppLayout>
      <PageHeader
        title={`Hola, ${currentUser?.name.split(" ")[0] ?? ""}`}
        description={`Panel de ${currentTenant?.name}`}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>

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
