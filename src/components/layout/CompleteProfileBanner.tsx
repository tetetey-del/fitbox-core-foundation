import { Link, useRouterState } from "@tanstack/react-router";
import { UserRound, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { needsProfileData } from "@/lib/memberData";

/** Aviso al socio cuando le falta completar sus datos obligatorios (fecha de nacimiento). */
export function CompleteProfileBanner() {
  const { currentUser } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!needsProfileData(currentUser) || pathname.startsWith("/mi-cuenta")) return null;
  return (
    <Link
      to="/mi-cuenta"
      className="mb-4 flex items-center gap-3 rounded-lg border border-[#14B8A6]/40 bg-[#14B8A6]/10 p-3 text-sm hover:bg-[#14B8A6]/15 transition-colors"
    >
      <UserRound className="h-4 w-4 shrink-0 text-[#14B8A6]" strokeWidth={1.75} />
      <span className="min-w-0 flex-1">
        <span className="font-medium">Completa tus datos</span>
        <span className="block text-xs text-muted-foreground">
          Tu box necesita tu fecha de nacimiento y un contacto de emergencia.
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
    </Link>
  );
}
