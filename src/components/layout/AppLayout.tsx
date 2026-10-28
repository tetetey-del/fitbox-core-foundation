import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertOctagon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { CompleteProfileBanner } from "./CompleteProfileBanner";
import { OfferBanner } from "./OfferBanner";
import { PushPrompt } from "@/components/member/PushControls";
import { registerServiceWorker } from "@/lib/cloud/push";
import { Button } from "@/components/ui/button";
import { scanExpiringMembershipsForTenant } from "@/lib/services/notifications.service";
import { syncCycleWods } from "@/lib/services/wodCycle.service";
import { notifyDataChanged } from "@/lib/data-bus";

// El ciclo de programación se pone al día una vez por carga y por box.
const cycleSynced = new Set<string>();

export function AppLayout({ children }: { children: ReactNode }) {
  const { ready, session, currentTenant, isImpersonating, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !session) navigate({ to: "/login" });
  }, [ready, session, navigate]);

  // Service worker para las notificaciones push (solo boxes reales).
  useEffect(() => {
    if (session?.cloud) registerServiceWorker();
  }, [session?.cloud]);

  useEffect(() => {
    if (currentTenant?.id) scanExpiringMembershipsForTenant(currentTenant.id);
  }, [currentTenant?.id]);

  // Staff: deja puestos los WODs del ciclo de programación de las próximas semanas.
  useEffect(() => {
    if (!ready || !session || session.role === "member" || cycleSynced.has(session.tenantId)) return;
    cycleSynced.add(session.tenantId);
    try {
      if (syncCycleWods() > 0) notifyDataChanged();
    } catch {
      /* nada */
    }
  }, [ready, session]);

  if (!ready) return <div className="min-h-dvh bg-background" />;
  if (!session || !currentTenant) return null;

  if (currentTenant.status === "suspended" && !isImpersonating) {
    return (
      <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <AlertOctagon className="h-10 w-10 mx-auto text-destructive" strokeWidth={1.5} />
          <h1 className="mt-4 text-xl font-semibold">Box suspendido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {currentTenant.name} está temporalmente desactivado por la plataforma.
            Contacta con soporte para más información.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => { logout(); navigate({ to: "/login" }); }}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground pt-[env(safe-area-inset-top)]">
      <ImpersonationBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
            <OfferBanner />
            <PushPrompt />
            <CompleteProfileBanner />
            {children}
          </main>
          <MobileNav />
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <span aria-hidden className="mt-2 block h-1 w-10 rounded-full" style={{ backgroundColor: "var(--brand)" }} />
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
