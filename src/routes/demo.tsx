import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Dumbbell, Loader2, Smartphone, Store } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ensureDemoReady } from "@/lib/seed";
import { saveBoxBrand } from "@/lib/boxBrand";
import { AuthShell } from "./login";

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [{ title: "Demo — Kinflow" }] }),
  component: DemoPage,
});

const DEMO_PASSWORD = "demo1234";

const ROLES = [
  {
    id: "owner",
    email: "celeste@kinflow.app",
    title: "Como dueño del box",
    desc: "Panel, socios y cuotas, clases y WOD, pagos, tienda y configuración.",
    icon: Store,
    to: "/dashboard",
  },
  {
    id: "coach",
    email: "lucas@kinflow.app",
    title: "Como coach",
    desc: "Clases del día, check-in, notas de cada socio y marcas.",
    icon: Dumbbell,
    to: "/dashboard",
  },
  {
    id: "member",
    email: "sofia@kinflow.app",
    title: "Como socio",
    desc: "La app que usan tus socios en el móvil: reservas, WOD, membresía y marcas.",
    icon: Smartphone,
    to: "/feed",
  },
] as const;

/**
 * Demo de Kinflow: un box de ejemplo (Chia Training) para probar sin crear cuenta.
 * Se entra con un toque como dueño, coach o socio. Los datos viven solo en el navegador.
 */
function DemoPage() {
  const { loginWithPassword } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  const enter = async (role: (typeof ROLES)[number]) => {
    setBusy(role.id);
    try {
      await ensureDemoReady();
      // La demo no es un box real: sin marca guardada de otro box.
      saveBoxBrand(null);
      await loginWithPassword(role.email, DEMO_PASSWORD);
      navigate({ to: role.to });
    } catch {
      toast.error("No se pudo abrir la demo. Recarga la página e inténtalo de nuevo.");
      setBusy(null);
    }
  };

  return (
    <AuthShell title="Prueba Kinflow" subtitle="Un box de ejemplo con socios, clases y WODs. Entra con un toque, sin crear cuenta.">
      <div className="space-y-3">
        {ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              type="button"
              disabled={!!busy}
              onClick={() => enter(r)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-[var(--brand)] disabled:opacity-60"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "color-mix(in srgb, var(--brand) 18%, transparent)", color: "var(--brand)" }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{r.title}</span>
                <span className="block text-xs text-muted-foreground">{r.desc}</span>
              </span>
              {busy === r.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <ArrowRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Es una demo: los datos son de ejemplo y se guardan solo en este navegador.
      </p>
      <p className="mt-3 text-center text-sm">
        ¿Te convence?{" "}
        <Link to="/registro" className="font-medium underline underline-offset-2">
          Crea tu box
        </Link>
      </p>
    </AuthShell>
  );
}
