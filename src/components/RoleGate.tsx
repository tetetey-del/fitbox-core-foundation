import type { ReactNode } from "react";
import type { UserRole } from "@/types";
import { useRole } from "@/hooks/useRole";

interface Props {
  allowed: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ allowed, children, fallback = null }: Props) {
  const { isAny } = useRole();
  if (!isAny(allowed)) return <>{fallback}</>;
  return <>{children}</>;
}
