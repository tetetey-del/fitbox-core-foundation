import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, SuperAdmin, Tenant, User, UserRole } from "@/types";
import { sessionStore } from "@/lib/storage/session";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { listUsersOfTenant } from "@/lib/storage/repositories/users.repo";
import {
  superAdminsStore,
  superSessionStore,
} from "@/lib/storage/superadmins";

interface AuthContextValue {
  ready: boolean;
  session: Session | null;
  currentUser: User | null;
  currentTenant: Tenant | null;
  tenantUsers: User[];
  /** Super admin activo (con o sin impersonación). */
  superAdmin: SuperAdmin | null;
  /** Sesión actual es una impersonación del super admin. */
  isImpersonating: boolean;
  login: (tenantId: string, userId: string) => void;
  logout: () => void;
  switchTenant: (tenantId: string, userId: string) => void;
  switchUser: (userId: string) => void;
  refresh: () => void;
  loginAsSuperAdmin: (superAdminId: string) => void;
  logoutSuperAdmin: () => void;
  impersonateTenant: (tenantId: string) => void;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [superAdminId, setSuperAdminId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setSession(sessionStore.read());
    setSuperAdminId(superSessionStore.read()?.superAdminId ?? null);
    setReady(true);
  }, []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const superAdmin = useMemo<SuperAdmin | null>(() => {
    if (!superAdminId) return null;
    return superAdminsStore.getById(superAdminId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [superAdminId, tick]);

  const currentTenant = useMemo<Tenant | null>(() => {
    if (!session) return null;
    return tenantsRepo.getById(session.tenantId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, tick]);

  const tenantUsers = useMemo<User[]>(() => {
    if (!session) return [];
    return listUsersOfTenant(session.tenantId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, tick]);

  const currentUser = useMemo<User | null>(() => {
    if (!session) return null;
    return tenantUsers.find((u) => u.id === session.userId) ?? null;
  }, [session, tenantUsers]);

  const login = useCallback((tenantId: string, userId: string) => {
    const users = listUsersOfTenant(tenantId);
    const u = users.find((x) => x.id === userId);
    if (!u) return;
    const s: Session = { tenantId, userId, role: u.role as UserRole };
    sessionStore.write(s);
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    sessionStore.clear();
    setSession(null);
  }, []);

  const switchTenant = useCallback(
    (tenantId: string, userId: string) => login(tenantId, userId),
    [login],
  );

  const switchUser = useCallback(
    (userId: string) => {
      if (!session) return;
      login(session.tenantId, userId);
    },
    [session, login],
  );

  const loginAsSuperAdmin = useCallback((id: string) => {
    superSessionStore.write({ superAdminId: id });
    setSuperAdminId(id);
    sessionStore.clear();
    setSession(null);
  }, []);

  const logoutSuperAdmin = useCallback(() => {
    superSessionStore.clear();
    setSuperAdminId(null);
    sessionStore.clear();
    setSession(null);
  }, []);

  const impersonateTenant = useCallback(
    (tenantId: string) => {
      if (!superAdminId) return;
      const users = listUsersOfTenant(tenantId);
      const admin = users.find((u) => u.role === "admin") ?? users[0];
      if (!admin) return;
      const s: Session = {
        tenantId,
        userId: admin.id,
        role: admin.role,
        impersonatedBy: superAdminId,
      };
      sessionStore.write(s);
      setSession(s);
    },
    [superAdminId],
  );

  const stopImpersonation = useCallback(() => {
    sessionStore.clear();
    setSession(null);
  }, []);

  const value: AuthContextValue = {
    ready,
    session,
    currentUser,
    currentTenant,
    tenantUsers,
    superAdmin,
    isImpersonating: !!session?.impersonatedBy,
    login,
    logout,
    switchTenant,
    switchUser,
    refresh,
    loginAsSuperAdmin,
    logoutSuperAdmin,
    impersonateTenant,
    stopImpersonation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
