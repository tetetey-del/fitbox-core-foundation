import { useNavigate } from "@tanstack/react-router";
import { Shield, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function ImpersonationBanner() {
  const { isImpersonating, currentTenant, stopImpersonation } = useAuth();
  const navigate = useNavigate();
  if (!isImpersonating || !currentTenant) return null;

  const back = () => {
    stopImpersonation();
    navigate({ to: "/admin" });
  };

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs text-amber-100"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Shield className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        <span className="truncate">
          Estás viendo <strong className="font-semibold">{currentTenant.name}</strong>{" "}
          como super admin.
        </span>
      </div>
      <button
        type="button"
        onClick={back}
        className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 px-2 py-1 hover:bg-amber-500/20"
        aria-label="Volver al panel de super admin"
      >
        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        Volver al panel
      </button>
    </div>
  );
}
