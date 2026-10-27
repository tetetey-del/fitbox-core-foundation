import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { AuthError } from "@/lib/services/auth.service";
import { acceptInvitation, resolveInvitation } from "@/lib/services/invitations.service";
import { AuthShell, ErrorBox, Field } from "./login";
import { cloudEnabled } from "@/lib/cloud/client";
import { cloudAcceptInvitation, cloudGetInvitation } from "@/lib/cloud/auth";
import { sessionStore } from "@/lib/storage/session";

interface Resolved {
  cloud: boolean;
  invitation: { role: "coach" | "member"; email?: string };
  status: string;
  tenantName: string;
  tenantLogo?: string;
  brandColor?: string;
  expiresAt: string;
}

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
  // Primero se busca en Supabase (boxes reales); si no está, en la demo del navegador.
  const [resolved, setResolved] = useState<Resolved | null | undefined>(undefined);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let r: Resolved | null = null;
      if (cloudEnabled()) {
        const inv = await cloudGetInvitation(code);
        if (inv) {
          r = {
            cloud: true,
            invitation: { role: inv.role, email: inv.email },
            status: inv.status,
            tenantName: inv.tenantName,
            tenantLogo: inv.tenantLogo,
            brandColor: inv.brandColor,
            expiresAt: inv.expiresAt,
          };
        }
      }
      if (!r) {
        const local = resolveInvitation(code);
        if (local) {
          r = {
            cloud: false,
            invitation: { role: local.invitation.role, email: local.invitation.email },
            status: local.status,
            tenantName: local.tenantName,
            tenantLogo: local.tenantLogo,
            brandColor: local.brandColor,
            expiresAt: local.invitation.expiresAt,
          };
        }
      }
      if (cancelled) return;
      setResolved(r);
      if (r?.invitation.email) setEmail(r.invitation.email);
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (resolved === undefined) {
    return (
      <AuthShell title="Invitación" subtitle="Buscando tu invitación…">
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AuthShell>
    );
  }

  if (sentTo) {
    return (
      <AuthShell title="Revisa tu email" subtitle="Ya casi está.">
        <p className="text-sm">
          Te enviamos un enlace a <strong>{sentTo}</strong> para confirmar tu cuenta. Tócalo y entrarás a{" "}
          {resolved?.tenantName}.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Si no lo ves en unos minutos, revisa la carpeta de spam.</p>
      </AuthShell>
    );
  }

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
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
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
      let session;
      if (resolved.cloud) {
        try {
          session = await cloudAcceptInvitation({ code, name, email, password, phone });
        } catch (err) {
          if (err instanceof AuthError && err.code === "confirm_email") {
            setSentTo(email.trim());
            return;
          }
          throw err;
        }
        sessionStore.write(session);
      } else {
        session = (await acceptInvitation({ code, name, email, password, phone })).session;
      }
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
          <div className="text-xs text-muted-foreground">Invitación válida hasta {new Date(resolved.expiresAt).toLocaleDateString("es-ES")}</div>
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
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Repetir contraseña">
          <Input type="password" required value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" />
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
