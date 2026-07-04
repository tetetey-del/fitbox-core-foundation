import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const { currentUser, currentTenant, tenantUsers } = useAuth();
  const stats = [
    { label: "Miembros del box", value: tenantUsers.length },
    { label: "Coaches", value: tenantUsers.filter((u) => u.role === "coach").length },
    { label: "Socios", value: tenantUsers.filter((u) => u.role === "member").length },
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
      <p className="mt-8 text-sm text-muted-foreground">
        Los módulos de reservas, clases y PRs llegarán en las siguientes fases.
      </p>
    </AppLayout>
  );
}
