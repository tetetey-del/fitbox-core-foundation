import { KinflowMark } from "@/components/brand/KinflowLogo";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AuthError } from "@/lib/services/auth.service";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { listUsersOfTenant } from "@/lib/storage/repositories/users.repo";
import { buildKey, get } from "@/lib/storage/db";
import { sessionStore } from "@/lib/storage/session";
import { cloudEnabled } from "@/lib/cloud/client";
import { cloudEnterIfSignedIn } from "@/lib/cloud/auth";
import { membershipPlansRepo } from "@/lib/storage/repositories/membershipPlans.repo";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { readBoxBrand, saveBoxBrand, type BoxBrand } from "@/lib/boxBrand";

const SEEDED_KEY = buildKey(null, "seeded");

interface LoginSearch { redirect?: string; confirmado?: boolean }

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Kinflow" },
      { name: "description", content: "Accede a tu box en Kinflow con tu email y contraseña." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    confirmado: s.confirmado === 1 || s.confirmado === "1" || s.confirmado === true ? true : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { loginWithPassword, ready, session, superAdmin, _setSession } = useAuth();
  const navigate = useNavigate();
  const { redirect, confirmado } = useSearch({ from: "/login" });

  const [brand, setBrand] = useState<BoxBrand | null>(null);
  useEffect(() => setBrand(readBoxBrand()), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (confirmado && cloudEnabled()) return; // primero entrar con la cuenta recién confirmada
    if (session) navigate({ to: redirect ?? defaultRouteFor(session.role) });
    else if (superAdmin) navigate({ to: "/admin" });
  }, [ready, session, superAdmin, navigate, redirect, confirmado]);

  // Volviendo del enlace de confirmación del email: entrar directo al box.
  useEffect(() => {
    if (!ready || !confirmado || !cloudEnabled()) return;
    let cancelled = false;
    setLoading(true);
    cloudEnterIfSignedIn()
      .then((s) => {
        if (cancelled) return;
        if (!s) {
          // Sin sesión nueva: seguir como siempre (ir al panel si ya había sesión).
          if (session) navigate({ to: defaultRouteFor(session.role) });
          return;
        }
        sessionStore.write(s);
        _setSession(s);
        // Dueño de un box recién creado (sin planes ni clases): al asistente de primeros pasos.
        const newBox =
          s.role === "admin" && membershipPlansRepo.list().length === 0 && classTemplatesRepo.list().length === 0;
        navigate({
          to: s.role === "member" ? "/onboarding/member" : newBox ? "/onboarding/owner" : defaultRouteFor(s.role),
        });
      })
      .catch((err) => setError(err instanceof AuthError ? err.message : null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, confirmado]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginWithPassword(email, password);
      if (res.kind === "super_admin") {
        navigate({ to: "/admin" });
      } else if (res.session) {
        navigate({ to: redirect ?? defaultRouteFor(res.session.role) });
      }
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle={brand ? `Entra a ${brand.name} con tu email y contraseña.` : "Accede a tu box con tu email y contraseña."}
      brand={brand}
    >
      {confirmado && !error && (
        <div className="mb-4 rounded-md border border-[#14B8A6]/40 bg-[#14B8A6]/10 px-3 py-2 text-sm">
          ¡Email confirmado! {loading ? "Entrando a tu box…" : "Ya puedes iniciar sesión."}
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            autoFocus
            placeholder="tu@email.com"
          />
        </Field>
        <Field label="Contraseña">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </Field>
        {error && <ErrorBox>{error}</ErrorBox>}
        <Button type="submit" className="w-full h-10" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
        </Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <Link to="/recuperar" className="hover:text-foreground">¿Olvidaste tu contraseña?</Link>
        {!brand && <Link to="/registro" className="hover:text-foreground">Crear cuenta</Link>}
      </div>
      {brand ? (
        <button
          type="button"
          onClick={() => {
            saveBoxBrand(null);
            setBrand(null);
          }}
          className="mt-6 w-full text-center text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          ¿No eres de {brand.name}?
        </button>
      ) : (
        <DemoAccountsPanel />
      )}
    </AuthShell>
  );
}

function defaultRouteFor(role: string): string {
  if (role === "member") return "/feed";
  return "/dashboard";
}

function DemoAccountsPanel() {
  // Aplazamos la lectura de localStorage a después del montaje para evitar
  // mismatch de hidratación SSR (el servidor no tiene localStorage).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const demoUsers = useMemo(() => {
    if (!mounted) return [];
    const seeded = get<boolean>(SEEDED_KEY, false);
    if (!seeded) return [];
    return tenantsRepo
      .list()
      .flatMap((t) => listUsersOfTenant(t.id).map((u) => ({ ...u, tenantName: t.name })))
      .filter((u) => u.passwordHash) // solo los que tienen password
      .slice(0, 8);
  }, [mounted]);

  if (!mounted || demoUsers.length === 0) return null;


  return (
    <div className="mt-6 rounded-md border border-dashed border-border p-3 text-xs">
      <div className="font-medium text-foreground mb-1.5">Cuentas de prueba</div>
      <p className="text-muted-foreground mb-2">
        Contraseña común: <code className="font-mono">demo1234</code>
      </p>
      <ul className="space-y-1 max-h-40 overflow-y-auto">
        {demoUsers.map((u) => (
          <li key={u.id} className="flex justify-between gap-2 truncate">
            <span className="text-muted-foreground truncate">
              {u.tenantName} · {u.role === "admin" ? "dueño/a" : u.role === "coach" ? "coach" : "socio/a"}
            </span>
            <span className="font-mono text-foreground truncate">{u.email}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// -------- Helpers compartidos --------
export function AuthShell({
  title,
  subtitle,
  children,
  brand,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Si se entra desde la app de un box, se muestra su logo y nombre (y Kinflow, chiquito). */
  brand?: BoxBrand | null;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <header className="h-14 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-border/60">
        {brand ? (
          <>
            <Link to="/b/$slug" params={{ slug: brand.slug }} className="flex min-w-0 items-center gap-2">
              <BoxIcon brand={brand} className="h-8 w-8" />
              <span className="truncate font-semibold tracking-tight">{brand.name}</span>
            </Link>
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
              con tecnología de <KinflowMark className="h-3.5 w-3.5" /> Kinflow
            </span>
          </>
        ) : (
          <Link to="/" className="flex items-center gap-2">
            <KinflowMark className="h-7 w-7" />
            <span className="font-semibold tracking-tight">Kinflow</span>
          </Link>
        )}
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8 rounded-xl border border-border bg-card p-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

/** Ícono del box: su logo (si lo subió) o sus iniciales sobre su color. */
export function BoxIcon({ brand, className = "h-8 w-8" }: { brand: BoxBrand; className?: string }) {
  const src = brand.appIcon?.["192"];
  if (src) return <img src={src} alt="" className={`${className} rounded-lg object-cover`} />;
  const initials = brand.name.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className={`${className} flex items-center justify-center rounded-lg text-xs font-bold text-white`}
      style={{ backgroundColor: brand.brandColor ?? "#14B8A6" }}
    >
      {initials}
    </span>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" strokeWidth={1.5} />
      <span>{children}</span>
    </div>
  );
}
