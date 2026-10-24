import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, SuperAdmin, Tenant, User } from "@/types";
import { sessionStore } from "@/lib/storage/session";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { setActiveCurrency } from "@/lib/format";
import { listUsersOfTenant } from "@/lib/storage/repositories/users.repo";
import {
  superAdminsStore,
  superSessionStore,
} from "@/lib/storage/superadmins";
import {
  loginWithPassword as svcLogin,
  logout as svcLogout,
  registerOwner as svcRegisterOwner,
  requestPasswordReset as svcRequestReset,
  resetPassword as svcResetPassword,
  changePassword as svcChangePassword,
  type LoginResult,
  type RegisterOwnerInput,
} from "@/lib/services/auth.service";

interface AuthContextValue {
  ready: boolean;
  session: Session | null;
  currentUser: User | null;
  currentTenant: Tenant | null;
  tenantUsers: User[];
  superAdmin: SuperAdmin | null;
  isImpersonating: boolean;
  /** Login por email + contraseña (usuario de tenant o super admin). */
  loginWithPassword: (email: string, password: string) => Promise<LoginResult>;
  registerOwner: (input: RegisterOwnerInput) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ code: string; expiresAt: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  refresh: () => void;
  /** Impersonación de tenants por super admin. */
  impersonateTenant: (tenantId: string) => void;
  stopImpersonation: () => void;
  /** Setter directo tras login/registro para hidratar la UI inmediatamente. */
  _setSession: (s: Session | null) => void;
  _setSuperAdminId: (id: string | null) => void;
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
    if (!session) {
      setActiveCurrency(undefined);
      return null;
    }
    const t = tenantsRepo.getById(session.tenantId);
    setActiveCurrency(t?.settings?.currency);
    return t;
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

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      const res = await svcLogin(email, password);
      if (res.kind === "super_admin") {
        setSuperAdminId(res.superAdminId ?? null);
        setSession(null);
      } else if (res.session) {
        setSession(res.session);
        setSuperAdminId(null);
      }
      return res;
    },
    [],
  );

  const registerOwner = useCallback(async (input: RegisterOwnerInput) => {
    const s = await svcRegisterOwner(input);
    setSession(s);
    setSuperAdminId(null);
  }, []);

  const logout = useCallback(() => {
    svcLogout();
    setSession(null);
    setSuperAdminId(null);
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
    loginWithPassword,
    registerOwner,
    requestPasswordReset: svcRequestReset,
    resetPassword: svcResetPassword,
    changePassword: (curr, next) => {
      if (!session) throw new Error("Sin sesión");
      return svcChangePassword(session.tenantId, session.userId, curr, next);
    },
    logout,
    refresh,
    impersonateTenant,
    stopImpersonation,
    _setSession: setSession,
    _setSuperAdminId: setSuperAdminId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
