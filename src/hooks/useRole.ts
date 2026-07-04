import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types";

export function useRole() {
  const { currentUser } = useAuth();
  const role: UserRole | null = currentUser?.role ?? null;

  return {
    role,
    is: (r: UserRole) => role === r,
    isAny: (roles: UserRole[]) => (role ? roles.includes(role) : false),
  };
}
