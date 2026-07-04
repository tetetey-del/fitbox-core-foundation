import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/contexts/AuthContext";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { membershipPlansRepo } from "@/lib/storage/repositories/membershipPlans.repo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { clearAll } from "@/lib/storage/db";
import { loadDemoData } from "@/lib/seed";
import type { MembershipPlan, PlanType } from "@/types";
import { notifyDataChanged, useDataVersion } from "@/lib/data-bus";
import { DataSection } from "@/components/config/DataSection";


export const Route = createFileRoute("/configuracion")({ component: ConfigPage });

function ConfigPage() {
  const { currentTenant, refresh, logout } = useAuth();
  useDataVersion();
  const [name, setName] = useState(currentTenant?.name ?? "");
  const [cancellationWindow, setCancellationWindow] = useState(
    currentTenant?.settings?.cancellationWindowHours ?? 2,
  );

  const save = () => {
    if (!currentTenant) return;
    tenantsRepo.update(currentTenant.id, {
      name,
      settings: {
        ...currentTenant.settings,
        cancellationWindowHours: cancellationWindow,
      },
    });
    toast.success("Configuración guardada");
    refresh();
  };

  const handleReset = () => {
    clearAll();
    logout();
  };

  return (
    <AppLayout>
      <PageHeader title="Configuración" description="Ajustes del box, apariencia, módulos y datos." />

      <RoleGate
        allowed={["admin"]}
        fallback={
          <p className="text-sm text-muted-foreground">
            Solo el admin del box puede modificar la configuración.
          </p>
        }
      >
        <div className="grid gap-8 max-w-3xl">
          <section className="space-y-4 rounded-lg border border-border bg-card p-6">
            <div>
              <h2 className="text-base font-semibold">Datos del box</h2>
              <p className="text-sm text-muted-foreground">Nombre y reglas básicas.</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nombre</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Cancelación mínima (horas)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={cancellationWindow}
                  onChange={(e) => setCancellationWindow(Number(e.target.value))}
                />
              </div>
            </div>
            <Button onClick={save}>Guardar cambios</Button>
          </section>

          <AppearanceSection />
          <ModulesSection />
          <PlansSection />
          <DataSection />

          <section className="space-y-4 rounded-lg border border-border bg-card p-6">
            <div>
              <h2 className="text-base font-semibold">Zona de peligro</h2>
              <p className="text-sm text-muted-foreground">
                Borrar los datos locales de este navegador.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive">
                  Borrar todos los datos locales
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Borrar todos los datos?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminarán todos los boxes, socios, reservas y PRs guardados en este navegador.
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Borrar todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>

        </div>
      </RoleGate>
    </AppLayout>
  );
}

function PlansSection() {
  useDataVersion();
  const plans = membershipPlansRepo.list();
  const [editing, setEditing] = useState<MembershipPlan | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold">Planes y precios</h2>
          <p className="text-sm text-muted-foreground">
            Catálogo de membresías que puedes asignar a los socios.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
          Nuevo plan
        </Button>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Créditos/mes</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Todavía no hay planes definidos.
                </TableCell>
              </TableRow>
            )}
            {plans.map((p) => (
              <TableRow key={p.id} className={p.active ? "" : "opacity-60"}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {p.type === "unlimited" ? "Ilimitado" : "Créditos"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.type === "credits" ? p.creditsPerMonth : "—"}
                </TableCell>
                <TableCell>{p.priceMonthly.toFixed(2)} €</TableCell>
                <TableCell>
                  {p.active ? (
                    <span className="text-xs text-emerald-400 font-medium">Activo</span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium">Archivado</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (!confirm(`¿Archivar el plan "${p.name}"?`)) return;
                      membershipPlansRepo.update(p.id, { active: false });
                      toast.success("Plan archivado");
                      notifyDataChanged();
                    }}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PlanDialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        initial={editing}
      />
    </section>
  );
}

function PlanDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: MembershipPlan | null;
}) {
  const { currentTenant } = useAuth();
  const [name, setName] = useState("");
  const [type, setType] = useState<PlanType>("unlimited");
  const [price, setPrice] = useState<number>(0);
  const [credits, setCredits] = useState<number>(8);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setType(initial?.type ?? "unlimited");
      setPrice(initial?.priceMonthly ?? 0);
      setCredits(initial?.creditsPerMonth ?? 8);
      setActive(initial?.active ?? true);
    }
  }, [open, initial]);

  const submit = () => {
    if (!currentTenant) return;
    if (!name.trim()) return toast.error("El nombre es obligatorio");
    if (price <= 0) return toast.error("El precio debe ser mayor que 0");
    if (type === "credits" && credits <= 0)
      return toast.error("Los créditos deben ser mayores que 0");

    const payload = {
      name: name.trim(),
      priceMonthly: Number(price),
      type,
      creditsPerMonth: type === "credits" ? Number(credits) : undefined,
      active,
    };

    if (initial) {
      membershipPlansRepo.update(initial.id, payload);
      toast.success("Plan actualizado");
    } else {
      membershipPlansRepo.create({ ...payload, tenantId: currentTenant.id });
      toast.success("Plan creado");
    }
    notifyDataChanged();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar plan" : "Nuevo plan"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as PlanType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlimited">Ilimitado</SelectItem>
                  <SelectItem value="credits">Créditos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Precio mensual (€)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>
          </div>
          {type === "credits" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Créditos por mes</Label>
              <Input
                type="number"
                min={1}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
              />
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Switch id="active" checked={active} onCheckedChange={setActive} />
            <Label htmlFor="active" className="text-sm font-normal">Plan activo</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>{initial ? "Guardar" : "Crear"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
