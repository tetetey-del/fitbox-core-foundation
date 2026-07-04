import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dumbbell,
  CalendarDays,
  Users,
  Trophy,
  ArrowRight,
  Zap,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { listUsersOfTenant } from "@/lib/storage/repositories/users.repo";
import { createTenantWithSeed } from "@/lib/seed";

type Mode = "create" | "enter" | null;

export function LandingPage() {
  const [mode, setMode] = useState<Mode>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const goDashboard = () => navigate({ to: "/dashboard" });

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5" strokeWidth={1.5} />
          <span className="font-semibold tracking-tight">FitBox</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMode("enter")}>
          Entrar
        </Button>
      </header>

      <main className="flex-1">
        <Hero onCreate={() => setMode("create")} onEnter={() => setMode("enter")} />
        <Features />
        <HowItWorks />
        <FinalCta onCreate={() => setMode("create")} />
      </main>

      <footer className="border-t border-border p-6 text-center text-xs text-muted-foreground">
        Demo local · Los datos se guardan en tu navegador ·{" "}
        <span className="text-foreground">FitBox</span>
      </footer>

      <Dialog open={mode !== null} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Crear mi box" : "Entrar en un box"}
            </DialogTitle>
          </DialogHeader>
          {mode === "create" && (
            <CreateBoxForm
              onCancel={() => setMode(null)}
              onCreated={(tenantId, userId) => {
                login(tenantId, userId);
                goDashboard();
              }}
            />
          )}
          {mode === "enter" && (
            <EnterBoxForm
              onCancel={() => setMode(null)}
              onEnter={(tenantId, userId) => {
                login(tenantId, userId);
                goDashboard();
              }}
              onCreate={() => setMode("create")}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Hero({ onCreate, onEnter }: { onCreate: () => void; onEnter: () => void }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-24 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" strokeWidth={1.5} />
          Software para boxes y gimnasios boutique
        </span>
        <h1 className="mt-6 text-4xl sm:text-6xl font-semibold tracking-tighter">
          Gestiona tu box
          <br />
          <span className="text-muted-foreground">como un atleta entrena.</span>
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-sm sm:text-base text-muted-foreground">
          Reservas, socios, cuotas y PRs en una única herramienta rápida y sobria.
          Sin fricción, sin plugins, sin excusas.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Button className="h-11 px-6" onClick={onCreate}>
            Crear mi box
            <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
          </Button>
          <Button variant="outline" className="h-11 px-6" onClick={onEnter}>
            Entrar en un box existente
          </Button>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Reservas sin líos",
    desc: "Calendario semanal, lista de espera automática, check-ins y ventana de cancelación configurable.",
  },
  {
    icon: Users,
    title: "Socios y cuotas",
    desc: "Planes ilimitados o por créditos, renovaciones, historial de pagos y estado de cada socio a un vistazo.",
  },
  {
    icon: Trophy,
    title: "PRs y benchmarks",
    desc: "Registra marcas, revisa la evolución con gráficas y saca ránkings del box por ejercicio.",
  },
  {
    icon: BarChart3,
    title: "Métricas del owner",
    desc: "Ingresos, altas, ocupación por día y membresías que expiran esta semana. Decisiones con datos.",
  },
];

function Features() {
  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-lg border border-border bg-card p-6 hover:border-border/80 transition-colors"
          >
            <Icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            <h3 className="mt-3 text-base font-semibold tracking-tight">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", title: "Crea tu box", desc: "Nombre, color de marca y listo. Diez segundos." },
  { n: "02", title: "Añade planes y clases", desc: "Define tarifas y horarios recurrentes con plantillas." },
  { n: "03", title: "Invita a tus socios", desc: "Comparten reservas, PRs y créditos desde el primer día." },
];

function HowItWorks() {
  return (
    <section className="border-y border-border bg-muted/20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Empieza en tres pasos</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            De cero a operativo en menos de cinco minutos.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-lg border border-border bg-background p-6">
              <div className="text-xs font-mono text-muted-foreground">{s.n}</div>
              <h3 className="mt-2 text-base font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-20 text-center">
      <Zap className="h-6 w-6 mx-auto text-foreground" strokeWidth={1.5} />
      <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">
        Todo lo que tu box necesita.
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Prueba FitBox creando tu propio box demo. Sin registro, sin tarjeta.
      </p>
      <Button className="mt-6 h-11 px-6" onClick={onCreate}>
        Crear mi box
        <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
      </Button>
    </section>
  );
}

function CreateBoxForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (tenantId: string, userId: string) => void;
}) {
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [brandColor, setBrandColor] = useState("#F97316");

  const canSubmit = name && ownerName && email;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const { tenant, owner } = createTenantWithSeed({
      name,
      ownerName,
      ownerEmail: email,
      brandColor,
    });
    onCreated(tenant.id, owner.id);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nombre del box">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="CrossFit Norte" autoFocus />
      </Field>
      <Field label="Tu nombre">
        <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Sergio Torres" />
      </Field>
      <Field label="Email">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
      </Field>
      <Field label="Color de marca">
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label="Color de marca"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="h-10 w-14 rounded-md border border-border bg-background cursor-pointer"
          />
          <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
        </div>
      </Field>
      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1 h-10" disabled={!canSubmit}>
          Crear box
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function EnterBoxForm({
  onCancel,
  onEnter,
  onCreate,
}: {
  onCancel: () => void;
  onEnter: (tenantId: string, userId: string) => void;
  onCreate: () => void;
}) {
  const tenants = useMemo(() => tenantsRepo.list(), []);
  const [tenantId, setTenantId] = useState<string>(tenants[0]?.id ?? "");
  const users = useMemo(() => (tenantId ? listUsersOfTenant(tenantId) : []), [tenantId]);
  const [userId, setUserId] = useState<string>("");

  if (tenants.length === 0) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Todavía no hay ningún box en este navegador. Crea uno para empezar.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={onCreate}>Crear mi box</Button>
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Field label="Box">
        <Select value={tenantId} onValueChange={(v) => { setTenantId(v); setUserId(""); }}>
          <SelectTrigger className="h-10"><SelectValue placeholder="Selecciona un box" /></SelectTrigger>
          <SelectContent>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Usuario">
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger className="h-10"><SelectValue placeholder="Selecciona un usuario" /></SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name} — {u.role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="flex gap-2 pt-1">
        <Button
          className="flex-1 h-10"
          disabled={!tenantId || !userId}
          onClick={() => onEnter(tenantId, userId)}
        >
          Entrar
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
