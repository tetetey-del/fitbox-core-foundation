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
import { toast } from "sonner";
import { sessionStore } from "@/lib/storage/session";
import { cloudAttach, cloudAuthUserId, cloudChangePassword, cloudEnterIfSignedIn, cloudLogout, cloudResume } from "@/lib/cloud/auth";
import { cloudEnabled, sb } from "@/lib/cloud/client";
import { onCloudSync } from "@/lib/cloud/sync";
import { notificationsRepoFor } from "@/lib/storage/repositories/notifications.repo";
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
  requestPasswordReset: (email: string) => Promise<{ code: string; expiresAt: string; cloud?: boolean }>;
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

/**
 * Boxes reales: cuando llega un aviso nuevo desde el servidor (por ejemplo, "¡Has pasado de
 * lista de espera!"), se muestra un cartel en pantalla además del número en la campanita.
 * La primera vez solo se anotan los que ya había (salvo los de los últimos 10 minutos).
 */
const seenNotifications = new Set<string>();
let notificationsPrimed = false;
function announceNewNotifications(): void {
  const s = sessionStore.read();
  if (!s?.cloud) return;
  const mine = notificationsRepoFor(s.tenantId)
    .query({ userId: s.userId })
    .filter((n) => !n.read);
  const recent = Date.now() - 10 * 60_000;
  for (const n of mine) {
    if (seenNotifications.has(n.id)) continue;
    seenNotifications.add(n.id);
    if (notificationsPrimed || new Date(n.createdAt).getTime() > recent) {
      toast(n.title, { description: n.body, duration: 8000 });
    }
  }
  notificationsPrimed = true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [superAdminId, setSuperAdminId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const stored = sessionStore.read();
    setSession(stored);
    setSuperAdminId(superSessionStore.read()?.superAdminId ?? null);
    setReady(true);
    // Box real: reconectar con Supabase y traer los datos al día.
    if (stored?.cloud) {
      cloudAttach(stored);
      void cloudResume(stored).then((s) => {
        if (!s) sessionStore.clear();
        else sessionStore.write(s);
        setSession(s);
        refresh();
      });
    }
    // Si en este navegador se entra con otra cuenta de Supabase (por ejemplo, al tocar el
    // enlace de confirmación de un socio nuevo), la app pasa a esa cuenta.
    let authSub: { unsubscribe: () => void } | null = null;
    if (cloudEnabled()) {
      authSub = sb().auth.onAuthStateChange((event, s) => {
        const current = sessionStore.read();
        if (event === "SIGNED_OUT" && current?.cloud) {
          sessionStore.clear();
          setSession(null);
          return;
        }
        if (event !== "SIGNED_IN" || !s?.user) return;
        const known = cloudAuthUserId();
        if (current?.cloud && known && known !== s.user.id) {
          // Fuera del callback de Supabase (no se puede llamar a la API desde adentro).
          setTimeout(() => {
            void cloudEnterIfSignedIn()
              .then((next) => {
                if (next) {
                  sessionStore.write(next);
                  setSession(next);
                  refresh();
                }
              })
              .catch(() => {});
          }, 0);
        }
      }).data.subscription;
    }
    const off = onCloudSync((e) => {
      if (e.type === "pulled") {
        announceNewNotifications();
        refresh();
      }
      else toast.error(e.message);
    });
    return () => {
      off();
      authSub?.unsubscribe();
    };
  }, [refresh]);

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
    if (sessionStore.read()?.cloud) void cloudLogout();
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
      if (session.cloud) return cloudChangePassword(curr, next);
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
