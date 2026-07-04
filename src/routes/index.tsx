import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { ready, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && session) navigate({ to: "/dashboard" });
  }, [ready, session, navigate]);

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (session) return null;
  return <LandingPage />;
}
