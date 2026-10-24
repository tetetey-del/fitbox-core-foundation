import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { classTemplatesRepoFor } from "@/lib/storage/repositories/classTemplates.repo";
import { classSessionsRepoFor } from "@/lib/storage/repositories/classSessions.repo";
import { membershipPlansRepoFor } from "@/lib/storage/repositories/membershipPlans.repo";
import { createInvitation } from "@/lib/services/invitations.service";
import { addDays, startOfWeek, toDateKey } from "@/lib/date";
import { DEFAULT_THEME_ID } from "@/lib/themes";
import type { MembershipPlan, ThemeId } from "@/types";
import { AuthShell } from "./login";
import { StepBoxData } from "@/components/onboarding/StepBoxData";
import { StepSchedule } from "@/components/onboarding/StepSchedule";
import { StepPlans, type DraftPlan } from "@/components/onboarding/StepPlans";
import { StepInvites } from "@/components/onboarding/StepInvites";

export const Route = createFileRoute("/onboarding/owner")({
  head: () => ({ meta: [{ title: "Bienvenido — FitBox" }] }),
  component: OwnerOnboarding,
});

function OwnerOnboarding() {
  const { session, currentTenant, refresh } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [boxName, setBoxName] = useState("");
  const [color, setColor] = useState("#14B8A6");
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [logo, setLogo] = useState<string>("");

  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
    new Set(["1-07:00", "1-19:00", "6-10:00"]),
  );
  const [plans, setPlans] = useState<DraftPlan[]>([
    { name: "Ilimitado", price: 89, type: "unlimited", credits: 0 },
    { name: "12 clases", price: 69, type: "credits", credits: 12 },
    { name: "8 clases", price: 55, type: "credits", credits: 8 },
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

  const updatePlan = (i: number, patch: Partial<DraftPlan>) => {
    setPlans((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };

  const finish = async () => {
    setSaving(true);
    try {
      tenantsRepo.update(currentTenant.id, {
        name: boxName.trim() || currentTenant.name,
        brandColor: color,
        themeId,
        logo: logo || undefined,
      });

      const tplRepo = classTemplatesRepoFor(currentTenant.id);
      const sesRepo = classSessionsRepoFor(currentTenant.id);
      const defaultTpl = tplRepo.create({
        tenantId: currentTenant.id,
        name: "WOD",
        type: "wod",
        durationMinutes: 60,
        defaultCapacity: 12,
        color,
      });
      const today = new Date();
      const weekStart = startOfWeek(today);
      for (let w = 0; w < 2; w++) {
        for (const key of selectedSlots) {
          const [, time] = key.split("-");
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
            className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-[#14B8A6]" : "bg-muted"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <StepBoxData
          boxName={boxName}
          onBoxNameChange={setBoxName}
          color={color}
          onColorChange={setColor}
          themeId={themeId}
          onThemeChange={setThemeId}
          logo={logo}
          onLogoChange={setLogo}
        />
      )}
      {step === 2 && (
        <StepSchedule selectedSlots={selectedSlots} onToggleSlot={toggleSlot} />
      )}
      {step === 3 && <StepPlans plans={plans} onUpdate={updatePlan} />}
      {step === 4 && <StepInvites value={inviteEmails} onChange={setInviteEmails} />}

      <div className="mt-6 flex justify-between">
        <Button
          variant="ghost"
          onClick={() => (step > 1 ? setStep(step - 1) : navigate({ to: "/dashboard" }))}
        >
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
