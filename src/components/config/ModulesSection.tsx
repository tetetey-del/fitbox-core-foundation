import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { notifyDataChanged } from "@/lib/data-bus";
import { DEFAULT_MODULES, type TenantModules } from "@/types";

const DESCRIPTIONS: Record<keyof TenantModules, { label: string; desc: string }> = {
  reservas: { label: "Reservas", desc: "Calendario de clases, reservas de socios y check-ins." },
  socios: { label: "Socios", desc: "Fichas de socios, membresías y asignación de planes." },
  prs: { label: "PRs", desc: "Marcas personales, historial y leaderboard del box." },
  feed: { label: "Feed", desc: "Muro con avisos, consejos, recetas y WOD del día." },
  pagos: { label: "Pagos", desc: "Precios, cobros y visibilidad de importes en la app." },
};

export function ModulesSection() {
  const { currentTenant, refresh } = useAuth();
  const initial = { ...DEFAULT_MODULES, ...(currentTenant?.settings?.enabledModules ?? {}) };
  const [mods, setMods] = useState<TenantModules>(initial);

  useEffect(() => {
    setMods({ ...DEFAULT_MODULES, ...(currentTenant?.settings?.enabledModules ?? {}) });
  }, [currentTenant]);

  const save = () => {
    if (!currentTenant) return;
    tenantsRepo.update(currentTenant.id, {
      settings: { ...currentTenant.settings, cancellationWindowHours: currentTenant.settings?.cancellationWindowHours ?? 2, enabledModules: mods },
    });
    toast.success("Módulos actualizados");
    notifyDataChanged();
    refresh();
  };

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-6">
      <div>
        <h2 className="text-base font-semibold">Módulos</h2>
        <p className="text-sm text-muted-foreground">
          Activa o desactiva funcionalidades del box.
        </p>
      </div>
      <ul className="grid gap-3">
        {(Object.keys(DESCRIPTIONS) as Array<keyof TenantModules>).map((k) => (
          <li
            key={k}
            className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium">{DESCRIPTIONS[k].label}</div>
              <p className="text-xs text-muted-foreground">{DESCRIPTIONS[k].desc}</p>
            </div>
            <Switch
              aria-label={DESCRIPTIONS[k].label}
              checked={mods[k]}
              onCheckedChange={(v) => setMods((m) => ({ ...m, [k]: v }))}
            />
          </li>
        ))}
      </ul>
      <Button onClick={save}>Guardar módulos</Button>
    </section>
  );
}
