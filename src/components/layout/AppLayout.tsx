import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertOctagon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: ReactNode }) {
  const { ready, session, currentTenant, isImpersonating, logout, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !session) navigate({ to: "/" });
  }, [ready, session, navigate]);

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
          <Button className="mt-6" variant="outline" onClick={() => { logout(); navigate({ to: "/" }); }}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <ImpersonationBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8">{children}</main>
          <MobileNav />
        </div>
      </div>
      {/* silencia warnings de variables no usadas */}
      <span className="hidden">{isImpersonating ? stopImpersonation : null}</span>
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
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
