import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthError } from "@/lib/services/auth.service";
import { cloudEnterIfSignedIn, cloudSetNewPassword } from "@/lib/cloud/auth";
import { sb } from "@/lib/cloud/client";
import { sessionStore } from "@/lib/storage/session";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell, ErrorBox, Field } from "./login";

export const Route = createFileRoute("/restablecer")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña — Kinflow" },
      { name: "description", content: "Elige una contraseña nueva para tu cuenta Kinflow." },
    ],
  }),
  component: ResetPage,
});

/** Destino del enlace "restablecer contraseña" del email (boxes reales, Supabase). */
function ResetPage() {
  const navigate = useNavigate();
  const { _setSession } = useAuth();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase lee el enlace del email y abre una sesión temporal de recuperación.
    const client = sb();
    const { data: sub } = client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setValid(true);
        setChecking(false);
      }
    });
    void client.auth.getSession().then(({ data }) => {
      if (data.session) setValid(true);
      setTimeout(() => setChecking(false), 1500);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await cloudSetNewPassword(password);
      const s = await cloudEnterIfSignedIn();
      if (s) {
        sessionStore.write(s);
        _setSession(s);
        navigate({ to: s.role === "member" ? "/feed" : "/dashboard" });
      } else {
        navigate({ to: "/login" });
      }
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "No se pudo cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (checking && !valid) {
    return (
      <AuthShell title="Nueva contraseña" subtitle="Comprobando el enlace…">
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AuthShell>
    );
  }

  if (!valid) {
    return (
      <AuthShell title="Enlace no válido" subtitle="Puede que haya caducado o que ya se haya usado.">
        <Button asChild className="w-full h-10">
          <Link to="/recuperar">Pedir un enlace nuevo</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nueva contraseña" subtitle="Elige una contraseña nueva para tu cuenta.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nueva contraseña" hint="Mínimo 8 caracteres.">
          <Input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        {error && <ErrorBox>{error}</ErrorBox>}
        <Button type="submit" className="w-full h-10" disabled={loading || password.length < 8}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar y entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}
