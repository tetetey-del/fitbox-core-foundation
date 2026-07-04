import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { classTemplatesRepoFor } from "@/lib/storage/repositories/classTemplates.repo";
import { classSessionsRepoFor } from "@/lib/storage/repositories/classSessions.repo";
import { membershipPlansRepoFor } from "@/lib/storage/repositories/membershipPlans.repo";
import { createInvitation } from "@/lib/services/invitations.service";
import { addDays, startOfWeek, toDateKey } from "@/lib/date";
import { THEMES, DEFAULT_THEME_ID } from "@/lib/themes";
import type { MembershipPlan, ThemeId } from "@/types";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/onboarding/owner")({
  head: () => ({ meta: [{ title: "Bienvenido — FitBox" }] }),
  component: OwnerOnboarding,
});

interface Slot { day: number; time: string; label: string }
const SLOTS: Slot[] = [
  { day: 1, time: "07:00", label: "L-V mañana" },
  { day: 1, time: "13:30", label: "L-V mediodía" },
  { day: 1, time: "17:30", label: "L-V tarde" },
  { day: 1, time: "19:00", label: "L-V noche" },
  { day: 6, time: "10:00", label: "Sábado mañana" },
];

function OwnerOnboarding() {
  const { session, currentTenant, refresh } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [boxName, setBoxName] = useState("");
  const [color, setColor] = useState("#F97316");
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [logo, setLogo] = useState<string>("");

  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set(["1-07:00", "1-19:00", "6-10:00"]));
  const [plans, setPlans] = useState([
    { name: "Ilimitado", price: 89, type: "unlimited" as const, credits: 0 },
    { name: "12 clases", price: 69, type: "credits" as const, credits: 12 },
    { name: "8 clases", price: 55, type: "credits" as const, credits: 8 },
  ]);
  const [inviteEmails, setInviteEmails] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) navigate({ to: "/login" });
    if (currentTenant && !boxName) {
      setBoxName(currentTenant.name);
      setColor(currentTenant.brandColor);
      setThemeId(currentTenant.themeId ?? DEFAULT_THEME_ID);
      setLogo(currentTenant.logo ?? "");
    }
  }, [session, currentTenant, navigate, boxName]);

  if (!session || !currentTenant) return null;

  const toggleSlot = (k: string) => {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const updatePlan = (i: number, patch: Partial<(typeof plans)[number]>) => {
    setPlans((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };

  const finish = async () => {
    setSaving(true);
    try {
      // Guardar datos del box
      tenantsRepo.update(currentTenant.id, {
        name: boxName.trim() || currentTenant.name,
        brandColor: color,
        themeId,
        logo: logo || undefined,
      });

      // Crear plantillas y sesiones para las franjas seleccionadas
      const tplRepo = classTemplatesRepoFor(currentTenant.id);
      const sesRepo = classSessionsRepoFor(currentTenant.id);
      const defaultTpl = tplRepo.create({
        tenantId: currentTenant.id,
        name: "WOD",
        type: "wod",
        durationMinutes: 60,
        defaultCapacity: 12,
        color: color,
      });
      const today = new Date();
      const weekStart = startOfWeek(today);
      for (let w = 0; w < 2; w++) {
        for (const key of selectedSlots) {
          const [, time] = key.split("-");
          // Repartir por días L-V si day=1, sábado si day=6
          const isSaturday = key.startsWith("6-");
          const days = isSaturday ? [5] : [0, 1, 2, 3, 4];
          for (const dIdx of days) {
            const date = addDays(weekStart, w * 7 + dIdx);
            sesRepo.create({
              tenantId: currentTenant.id,
              templateId: defaultTpl.id,
              date: toDateKey(date),
              startTime: time,
              durationMinutes: 60,
              capacity: 12,
              status: "scheduled",
            });
          }
        }
      }

      // Planes
      const plansRepo = membershipPlansRepoFor(currentTenant.id);
      plans.forEach((p) => {
        plansRepo.create({
          tenantId: currentTenant.id,
          name: p.name,
          priceMonthly: p.price,
          type: p.type,
          creditsPerMonth: p.type === "credits" ? p.credits : undefined,
          active: true,
        } as Omit<MembershipPlan, "id" | "createdAt" | "updatedAt">);
      });

      // Invitaciones
      const emails = inviteEmails.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
      emails.forEach((email) =>
        createInvitation({
          tenantId: currentTenant.id,
          invitedBy: session.userId,
          role: "member",
          email,
        }),
      );

      refresh();
      toast.success("¡Todo listo!");
      navigate({ to: "/dashboard" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell title={`Paso ${step} de 4`} subtitle="Configura tu box en unos minutos.">
      <div className="mb-6 flex gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-[#F97316]" : "bg-muted"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <Field label="Nombre del box">
            <Input value={boxName} onChange={(e) => setBoxName(e.target.value)} />
          </Field>
          <Field label="Color de marca">
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 rounded-md border border-border bg-background cursor-pointer" aria-label="Color de marca" />
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </Field>
          <Field label="Tema">
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={`rounded-md border p-2 text-left text-xs transition-colors ${themeId === t.id ? "border-[#F97316] bg-[#F97316]/5" : "border-border"}`}
                >
                  <div className="font-medium">{t.name}</div>
                  <div className="text-muted-foreground mt-0.5">{t.description}</div>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Logo (URL opcional)">
            <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://…" />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Selecciona las franjas que impartirás:</p>
          {SLOTS.map((s) => {
            const k = `${s.day}-${s.time}`;
            const checked = selectedSlots.has(k);
            return (
              <label key={k} className="flex items-center gap-3 rounded-md border border-border p-3 cursor-pointer">
                <Checkbox checked={checked} onCheckedChange={() => toggleSlot(k)} />
                <div className="text-sm">
                  <div className="font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.time}</div>
                </div>
              </label>
            );
          })}
          <p className="text-xs text-muted-foreground pt-1">
            Se crearán plantillas y las primeras 2 semanas de sesiones automáticamente.
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          {plans.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_100px_100px] gap-2 items-end">
              <div>
                <Label className="text-xs text-muted-foreground">Nombre</Label>
                <Input value={p.name} onChange={(e) => updatePlan(i, { name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Precio/mes</Label>
                <Input type="number" value={p.price} onChange={(e) => updatePlan(i, { price: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Créditos</Label>
                <Input
                  type="number"
                  value={p.credits}
                  disabled={p.type === "unlimited"}
                  onChange={(e) => updatePlan(i, { credits: Number(e.target.value) })}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <Field label="Emails de tus primeros socios (opcional)" hint="Separa por comas o líneas. Se crearán invitaciones que puedes compartir después.">
            <textarea
              className="w-full min-h-24 rounded-md border border-border bg-background p-2 text-sm"
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              placeholder="ana@ejemplo.com&#10;diego@ejemplo.com"
            />
          </Field>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={() => (step > 1 ? setStep(step - 1) : navigate({ to: "/dashboard" }))}>
          {step > 1 ? "Atrás" : "Saltar todo"}
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((step + 1) as 1 | 2 | 3 | 4)}>
            Siguiente <ChevronRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
          </Button>
        ) : (
          <Button onClick={finish} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finalizar"}
          </Button>
        )}
      </div>
    </AuthShell>
  );
}

function Label({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`text-xs font-medium ${className}`}>{children}</div>;
}
