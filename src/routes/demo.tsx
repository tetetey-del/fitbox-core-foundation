import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Dumbbell, Loader2, Smartphone, Store } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ensureDemoProfileReady } from "@/lib/seed";
import { saveBoxBrand } from "@/lib/boxBrand";
import { AuthShell } from "./login";

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [{ title: "Demo — Kinflow" }] }),
  component: () => <DemoChooser country="es" />,
});

const DEMO_PASSWORD = "demo1234";

type Country = "es" | "ar" | "bora";

interface DemoRole {
  id: string;
  email: string;
  title: string;
  desc: string;
  icon: typeof Store;
  to: string;
}

const ROLES: Record<Country, DemoRole[]> = {
  es: [
    { id: "owner", email: "marta@kinflow.app", title: "Como dueño del box", desc: "Panel, socios y cuotas, clases y WOD, pagos, tienda y configuración.", icon: Store, to: "/dashboard" },
    { id: "coach", email: "lucas@kinflow.app", title: "Como coach", desc: "Clases del día, check-in, notas de cada socio y marcas.", icon: Dumbbell, to: "/dashboard" },
    { id: "member", email: "sofia@kinflow.app", title: "Como socio", desc: "La app que usan tus socios en el móvil: reservas, WOD, membresía y marcas.", icon: Smartphone, to: "/feed" },
  ],
  ar: [
    { id: "owner", email: "valeria.ar@kinflow.app", title: "Como dueño del box", desc: "Panel, socios y cuotas, clases y WOD, pagos, tienda y configuración.", icon: Store, to: "/dashboard" },
    { id: "coach", email: "nico.ar@kinflow.app", title: "Como coach", desc: "Clases del día, check-in, notas de cada socio y marcas.", icon: Dumbbell, to: "/dashboard" },
    { id: "member", email: "sofi.ar@kinflow.app", title: "Como socio", desc: "La app que usan tus socios en el celu: reservas, WOD, membresía y marcas.", icon: Smartphone, to: "/feed" },
  ],
  bora: [
    { id: "owner", email: "pau.bora@kinflow.app", title: "Como dueña del box", desc: "Panel, alumnos y cuotas, clases y WOD, pagos, tienda y configuración.", icon: Store, to: "/dashboard" },
    { id: "coach", email: "nico.bora@kinflow.app", title: "Como coach", desc: "Clases del día, check-in, notas de cada alumno y marcas.", icon: Dumbbell, to: "/dashboard" },
    { id: "member", email: "sofi.bora@kinflow.app", title: "Como alumno", desc: "La app que usarían tus alumnos en el celu: reservas, WOD, cuota y marcas.", icon: Smartphone, to: "/feed" },
  ],
};

const TEXTS: Record<Country, { title: string; subtitle: string; note: string; ask: string; cta: string; error: string }> = {
  es: {
    title: "Prueba Kinflow",
    subtitle: "Un box de ejemplo con socios, clases y WODs. Entra con un toque, sin crear cuenta.",
    note: "Es una demo: los datos son de ejemplo y se guardan solo en este navegador.",
    ask: "¿Te convence?",
    cta: "Crea tu box",
    error: "No se pudo abrir la demo. Recarga la página e inténtalo de nuevo.",
  },
  ar: {
    title: "Probá Kinflow",
    subtitle: "Un box de ejemplo en pesos, con socios, clases y WODs. Entrá con un toque, sin crear cuenta.",
    note: "Es una demo: los datos son de ejemplo y se guardan solo en este navegador.",
    ask: "¿Te convence?",
    cta: "Creá tu box",
    error: "No se pudo abrir la demo. Recargá la página y probá de nuevo.",
  },
  bora: {
    title: "BORA en Kinflow",
    subtitle: "Así se vería la app de BORA: tus clases, tus horarios y tus planes. Entrá con un toque, sin crear cuenta.",
    note: "Es una demo: los alumnos y los datos son de ejemplo y se guardan solo en este navegador.",
    ask: "¿Te gusta?",
    cta: "Creá tu box",
    error: "No se pudo abrir la demo. Recargá la página y probá de nuevo.",
  },
};

/**
 * Demo de Kinflow: un box de ejemplo (Chia Training) para probar sin crear cuenta.
 * Se entra con un toque como dueño, coach o socio. Los datos viven solo en el navegador.
 */
export function DemoChooser({ country }: { country: Country }) {
  const { loginWithPassword } = useAuth();
  const t = TEXTS[country];
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  const enter = async (role: DemoRole) => {
    setBusy(role.id);
    try {
      await ensureDemoProfileReady(country);
      // La demo no es un box real: sin marca guardada de otro box.
      saveBoxBrand(null);
      await loginWithPassword(role.email, DEMO_PASSWORD);
      navigate({ to: role.to });
    } catch {
      toast.error(t.error);
      setBusy(null);
    }
  };

  return (
    <AuthShell title={t.title} subtitle={t.subtitle}>
      <div className="space-y-3">
        {ROLES[country].map((r) => {
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
        {t.note}
      </p>
      <p className="mt-3 text-center text-sm">
        {t.ask}{" "}
        <Link to="/registro" className="font-medium underline underline-offset-2">
          {t.cta}
        </Link>
      </p>
    </AuthShell>
  );
}
