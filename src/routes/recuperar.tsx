import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { AuthError } from "@/lib/services/auth.service";
import { AuthShell, ErrorBox, Field } from "./login";

export const Route = createFileRoute("/recuperar")({
  head: () => ({
    meta: [
      { title: "Recuperar contraseña — Kinflow" },
      { name: "description", content: "Recupera el acceso a tu cuenta Kinflow." },
    ],
  }),
  component: RecoverPage,
});

function RecoverPage() {
  const navigate = useNavigate();
  const { requestPasswordReset, resetPassword } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      if (res.cloud) {
        setEmailSent(true);
        return;
      }
      setIssuedCode(res.code);
      setStep(2);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "No se pudo enviar el código");
    } finally {
      setLoading(false);
    }
  };

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      setStep(3);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "No se pudo restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Te ayudamos a elegir una contraseña nueva."
    >
      {emailSent && (
        <div className="space-y-4 text-sm">
          <p>
            Si hay una cuenta con <strong>{email}</strong>, te llegará un email con un enlace para elegir una contraseña
            nueva.
          </p>
          <p className="text-xs text-muted-foreground">Si no lo ves en unos minutos, revisa la carpeta de spam.</p>
          <Button className="w-full h-10" variant="outline" onClick={() => navigate({ to: "/login" })}>
            Volver a iniciar sesión
          </Button>
        </div>
      )}

      {step === 1 && !emailSent && (
        <form onSubmit={requestCode} className="space-y-4">
          <Field label="Email">
            <Input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          {error && <ErrorBox>{error}</ErrorBox>}
          <Button type="submit" className="w-full h-10" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar código"}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={doReset} className="space-y-4">
          {issuedCode && (
            <div className="flex items-start gap-2 rounded-md border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 py-2 text-xs">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#14B8A6]" strokeWidth={1.5} />
              <div>
                <div className="font-medium">Modo demo</div>
                <div className="text-muted-foreground mt-0.5">
                  Como no enviamos emails reales, tu código es{" "}
                  <span className="font-mono font-semibold text-foreground">{issuedCode}</span>
                </div>
              </div>
            </div>
          )}
          <Field label="Código de 6 dígitos">
            <Input
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="font-mono tracking-widest text-center"
            />
          </Field>
          <Field label="Nueva contraseña" hint="Mínimo 8 caracteres.">
            <Input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          {error && <ErrorBox>{error}</ErrorBox>}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>Atrás</Button>
            <Button type="submit" className="flex-1 h-10" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Restablecer contraseña"}
            </Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="space-y-4 text-center">
          <p className="text-sm">Contraseña actualizada correctamente.</p>
          <Button className="w-full h-10" onClick={() => navigate({ to: "/login" })}>
            Ir a iniciar sesión
          </Button>
        </div>
      )}

      <div className="mt-4 text-xs text-center text-muted-foreground">
        <Link to="/login" className="hover:text-foreground">Volver al inicio de sesión</Link>
      </div>
    </AuthShell>
  );
}
