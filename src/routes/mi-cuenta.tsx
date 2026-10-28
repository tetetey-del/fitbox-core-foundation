import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Award, LogOut, UserRound, IdCard, KeyRound, BellRing } from "lucide-react";
import { PushSettings } from "@/components/member/PushControls";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { AuthError } from "@/lib/services/auth.service";
import { updateUserById } from "@/lib/storage/repositories/users.repo";
import { MEMBER_GOAL_LABEL, type MemberGoal } from "@/types";
import { AvatarPicker } from "@/components/members/AvatarPicker";
import { useModules } from "@/hooks/useModules";
import { useDataVersion } from "@/lib/data-bus";
import { missingOptionalData, needsProfileData, todayKey } from "@/lib/memberData";


export const Route = createFileRoute("/mi-cuenta")({
  head: () => ({ meta: [{ title: "Mi cuenta — Kinflow" }] }),
  component: MyAccountPage,
});

function MyAccountPage() {
  const { session, currentUser, refresh, changePassword, logout } = useAuth();
  const modules = useModules();
  const navigate = useNavigate();
  useDataVersion();

  if (!session || !currentUser) return null;
  const isMember = currentUser.role === "member";

  return (
    <AppLayout>
      <PageHeader title="Mi cuenta" description="Tu perfil, tus datos y tus avisos." />

      <div className="grid gap-6 max-w-3xl">
        <ProfileCard onSaved={refresh} />

        {isMember && <MyDataCard onSaved={refresh} />}

        {session.cloud && (
          <section className="rounded-lg border border-border bg-card p-5 space-y-3">
            <SectionTitle icon={BellRing}>Notificaciones</SectionTitle>
            <PushSettings />
          </section>
        )}

        <ChangePasswordCard changePassword={changePassword} />

        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => {
            logout();
            navigate({ to: "/login" });
          }}
        >
          <LogOut className="h-4 w-4 mr-2" strokeWidth={1.5} /> Cerrar sesión
        </Button>

        <p className="text-xs text-muted-foreground">
          Kinflow es la app que usa tu box para organizarse. Las clases, los cobros y tus datos los gestiona tu box:
          cualquier consulta, escríbele a ellos.{" "}
          <Link to="/legal/terminos" className="underline">Términos</Link> ·{" "}
          <Link to="/legal/privacidad" className="underline">Privacidad</Link>
        </p>
      </div>
    </AppLayout>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: typeof Award; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold">
      <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: "color-mix(in srgb, var(--brand) 18%, transparent)", color: "var(--brand)" }}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      {children}
    </h2>
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
    <div id="mis-datos" className={`scroll-mt-20 rounded-lg border bg-card p-5 space-y-4 ${pending ? "border-[var(--brand)]" : "border-border"}`}>
      <div>
        <SectionTitle icon={IdCard}>Mis datos</SectionTitle>
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
      <SectionTitle icon={UserRound}>Mi perfil</SectionTitle>
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
              className={`rounded-md border p-2 text-sm text-left transition-colors ${goal === g ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_10%,transparent)]" : "border-border"}`}
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
      <SectionTitle icon={KeyRound}>Cambiar contraseña</SectionTitle>
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
