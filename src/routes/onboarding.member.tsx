import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, ChevronRight, Loader2, Newspaper, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserById } from "@/lib/storage/repositories/users.repo";
import type { MemberGoal } from "@/types";
import { MEMBER_GOAL_LABEL } from "@/types";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/onboarding/member")({
  head: () => ({ meta: [{ title: "Bienvenido — Kinflow" }] }),
  component: MemberOnboarding,
});

function MemberOnboarding() {
  const { session, currentUser, refresh } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [avatar, setAvatar] = useState(currentUser?.avatar ?? "");
  const [goal, setGoal] = useState<MemberGoal>(currentUser?.profile?.goal ?? "general");
  const [saving, setSaving] = useState(false);

  if (!session || !currentUser) {
    navigate({ to: "/login" });
    return null;
  }

  const saveStep1 = () => {
    updateUserById(session.tenantId, session.userId, {
      avatar: avatar || undefined,
      profile: { ...currentUser.profile, goal },
    });
    refresh();
    setStep(2);
  };

  const finish = () => {
    setSaving(true);
    navigate({ to: "/feed" });
  };

  return (
    <AuthShell title={`Bienvenido, ${currentUser.name.split(" ")[0]}`} subtitle="Solo dos pasos y estás dentro.">
      <div className="mb-6 flex gap-1.5">
        {[1, 2].map((n) => (
          <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-[#14B8A6]" : "bg-muted"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <Field label="Avatar (URL opcional)">
            <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Tu objetivo">
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(MEMBER_GOAL_LABEL) as MemberGoal[]).map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`rounded-md border p-3 text-sm text-left transition-colors ${goal === g ? "border-[#14B8A6] bg-[#14B8A6]/5" : "border-border"}`}
                >
                  {MEMBER_GOAL_LABEL[g]}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex justify-end">
            <Button onClick={saveStep1}>Siguiente <ChevronRight className="h-4 w-4 ml-1" strokeWidth={1.5} /></Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3 text-sm">
            <Hint icon={<CalendarDays className="h-4 w-4" strokeWidth={1.5} />} title="Reserva tus clases">
              Entra en <span className="font-medium">Reservas</span>, elige día y hora, y confirma. Si está llena, entrarás en lista de espera automática.
            </Hint>
            <Hint icon={<Newspaper className="h-4 w-4" strokeWidth={1.5} />} title="El WOD del día">
              Cada día encontrarás el WOD publicado en la portada del <span className="font-medium">Feed</span> y en la sección de reservas.
            </Hint>
            <Hint icon={<Trophy className="h-4 w-4" strokeWidth={1.5} />} title="Registra tus PRs">
              Anota tus marcas y compáralas con el resto del box en <span className="font-medium">PRs</span>.
            </Hint>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>Atrás</Button>
            <Button onClick={finish} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar al feed"}
            </Button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}

function Hint({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-md bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{children}</div>
      </div>
    </div>
  );
}
