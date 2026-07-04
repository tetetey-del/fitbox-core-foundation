import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useModules } from "./useModules";
import type { TenantModules } from "@/types";

/** Redirige al dashboard si el módulo está desactivado. */
export function useRequireModule(module: keyof TenantModules): boolean {
  const modules = useModules();
  const navigate = useNavigate();
  const enabled = modules[module];
  useEffect(() => {
    if (!enabled) {
      toast.error(`El módulo "${module}" está desactivado`);
      navigate({ to: "/dashboard" });
    }
  }, [enabled, module, navigate]);
  return enabled;
}
