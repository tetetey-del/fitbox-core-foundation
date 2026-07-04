import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout({ children }: { children: ReactNode }) {
  const { ready, session, currentTenant } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !session) navigate({ to: "/" });
  }, [ready, session, navigate]);

  useEffect(() => {
    if (currentTenant?.brandColor) {
      document.documentElement.style.setProperty("--brand", currentTenant.brandColor);
    }
  }, [currentTenant?.brandColor]);

  if (!ready) {
    return <div className="min-h-screen bg-background" />;
  }
  if (!session || !currentTenant) return null;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
