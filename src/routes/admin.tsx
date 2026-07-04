import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  LogOut,
  Users,
  DollarSign,
  Shield,
  ArrowRightCircle,
  PauseCircle,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion, notifyDataChanged } from "@/lib/data-bus";
import {
  getAllTenantSummaries,
  getGlobalMetrics,
  tenantModulesOf,
  purgeTenant,
} from "@/lib/services/superAdmin.service";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { formatMoney } from "@/lib/format";
import { formatDate } from "@/lib/date";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { clearAll, buildKey, get, set } from "@/lib/storage/db";
import type { SuperAdmin } from "@/types";

const DEMO_CLEARED_KEY = buildKey(null, "demo_cleared");

export const Route = createFileRoute("/admin")({ component: AdminPanel });

function AdminPanel() {
  const navigate = useNavigate();
  const { superAdmin, ready, impersonateTenant, logoutSuperAdmin } = useAuth();
  useDataVersion();
  const [confirmClear, setConfirmClear] = useState(false);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (ready && !superAdmin) navigate({ to: "/" });
  }, [ready, superAdmin, navigate]);

  if (!superAdmin) return null;

  const summaries = getAllTenantSummaries();
  const metrics = getGlobalMetrics();

  const toggleStatus = (id: string, current: "active" | "suspended" | undefined) => {
    const next = current === "suspended" ? "active" : "suspended";
    tenantsRepo.update(id, { status: next });
    toast.success(next === "active" ? "Box activado" : "Box suspendido");
    notifyDataChanged();
  };

  const doImpersonate = (id: string) => {
    impersonateTenant(id);
    navigate({ to: "/dashboard" });
  };

  const runClearDemo = () => {
    if (typed !== "BORRAR") return;
    // Guardar super admins actuales, borrar todo, restaurarlos.
    const kept: SuperAdmin[] = [superAdmin];
    clearAll();
    set(buildKey(null, "superadmins"), kept);
    set(DEMO_CLEARED_KEY, true);
    set(buildKey(null, "super_session"), { superAdminId: superAdmin.id });
    toast.success("Datos de demostración eliminados");
    setConfirmClear(false);
    setTyped("");
    notifyDataChanged();
  };

  const demoCleared = get<boolean>(DEMO_CLEARED_KEY, false);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border h-14 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" strokeWidth={1.5} />
          <span className="font-semibold tracking-tight">Panel Super Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {superAdmin.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logoutSuperAdmin();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Salir
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plataforma</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Todos los boxes de FitBox y sus métricas globales.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="Boxes activos" value={String(metrics.totalBoxes)} icon={<Building2 className="h-4 w-4" strokeWidth={1.5} />} />
          <KpiCard label="Usuarios totales" value={String(metrics.totalUsers)} icon={<Users className="h-4 w-4" strokeWidth={1.5} />} />
          <KpiCard
            label="Ingresos del mes"
            value={formatMoney(metrics.monthRevenue)}
            icon={<DollarSign className="h-4 w-4" strokeWidth={1.5} />}
          />
        </div>

        <section className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-base font-semibold">Boxes</h2>
          </div>
          {summaries.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aún no hay boxes creados.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {summaries.map((s) => {
                const mods = tenantModulesOf(s.tenant);
                const activeMods = Object.entries(mods)
                  .filter(([, v]) => v)
                  .map(([k]) => k);
                const suspended = s.tenant.status === "suspended";
                return (
                  <div key={s.tenant.id} className="p-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{s.tenant.name}</h3>
                        {suspended && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-destructive/20 text-destructive border border-destructive/30">
                            SUSPENDIDO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.users} usuarios · {s.activeMembers} socios activos ·{" "}
                        {formatMoney(s.monthRevenue)} este mes · creado{" "}
                        {formatDate(s.tenant.createdAt.slice(0, 10))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Módulos: {activeMods.length ? activeMods.join(", ") : "ninguno"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatus(s.tenant.id, s.tenant.status)}
                        aria-label={suspended ? "Activar" : "Suspender"}
                      >
                        {suspended ? (
                          <PlayCircle className="h-4 w-4 mr-2" strokeWidth={1.5} />
                        ) : (
                          <PauseCircle className="h-4 w-4 mr-2" strokeWidth={1.5} />
                        )}
                        {suspended ? "Activar" : "Suspender"}
                      </Button>
                      <Button size="sm" onClick={() => doImpersonate(s.tenant.id)}>
                        <ArrowRightCircle className="h-4 w-4 mr-2" strokeWidth={1.5} />
                        Entrar como admin
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-semibold">Producción</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {demoCleared
                  ? "Los datos de demostración ya se eliminaron. La app está lista para clientes reales."
                  : "Elimina el box demo y todos los datos de ejemplo antes de recibir clientes reales."}
              </p>
            </div>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmClear(true)}
              disabled={demoCleared}
            >
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Eliminar datos de demostración
            </Button>
          </div>
        </section>
      </main>

      <AlertDialog open={confirmClear} onOpenChange={(o) => { if (!o) { setConfirmClear(false); setTyped(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar todos los datos demo</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán todos los boxes, usuarios, reservas, planes y posts.
              Se conservará tu cuenta de super admin. Escribe{" "}
              <strong className="text-foreground">BORRAR</strong> para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="BORRAR"
            aria-label="Escribe BORRAR para confirmar"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={typed !== "BORRAR"}
              onClick={runClearDemo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
