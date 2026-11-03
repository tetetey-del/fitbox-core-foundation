import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isPlatformAdmin, listPlatformBoxes, setBoxPlan, type PlatformBox } from "@/lib/cloud/platform";
import { PLANS } from "@/lib/plans";
import { formatDate } from "@/lib/date";
import type { PlanId, SubscriptionStatus } from "@/types";

export const Route = createFileRoute("/plataforma")({
  head: () => ({ meta: [{ title: "Plataforma — Kinflow" }, { name: "robots", content: "noindex" }] }),
  component: PlatformPage,
});

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: "Prueba",
  active: "Activo (pagó)",
  blocked: "Bloqueado",
};

/** Panel de Celeste: todos los boxes reales, su plan y su estado. */
function PlatformPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [boxes, setBoxes] = useState<PlatformBox[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setBoxes(await listPlatformBoxes());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    isPlatformAdmin().then((ok) => {
      setAllowed(ok);
      if (ok) load();
    });
  }, []);

  if (allowed === null) return <div className="min-h-dvh bg-background" />;
  if (!allowed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6 text-center text-foreground">
        <div>
          <p className="text-sm text-muted-foreground">Esta página es solo para la plataforma. Inicia sesión con tu cuenta.</p>
          <Button asChild className="mt-4"><Link to="/login">Iniciar sesión</Link></Button>
        </div>
      </div>
    );
  }

  const counts = {
    total: boxes.length,
    trial: boxes.filter((b) => b.status === "trial" && !b.blocked).length,
    active: boxes.filter((b) => b.status === "active").length,
    blocked: boxes.filter((b) => b.blocked).length,
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" strokeWidth={1.5} />
          <span className="font-semibold">Plataforma Kinflow</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" strokeWidth={1.5} /> Actualizar
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" strokeWidth={1.5} /> Mi box</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Boxes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {counts.total} en total · {counts.trial} en prueba · {counts.active} activos · {counts.blocked} bloqueados.
            Un box en prueba se bloquea solo cuando termina la prueba, hasta que lo pases a "Activo".
          </p>
        </div>
        <div className="space-y-3">
          {boxes.map((b) => <BoxRow key={b.id} box={b} onSaved={load} />)}
        </div>
      </main>
    </div>
  );
}

function BoxRow({ box, onSaved }: { box: PlatformBox; onSaved: () => void }) {
  const [plan, setPlan] = useState<PlanId>(box.plan ?? "pro");
  const [status, setStatus] = useState<SubscriptionStatus>(box.status ?? "trial");
  const [trialEnd, setTrialEnd] = useState(box.trialEndsAt ? box.trialEndsAt.slice(0, 10) : "");
  const [notes, setNotes] = useState(box.notes ?? "");
  const [saving, setSaving] = useState(false);

  const dirty =
    plan !== (box.plan ?? "pro") ||
    status !== (box.status ?? "trial") ||
    trialEnd !== (box.trialEndsAt ? box.trialEndsAt.slice(0, 10) : "") ||
    notes !== (box.notes ?? "");

  const daysLeft = box.trialEndsAt ? Math.ceil((new Date(box.trialEndsAt).getTime() - Date.now()) / 86_400_000) : null;

  const save = async () => {
    setSaving(true);
    try {
      await setBoxPlan({
        tenantId: box.id,
        plan,
        status,
        // La prueba termina al final de ese día.
        trialEndsAt: trialEnd ? new Date(`${trialEnd}T23:59:00`).toISOString() : null,
        notes: notes.trim() || null,
      });
      toast.success(`${box.name}: guardado`);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const extend = (days: number) => {
    const base = new Date(Math.max(Date.now(), box.trialEndsAt ? new Date(box.trialEndsAt).getTime() : 0));
    base.setDate(base.getDate() + days);
    setTrialEnd(base.toISOString().slice(0, 10));
    setStatus("trial");
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{box.name}</h3>
            {box.blocked && (
              <span className="rounded border border-destructive/30 bg-destructive/20 px-1.5 py-0.5 text-[10px] font-medium text-destructive">BLOQUEADO</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {box.ownerEmail ?? "sin dueño"} · /b/{box.slug} · creado {formatDate(box.createdAt.slice(0, 10))}
          </p>
          <p className="text-xs text-muted-foreground">
            {box.members} socios · {box.coaches} coaches
            {box.status === "trial" && daysLeft !== null && (daysLeft > 0 ? ` · prueba: quedan ${daysLeft} días` : " · prueba vencida")}
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Plan</div>
          <Select value={plan} onValueChange={(v) => setPlan(v as PlanId)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.values(PLANS).map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name} · {p.priceMonthly} €</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Estado</div>
          <Select value={status} onValueChange={(v) => setStatus(v as SubscriptionStatus)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABEL) as SubscriptionStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Fin de la prueba</div>
          <Input type="date" className="h-9" value={trialEnd} onChange={(e) => setTrialEnd(e.target.value)} disabled={status !== "trial"} />
        </div>
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Notas</div>
          <Input className="h-9" value={notes} placeholder="Ej. paga por transferencia" onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => extend(14)}>Prueba +14 días</Button>
        <Button size="sm" variant="outline" onClick={() => extend(90)}>Prueba +3 meses</Button>
        <Button size="sm" onClick={save} disabled={!dirty || saving} className="ml-auto">
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
