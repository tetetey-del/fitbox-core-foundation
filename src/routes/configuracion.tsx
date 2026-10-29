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
import type { CurrencyCode, MembershipPlan, PlanType, WodVisibility } from "@/types";
import { CURRENCY_LABEL, PLAN_DURATION_LABEL, WOD_VISIBILITY_LABEL } from "@/types";
import { currencySymbol, formatPlanPrice } from "@/lib/format";
import { notifyDataChanged, useDataVersion } from "@/lib/data-bus";
import { DataSection } from "@/components/config/DataSection";
import { AppearanceSection } from "@/components/config/AppearanceSection";
import { AppLinkSection } from "@/components/config/AppLinkSection";
import { ModulesSection } from "@/components/config/ModulesSection";
import { NumberInput } from "@/components/ui/number-input";


export const Route = createFileRoute("/configuracion")({ component: ConfigPage });

function ConfigPage() {
  const { currentTenant, refresh, logout } = useAuth();
  useDataVersion();
  const [name, setName] = useState(currentTenant?.name ?? "");
  const [cancellationWindow, setCancellationWindow] = useState(
    currentTenant?.settings?.cancellationWindowHours ?? 1,
  );
  const [currency, setCurrency] = useState<CurrencyCode>(currentTenant?.settings?.currency ?? "EUR");
  const [wodVisibility, setWodVisibility] = useState<WodVisibility>(
    currentTenant?.settings?.wodVisibility ?? "visible",
  );

  // El box se carga después del primer render: sincroniza el formulario cuando llega
  // (si no, el nombre aparecía vacío y al guardar se pisaban los datos).
  useEffect(() => {
    if (!currentTenant) return;
    setName(currentTenant.name);
    setCancellationWindow(currentTenant.settings?.cancellationWindowHours ?? 1);
    setCurrency(currentTenant.settings?.currency ?? "EUR");
    setWodVisibility(currentTenant.settings?.wodVisibility ?? "visible");
  }, [currentTenant]);

  const save = () => {
    if (!currentTenant) return;
    tenantsRepo.update(currentTenant.id, {
      name,
      settings: {
        ...currentTenant.settings,
        cancellationWindowHours: cancellationWindow,
        currency,
        wodVisibility,
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
                  Cancelar sin cargo hasta (horas antes de la clase)
                </Label>
                <NumberInput
                  min={0}
                  value={cancellationWindow}
                  onChange={(e) => setCancellationWindow(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Si un socio cancela con menos antelación, la clase se le descuenta igual.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Moneda</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CURRENCY_LABEL) as CurrencyCode[]).map((c) => (
                      <SelectItem key={c} value={c}>{CURRENCY_LABEL[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">WOD del día</Label>
                <Select value={wodVisibility} onValueChange={(v) => setWodVisibility(v as WodVisibility)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(WOD_VISIBILITY_LABEL) as WodVisibility[]).map((v) => (
                      <SelectItem key={v} value={v}>{WOD_VISIBILITY_LABEL[v]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Algunos boxes prefieren no mostrar el WOD antes para que nadie falte por el ejercicio que toca.
                </p>
              </div>
            </div>
            <Button onClick={save}>Guardar cambios</Button>
          </section>

          <AppearanceSection />
          <AppLinkSection />
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
    <section id="planes" className="scroll-mt-20 space-y-4 rounded-lg border border-border bg-card p-6">
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
              <TableHead className="hidden sm:table-cell">Tipo</TableHead>
              <TableHead className="hidden sm:table-cell">Créditos/mes</TableHead>
              <TableHead className="hidden sm:table-cell">Duración</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead className="hidden sm:table-cell">Estado</TableHead>
              <TableHead className="w-[100px] text-right">
                <span className="sr-only sm:not-sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  Todavía no hay planes definidos.
                </TableCell>
              </TableRow>
            )}
            {plans.map((p) => (
              <TableRow key={p.id} className={p.active ? "" : "opacity-60"}>
                <TableCell className="font-medium">
                  {p.name}
                  {/* En el celular, el resumen va debajo del nombre en lugar de en columnas */}
                  <div className="sm:hidden text-xs font-normal text-muted-foreground">
                    {p.type === "credits"
                      ? `${p.creditsPerMonth} ${p.creditsPerMonth === 1 ? "clase" : "clases"}`
                      : "Ilimitado"}
                    {" · "}
                    {PLAN_DURATION_LABEL[p.durationMonths ?? 1] ?? `${p.durationMonths} meses`}
                    {p.oncePerMember && " · 1 vez por persona"}
                    {p.includesPrograms && " · Con entreno personalizado"}
                    {!p.active && " · Archivado"}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {p.type === "unlimited" ? "Ilimitado" : "Créditos"}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {p.type === "credits" ? p.creditsPerMonth : "—"}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {PLAN_DURATION_LABEL[p.durationMonths ?? 1] ?? `${p.durationMonths} meses`}
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatPlanPrice(p.priceMonthly)}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {p.active ? (
                    <span className="text-xs text-emerald-400 font-medium">Activo</span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium">Archivado</span>
                  )}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
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
  const [duration, setDuration] = useState<number>(1);
  const [oncePerMember, setOncePerMember] = useState(false);
  const [includesPrograms, setIncludesPrograms] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setType(initial?.type ?? "unlimited");
      setPrice(initial?.priceMonthly ?? 0);
      setCredits(initial?.creditsPerMonth ?? 8);
      setDuration(initial?.durationMonths ?? 1);
      setOncePerMember(initial?.oncePerMember ?? false);
      setIncludesPrograms(initial?.includesPrograms ?? false);
      setActive(initial?.active ?? true);
    }
  }, [open, initial]);

  const submit = () => {
    if (!currentTenant) return;
    if (!name.trim()) return toast.error("El nombre es obligatorio");
    if (price < 0) return toast.error("El precio no puede ser negativo");
    if (type === "credits" && credits <= 0)
      return toast.error("Los créditos deben ser mayores que 0");

    const payload = {
      name: name.trim(),
      priceMonthly: Number(price),
      type,
      creditsPerMonth: type === "credits" ? Number(credits) : undefined,
      // Los planes por créditos son mensuales; los ilimitados pueden durar más.
      durationMonths: type === "credits" ? 1 : duration,
      oncePerMember,
      includesPrograms,
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
              <Label className="text-xs text-muted-foreground">Precio ({currencySymbol()})</Label>
              <NumberInput
                min={0}
                step="0.01"
                value={price}
                placeholder="0 = gratis"
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>
          </div>
          {type === "unlimited" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Duración</Label>
              <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_DURATION_LABEL).map(([m, label]) => (
                    <SelectItem key={m} value={m}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {type === "credits" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Créditos por mes</Label>
              <NumberInput
                min={1}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
              />
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Switch id="once" checked={oncePerMember} onCheckedChange={setOncePerMember} />
            <Label htmlFor="once" className="text-sm font-normal">
              Solo una vez por persona (por ejemplo, clase de prueba)
            </Label>
          </div>
          <div className="flex items-start gap-2 pt-1">
            <Switch id="programs" checked={includesPrograms} onCheckedChange={setIncludesPrograms} />
            <Label htmlFor="programs" className="text-sm font-normal">
              Incluye entreno personalizado
              <span className="block text-xs text-muted-foreground">
                Los socios con este plan ven Rutinas y se les pueden asignar (por ejemplo, un plan Premium).
              </span>
            </Label>
          </div>
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
