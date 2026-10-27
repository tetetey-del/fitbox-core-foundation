import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { AuthError } from "@/lib/services/auth.service";
import { acceptInvitation, resolveInvitation } from "@/lib/services/invitations.service";
import { AuthShell, ErrorBox, Field } from "./login";

export const Route = createFileRoute("/invitacion/$code")({
  head: () => ({
    meta: [
      { title: "Invitación — Kinflow" },
      { name: "description", content: "Acepta tu invitación para unirte al box." },
    ],
  }),
  component: InvitationPage,
});

function InvitationPage() {
  const { code } = useParams({ from: "/invitacion/$code" });
  const navigate = useNavigate();
  const { _setSession } = useAuth();
  const resolved = useMemo(() => resolveInvitation(code), [code]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(resolved?.invitation.email ?? "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!resolved) {
    return (
      <AuthShell title="Invitación no encontrada">
        <p className="text-sm text-muted-foreground">
          El código <span className="font-mono">{code}</span> no corresponde a ninguna invitación.
        </p>
        <Button className="mt-4 w-full" onClick={() => navigate({ to: "/" })}>Volver al inicio</Button>
      </AuthShell>
    );
  }

  if (resolved.status !== "pending") {
    const label =
      resolved.status === "expired"
        ? "La invitación ha caducado."
        : resolved.status === "revoked"
          ? "Esta invitación fue revocada."
          : "Esta invitación ya se ha usado.";
    return (
      <AuthShell title="Invitación no válida">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-xs text-muted-foreground">Pide al admin del box que te envíe una nueva.</p>
        <Button className="mt-4 w-full" onClick={() => navigate({ to: "/" })}>Volver al inicio</Button>
      </AuthShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!accepted) {
      setError("Para crear tu cuenta tienes que aceptar los términos y la política de privacidad.");
      return;
    }
    setLoading(true);
    try {
      const { session } = await acceptInvitation({ code, name, email, password, phone });
      _setSession(session);
      navigate({
        to: resolved.invitation.role === "member" ? "/onboarding/member" : "/dashboard",
      });
    } catch (err) {
      setError(err instanceof AuthError ? err.message : err instanceof Error ? err.message : "No se pudo aceptar la invitación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={`Únete a ${resolved.tenantName}`}
      subtitle={`Te han invitado como ${resolved.invitation.role === "coach" ? "coach" : "socio/a"}.`}
    >
      <div className="mb-4 flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
        {resolved.tenantLogo ? (
          <img src={resolved.tenantLogo} alt="" className="h-9 w-9 rounded object-cover" />
        ) : (
          <div className="h-9 w-9 rounded" style={{ background: resolved.brandColor ?? "#14B8A6" }} />
        )}
        <div>
          <div className="text-sm font-medium">{resolved.tenantName}</div>
          <div className="text-xs text-muted-foreground">Invitación válida hasta {new Date(resolved.invitation.expiresAt).toLocaleDateString("es-ES")}</div>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre completo">
          <Input required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana García" />
        </Field>
        <Field label="Email">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {resolved.invitation.role === "member" && (
          <Field label="Teléfono">
            <Input type="tel" inputMode="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" />
          </Field>
        )}
        <Field label="Contraseña" hint="Mínimo 8 caracteres.">
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <label className="flex items-start gap-3 rounded-md border border-border p-3 text-xs leading-relaxed text-muted-foreground cursor-pointer">
          <Checkbox
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-0.5"
            aria-label="Acepto los términos y la política de privacidad"
          />
          <span>
            Acepto los{" "}
            <Link to="/legal/terminos" target="_blank" className="text-foreground underline">términos</Link> y la{" "}
            <Link to="/legal/privacidad" target="_blank" className="text-foreground underline">política de privacidad</Link>.
            Entiendo que mi relación es con {resolved.tenantName}, que es responsable de sus clases, cobros y mis
            datos; Kinflow es solo la app que usa para organizarse.
          </span>
        </label>
        {error && <ErrorBox>{error}</ErrorBox>}
        <Button type="submit" className="w-full h-10" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear mi cuenta"}
        </Button>
      </form>
    </AuthShell>
  );
}
