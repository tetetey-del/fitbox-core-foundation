import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_MODULES, type Tenant, type TenantModules } from "@/types";
import { modulesAllowedByPlan } from "@/lib/plans";

/** Módulos activos: los que el dueño activó y que su plan incluye. */
export function useModules(): TenantModules {
  const { currentTenant } = useAuth();
  return combine(currentTenant);
}

function combine(tenant: Tenant | null | undefined): TenantModules {
  const chosen = { ...DEFAULT_MODULES, ...(tenant?.settings?.enabledModules ?? {}) };
  const allowed = modulesAllowedByPlan(tenant);
  const out = { ...chosen };
  (Object.keys(allowed) as Array<keyof TenantModules>).forEach((k) => {
    if (allowed[k] === false) out[k] = false;
  });
  return out;
}

export function tenantModules(settings?: { enabledModules?: TenantModules }, tenant?: Tenant): TenantModules {
  if (tenant) return combine(tenant);
  return { ...DEFAULT_MODULES, ...(settings?.enabledModules ?? {}) };
}
