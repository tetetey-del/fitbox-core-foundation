import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { ready, session, superAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (session) {
      navigate({ to: session.role === "member" ? "/feed" : "/dashboard" });
    } else if (superAdmin) {
      navigate({ to: "/admin" });
    }
  }, [ready, session, superAdmin, navigate]);

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (session || superAdmin) return null;
  return <LandingPage />;
}
