import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { AuthError } from "@/lib/services/auth.service";
import { AuthShell, ErrorBox, Field } from "./login";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Crear cuenta — Kinflow" },
      { name: "description", content: "Crea tu box en Kinflow en menos de un minuto." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { registerOwner } = useAuth();
  const navigate = useNavigate();
  const [boxName, setBoxName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await registerOwner({ boxName, ownerName, email, password });
      navigate({ to: "/onboarding/owner" });
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Crear tu box"
      subtitle="Configura tu cuenta de admin. Tardarás menos de un minuto."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre del box">
          <Input value={boxName} onChange={(e) => setBoxName(e.target.value)} required autoFocus placeholder="Nombre de tu box" />
        </Field>
        <Field label="Tu nombre">
          <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required placeholder="Sergio Torres" />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="tu@email.com" />
        </Field>
        <Field label="Contraseña" hint="Mínimo 8 caracteres.">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" placeholder="••••••••" />
        </Field>
        {error && <ErrorBox>{error}</ErrorBox>}
        <Button type="submit" className="w-full h-10" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
        </Button>
      </form>
      <div className="mt-4 text-xs text-center text-muted-foreground">
        ¿Ya tienes cuenta? <Link to="/login" className="text-foreground hover:underline">Iniciar sesión</Link>
      </div>
    </AuthShell>
  );
}
