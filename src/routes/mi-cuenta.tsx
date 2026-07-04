import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AuthError } from "@/lib/services/auth.service";
import { updateUserById } from "@/lib/storage/repositories/users.repo";
import { bookingsRepo } from "@/lib/storage/repositories/bookings.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { getActiveMembership, getPlan } from "@/lib/services/membership.service";
import { MEMBER_GOAL_LABEL, type MemberGoal } from "@/types";
import { MembershipBadge } from "@/components/members/MembershipBadge";
import { CreditsBadge } from "@/components/members/CreditsBadge";
import { formatDate } from "@/lib/date";
import { toDateKey } from "@/lib/date";

export const Route = createFileRoute("/mi-cuenta")({
  head: () => ({ meta: [{ title: "Mi cuenta — FitBox" }] }),
  component: MyAccountPage,
});

function MyAccountPage() {
  const { session, currentUser, refresh, changePassword } = useAuth();

  if (!session || !currentUser) return null;

  const membership = getActiveMembership(currentUser.id);
  const plan = membership ? getPlan(membership.planId) : null;

  const nowKey = toDateKey(new Date());
  const upcoming = bookingsRepo
    .query({ userId: currentUser.id })
    .filter((b) => b.status === "confirmed" || b.status === "waitlist")
    .map((b) => ({ b, s: classSessionsRepo.getById(b.sessionId) }))
    .filter((x): x is { b: typeof x.b; s: NonNullable<typeof x.s> } => !!x.s)
    .filter(({ s }) => s.date >= nowKey && s.status !== "cancelled")
    .sort((a, b) => (a.s.date + a.s.startTime).localeCompare(b.s.date + b.s.startTime))
    .slice(0, 5);

  return (
    <AppLayout>
      <PageHeader title="Mi cuenta" description="Tus datos, tu membresía y tu seguridad." />

      <div className="grid gap-6 max-w-3xl">
        <ProfileCard onSaved={refresh} />
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-medium mb-3">Mi membresía</h2>
          {membership && plan ? (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{plan.name}</span>
                <MembershipBadge status={membership.status === "active" ? "active" : "expired"} />
                <CreditsBadge userId={currentUser.id} />
              </div>
              <p className="text-xs text-muted-foreground">
                Vigencia: {formatDate(membership.startDate)} → {formatDate(membership.endDate)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin plan activo. Habla con tu box.</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">Próximas reservas</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/reservas">Ver todas</Link>
            </Button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes reservas próximas.</p>
          ) : (
            <div className="divide-y divide-border">
              {upcoming.map(({ b, s }) => (
                <div key={b.id} className="py-2 text-sm flex items-center justify-between">
                  <div>
                    <div className="font-medium">{formatDate(s.date)} · {s.startTime}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.status === "waitlist" ? `Lista de espera · #${b.position ?? "?"}` : "Confirmada"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <ChangePasswordCard changePassword={changePassword} />
      </div>
    </AppLayout>
  );
}

function ProfileCard({ onSaved }: { onSaved: () => void }) {
  const { session, currentUser } = useAuth();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [avatar, setAvatar] = useState(currentUser?.avatar ?? "");
  const [goal, setGoal] = useState<MemberGoal>(currentUser?.profile?.goal ?? "general");
  const [saving, setSaving] = useState(false);

  if (!session || !currentUser) return null;

  const save = () => {
    setSaving(true);
    updateUserById(session.tenantId, session.userId, {
      name: name.trim() || currentUser.name,
      avatar: avatar || undefined,
      profile: { ...currentUser.profile, goal },
    });
    toast.success("Perfil actualizado");
    onSaved();
    setSaving(false);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-medium">Mi perfil</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldRow label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </FieldRow>
        <FieldRow label="Avatar (URL)">
          <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
        </FieldRow>
      </div>
      <FieldRow label="Objetivo">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(MEMBER_GOAL_LABEL) as MemberGoal[]).map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => setGoal(g)}
              className={`rounded-md border p-2 text-sm text-left transition-colors ${goal === g ? "border-[#F97316] bg-[#F97316]/5" : "border-border"}`}
            >
              {MEMBER_GOAL_LABEL[g]}
            </button>
          ))}
        </div>
      </FieldRow>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

function ChangePasswordCard({
  changePassword,
}: {
  changePassword: (curr: string, next: string) => Promise<void>;
}) {
  const [curr, setCurr] = useState("");
  const [next, setNext] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await changePassword(curr, next);
      toast.success("Contraseña actualizada");
      setCurr("");
      setNext("");
    } catch (err) {
      toast.error(err instanceof AuthError ? err.message : "No se pudo cambiar la contraseña");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-medium">Cambiar contraseña</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldRow label="Contraseña actual">
          <Input type="password" value={curr} onChange={(e) => setCurr(e.target.value)} required autoComplete="current-password" />
        </FieldRow>
        <FieldRow label="Nueva contraseña">
          <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} required autoComplete="new-password" />
        </FieldRow>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !curr || next.length < 8}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar contraseña"}
        </Button>
      </div>
    </form>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
