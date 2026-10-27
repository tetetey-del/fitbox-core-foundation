import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { toast } from "sonner";
import { Loader2, Award } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { AuthError } from "@/lib/services/auth.service";
import { updateUserById } from "@/lib/storage/repositories/users.repo";
import { bookingsRepo } from "@/lib/storage/repositories/bookings.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { getActiveMembership, getPlan } from "@/lib/services/membership.service";
import { getUserBadges } from "@/lib/services/challenges.service";
import { MEMBER_GOAL_LABEL, type MemberGoal } from "@/types";
import { MembershipBadge } from "@/components/members/MembershipBadge";
import { CreditsBadge } from "@/components/members/CreditsBadge";
import { AvatarPicker } from "@/components/members/AvatarPicker";
import { formatDate } from "@/lib/date";
import { toDateKey } from "@/lib/date";
import { useModules } from "@/hooks/useModules";
import { useDataVersion } from "@/lib/data-bus";
import { missingOptionalData, needsProfileData, todayKey } from "@/lib/memberData";

const ProgressPanel = lazy(() => import("@/components/health/ProgressPanel"));

export const Route = createFileRoute("/mi-cuenta")({
  head: () => ({ meta: [{ title: "Mi cuenta — Kinflow" }] }),
  component: MyAccountPage,
});

function MyAccountPage() {
  const { session, currentUser, refresh, changePassword } = useAuth();
  const modules = useModules();
  useDataVersion();

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

  const badges = modules.challenges ? getUserBadges(currentUser.id) : [];

  return (
    <AppLayout>
      <PageHeader title="Mi cuenta" description="Tus datos, tu membresía y tu progreso." />

      <Tabs defaultValue="perfil" className="max-w-3xl">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          {modules.health && <TabsTrigger value="progreso">Progreso</TabsTrigger>}
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="grid gap-6">
          {currentUser.role === "member" && <MyDataCard onSaved={refresh} />}
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
          {modules.challenges && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" strokeWidth={1.5} /> Mis insignias
              </h2>
              {badges.length === 0 ? (
                <p className="text-sm text-muted-foreground">Completa retos para ganar insignias.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {badges.map(({ challenge, completedAt }) => (
                    <div key={challenge.id} className="rounded-md border border-border p-3 min-w-[140px] text-center">
                      <div className="text-2xl">{challenge.badge}</div>
                      <div className="text-sm font-medium mt-1">{challenge.title}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(completedAt.slice(0, 10))}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {modules.health && (
          <TabsContent value="progreso">
            <Suspense fallback={<div className="text-sm text-muted-foreground p-6">Cargando…</div>}>
              <ProgressPanel userId={currentUser.id} tenantId={session.tenantId} canEdit />
            </Suspense>
          </TabsContent>
        )}

        <TabsContent value="seguridad">
          <ChangePasswordCard changePassword={changePassword} />
        </TabsContent>
      </Tabs>
      <p className="mt-8 max-w-3xl text-xs text-muted-foreground">
        Kinflow es la app que usa tu box para organizarse. Las clases, los cobros y tus datos los gestiona tu box:
        cualquier consulta, escríbele a ellos.{" "}
        <Link to="/legal/terminos" className="underline">Términos</Link> ·{" "}
        <Link to="/legal/privacidad" className="underline">Privacidad</Link>
      </p>
    </AppLayout>
  );
}

/** Datos personales del socio: la fecha de nacimiento es obligatoria. */
function MyDataCard({ onSaved }: { onSaved: () => void }) {
  const { session, currentUser } = useAuth();
  const p = currentUser?.profile ?? {};
  const [phone, setPhone] = useState(p.phone ?? "");
  const [birthDate, setBirthDate] = useState(p.birthDate ?? "");
  const [dni, setDni] = useState(p.dni ?? "");
  const [address, setAddress] = useState(p.address ?? "");
  const [emergencyName, setEmergencyName] = useState(p.emergencyName ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(p.emergencyPhone ?? "");
  const [tried, setTried] = useState(false);

  if (!session || !currentUser) return null;
  const pending = needsProfileData(currentUser);
  const missing = missingOptionalData(currentUser);

  const save = () => {
    setTried(true);
    if (!birthDate) return toast.error("La fecha de nacimiento es obligatoria");
    updateUserById(session.tenantId, session.userId, {
      profile: {
        ...currentUser.profile,
        phone: phone.trim() || undefined,
        birthDate,
        dni: dni.trim() || undefined,
        address: address.trim() || undefined,
        emergencyName: emergencyName.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
      },
    });
    toast.success("Datos guardados");
    onSaved();
  };

  return (
    <div className={`rounded-lg border bg-card p-5 space-y-4 ${pending ? "border-[#14B8A6]/60" : "border-border"}`}>
      <div>
        <h2 className="text-sm font-medium">Mis datos</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {pending
            ? "Completa tus datos para que tu box los tenga a mano. La fecha de nacimiento es obligatoria."
            : missing.length
              ? `Te falta: ${missing.join(", ")}.`
              : "Solo los ve el equipo de tu box."}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldRow label="Fecha de nacimiento *">
          <Input
            type="date"
            max={todayKey()}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            aria-invalid={tried && !birthDate}
            className={tried && !birthDate ? "border-destructive" : undefined}
          />
        </FieldRow>
        <FieldRow label="Teléfono">
          <Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FieldRow>
        <FieldRow label="DNI / NIE">
          <Input value={dni} onChange={(e) => setDni(e.target.value)} autoCapitalize="characters" />
        </FieldRow>
        <FieldRow label="Dirección">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
        </FieldRow>
        <FieldRow label="Contacto de emergencia">
          <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} placeholder="Nombre y relación (ej. Ana, madre)" />
        </FieldRow>
        <FieldRow label="Teléfono de emergencia">
          <Input type="tel" inputMode="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
        </FieldRow>
      </div>
      <div className="flex justify-end">
        <Button onClick={save}>Guardar datos</Button>
      </div>
    </div>
  );
}

function ProfileCard({ onSaved }: { onSaved: () => void }) {
  const { session, currentUser } = useAuth();
  const modules = useModules();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [goal, setGoal] = useState<MemberGoal>(currentUser?.profile?.goal ?? "general");
  const [showHealth, setShowHealth] = useState<boolean>(currentUser?.profile?.showHealthToCoach ?? false);
  const [saving, setSaving] = useState(false);

  if (!session || !currentUser) return null;

  const save = () => {
    setSaving(true);
    updateUserById(session.tenantId, session.userId, {
      name: name.trim() || currentUser.name,
      profile: { ...currentUser.profile, goal, showHealthToCoach: showHealth },
    });
    toast.success("Perfil actualizado");
    onSaved();
    setSaving(false);
  };

  // La foto se guarda en cuanto se elige (o se quita), sin tener que tocar "Guardar".
  const savePhoto = (dataUrl: string | undefined) => {
    updateUserById(session.tenantId, session.userId, { avatar: dataUrl });
    toast.success(dataUrl ? "Foto actualizada" : "Foto quitada");
    onSaved();
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-medium">Mi perfil</h2>
      <AvatarPicker name={currentUser.name} value={currentUser.avatar} onChange={savePhoto} />
      <FieldRow label="Nombre">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </FieldRow>
      <FieldRow label="Objetivo">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(MEMBER_GOAL_LABEL) as MemberGoal[]).map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => setGoal(g)}
              className={`rounded-md border p-2 text-sm text-left transition-colors ${goal === g ? "border-[#14B8A6] bg-[#14B8A6]/5" : "border-border"}`}
            >
              {MEMBER_GOAL_LABEL[g]}
            </button>
          ))}
        </div>
      </FieldRow>
      {modules.health && currentUser.role === "member" && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">Compartir mi progreso con el coach</div>
            <p className="text-xs text-muted-foreground">
              Si lo activas, tus coaches podrán ver tus mediciones desde tu ficha.
            </p>
          </div>
          <Switch checked={showHealth} onCheckedChange={setShowHealth} />
        </div>
      )}
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
