import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type Mode = "choose" | "create" | "enter";

export function LandingPage() {
  const [mode, setMode] = useState<Mode>("choose");
  const { login } = useAuth();
  const navigate = useNavigate();

  const goDashboard = () => navigate({ to: "/dashboard" });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-14 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5" strokeWidth={1.5} />
          <span className="font-semibold tracking-tight">FitBox</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {mode === "choose" && <ChooseMode onSelect={setMode} />}
          {mode === "create" && (
            <CreateBoxForm
              onCancel={() => setMode("choose")}
              onCreated={(tenantId, userId) => {
                login(tenantId, userId);
                goDashboard();
              }}
            />
          )}
          {mode === "enter" && (
            <EnterBoxForm
              onCancel={() => setMode("choose")}
              onEnter={(tenantId, userId) => {
                login(tenantId, userId);
                goDashboard();
              }}
            />
          )}
        </div>
      </main>

      <footer className="p-6 text-center text-xs text-muted-foreground">
        Demo local · Los datos se guardan en tu navegador
      </footer>
    </div>
  );
}

function ChooseMode({ onSelect }: { onSelect: (m: Mode) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Gestiona tu box</h1>
        <p className="text-sm text-muted-foreground">
          Reservas, socios, clases y PRs — todo en un solo sitio.
        </p>
      </div>
      <div className="grid gap-2">
        <Button className="h-11" onClick={() => onSelect("create")}>
          Crear mi box
        </Button>
        <Button variant="outline" className="h-11" onClick={() => onSelect("enter")}>
          Entrar en un box existente
        </Button>
      </div>
    </div>
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
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Crear box</h2>
        <p className="text-sm text-muted-foreground">Configuración inicial rápida.</p>
      </div>
      <div className="space-y-3">
        <Field label="Nombre del box">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="CrossFit Norte" />
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
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="h-10 w-14 rounded-md border border-border bg-background cursor-pointer"
            />
            <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
          </div>
        </Field>
      </div>
      <div className="flex gap-2">
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
}: {
  onCancel: () => void;
  onEnter: (tenantId: string, userId: string) => void;
}) {
  const tenants = useMemo(() => tenantsRepo.list(), []);
  const [tenantId, setTenantId] = useState<string>(tenants[0]?.id ?? "");
  const users = useMemo(() => (tenantId ? listUsersOfTenant(tenantId) : []), [tenantId]);
  const [userId, setUserId] = useState<string>("");

  if (tenants.length === 0) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-semibold tracking-tight">Aún no hay boxes</h2>
        <p className="text-sm text-muted-foreground">
          Crea uno para empezar o carga los datos demo.
        </p>
        <Button variant="outline" onClick={onCancel} className="mt-2">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Entrar en un box</h2>
        <p className="text-sm text-muted-foreground">Modo demo · sin contraseña.</p>
      </div>
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
      <div className="flex gap-2">
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
