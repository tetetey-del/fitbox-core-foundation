import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { Award, ClipboardList, LineChart, ShoppingBag, Trophy } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/hooks/useModules";

const ProgressPanel = lazy(() => import("@/components/health/ProgressPanel"));

export const Route = createFileRoute("/mas")({
  head: () => ({ meta: [{ title: "Más — Kinflow" }] }),
  component: MorePage,
});

/** "Más" del socio: retos, marcas, rutinas, tienda y progreso, cada uno una sola vez. */
function MorePage() {
  const { session, currentUser } = useAuth();
  const modules = useModules();
  const [showProgress, setShowProgress] = useState(false);
  if (!session || !currentUser) return <AppLayout>{null}</AppLayout>;

  const items = [
    modules.challenges && {
      to: "/retos",
      label: "Retos",
      hint: "Retos e insignias",
      icon: Award,
      color: "#F59E0B",
    },
    modules.prs && {
      to: "/prs",
      label: "Mis marcas",
      hint: "PRs y benchmarks",
      icon: Trophy,
      color: "#A3E635",
    },
    modules.programs && {
      to: "/rutinas",
      label: "Rutinas",
      hint: "Tus programas",
      icon: ClipboardList,
      color: "#38BDF8",
    },
    modules.shop && {
      to: "/tienda",
      label: "Tienda",
      hint: "Pide y recoge en el box",
      icon: ShoppingBag,
      color: "#F472B6",
    },
  ].filter(Boolean) as {
    to: string;
    label: string;
    hint: string;
    icon: typeof Award;
    color: string;
  }[];

  return (
    <AppLayout>
      <PageHeader title="Más" description="Retos, marcas, rutinas y tienda de tu box." />
      <div className="grid max-w-3xl grid-cols-2 gap-3">
        {items.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${m.color}22`, color: m.color }}
            >
              <m.icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="mt-3 text-sm font-semibold">{m.label}</div>
            <div className="text-xs text-muted-foreground">{m.hint}</div>
          </Link>
        ))}
        {modules.health && (
          <button
            type="button"
            onClick={() => setShowProgress((v) => !v)}
            className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#A78BFA22", color: "#A78BFA" }}
            >
              <LineChart className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="mt-3 text-sm font-semibold">Mi progreso</div>
            <div className="text-xs text-muted-foreground">
              {showProgress ? "Ocultar" : "Peso y medidas"}
            </div>
          </button>
        )}
      </div>
      {modules.health && showProgress && (
        <div className="mt-5 max-w-3xl">
          <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Cargando…</div>}>
            <ProgressPanel userId={currentUser.id} tenantId={session.tenantId} canEdit />
          </Suspense>
        </div>
      )}
    </AppLayout>
  );
}
