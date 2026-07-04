import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_MODULES, type TenantModules } from "@/types";

export function useModules(): TenantModules {
  const { currentTenant } = useAuth();
  return { ...DEFAULT_MODULES, ...(currentTenant?.settings?.enabledModules ?? {}) };
}

export function tenantModules(settings?: { enabledModules?: TenantModules }): TenantModules {
  return { ...DEFAULT_MODULES, ...(settings?.enabledModules ?? {}) };
}
