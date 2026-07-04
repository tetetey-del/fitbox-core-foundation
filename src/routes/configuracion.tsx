import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/contexts/AuthContext";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { clearAll } from "@/lib/storage/db";
import { loadDemoData } from "@/lib/seed";

export const Route = createFileRoute("/configuracion")({ component: ConfigPage });

function ConfigPage() {
  const { currentTenant, refresh, logout, login } = useAuth();
  const [name, setName] = useState(currentTenant?.name ?? "");
  const [brandColor, setBrandColor] = useState(currentTenant?.brandColor ?? "#F97316");

  const save = () => {
    if (!currentTenant) return;
    tenantsRepo.update(currentTenant.id, { name, brandColor });
    refresh();
  };

  const handleDemo = () => {
    const { tenant, owner } = loadDemoData();
    login(tenant.id, owner.id);
  };

  const handleReset = () => {
    if (!confirm("¿Borrar TODOS los datos locales de FitBox? Esta acción no se puede deshacer.")) return;
    clearAll();
    logout();
  };

  return (
    <AppLayout>
      <PageHeader title="Configuración" description="Ajustes del box y datos locales." />

      <RoleGate
        allowed={["owner"]}
        fallback={
          <p className="text-sm text-muted-foreground">
            Solo el owner del box puede modificar la configuración.
          </p>
        }
      >
        <div className="grid gap-8 max-w-2xl">
          <section className="space-y-4 rounded-lg border border-border bg-card p-6">
            <div>
              <h2 className="text-base font-semibold">Datos del box</h2>
              <p className="text-sm text-muted-foreground">Nombre e identidad visual.</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nombre</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Color de marca</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-10 w-14 rounded-md border border-border bg-background cursor-pointer"
                  />
                  <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
                </div>
              </div>
            </div>
            <Button onClick={save}>Guardar cambios</Button>
          </section>

          <section className="space-y-4 rounded-lg border border-border bg-card p-6">
            <div>
              <h2 className="text-base font-semibold">Datos de demostración</h2>
              <p className="text-sm text-muted-foreground">
                Crea un box de ejemplo "CrossFit Norte" con usuarios de prueba.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleDemo}>Cargar datos demo</Button>
              <Button variant="ghost" onClick={handleReset} className="text-destructive hover:text-destructive">
                Borrar todos los datos locales
              </Button>
            </div>
          </section>
        </div>
      </RoleGate>
    </AppLayout>
  );
}
