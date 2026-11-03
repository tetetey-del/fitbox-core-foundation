import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Bell, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  isPlatformAdmin,
  listPlatformAlerts,
  listPlatformBoxes,
  markPlatformAlertsRead,
  monthlyCharge,
  setBoxPlan,
  type PlatformAlert,
  type PlatformBox,
} from "@/lib/cloud/platform";
import { PLANS } from "@/lib/plans";
import { formatDate, toDateKey } from "@/lib/date";
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
  const [alerts, setAlerts] = useState<PlatformAlert[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      setBoxes(await listPlatformBoxes());
      setAlerts(await listPlatformAlerts());
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

  const monthly = boxes
    .filter((b) => b.status === "active" && b.plan)
    .reduce((sum, b) => sum + monthlyCharge(PLANS[b.plan!].priceMonthly, b.priceOverride, b.discountPct), 0);
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
          <p className="mt-1 text-sm">
            Cobro mensual de los boxes activos: <span className="font-semibold">{monthly.toLocaleString("es-ES")} €</span>
          </p>
        </div>
        <AlertsPanel
          alerts={alerts}
          onRead={async () => {
            await markPlatformAlertsRead();
            setAlerts(await listPlatformAlerts());
          }}
        />
        <div className="space-y-3">
          {boxes.map((b) => <BoxRow key={b.id} box={b} onSaved={load} />)}
        </div>
      </main>
    </div>
  );
}

const DISCOUNTS = [
  { label: "Sin descuento", pct: null as number | null },
  { label: "-10 %", pct: 10 },
  { label: "-20 %", pct: 20 },
  { label: "-50 %", pct: 50 },
  { label: "Gratis", pct: 100 },
];

function BoxRow({ box, onSaved }: { box: PlatformBox; onSaved: () => void }) {
  const [plan, setPlan] = useState<PlanId>(box.plan ?? "pro");
  const [status, setStatus] = useState<SubscriptionStatus>(box.status ?? "trial");
  const [trialEnd, setTrialEnd] = useState(box.trialEndsAt ? box.trialEndsAt.slice(0, 10) : "");
  const [notes, setNotes] = useState(box.notes ?? "");
  const [price, setPrice] = useState(box.priceOverride !== null ? String(box.priceOverride) : "");
  const [discount, setDiscount] = useState(box.discountPct !== null ? String(box.discountPct) : "");
  const [discountNote, setDiscountNote] = useState(box.discountNote ?? "");
  const [addAmount, setAddAmount] = useState("14");
  const [addUnit, setAddUnit] = useState<"days" | "months">("days");
  const [saving, setSaving] = useState(false);

  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
  const dirty =
    plan !== (box.plan ?? "pro") ||
    status !== (box.status ?? "trial") ||
    trialEnd !== (box.trialEndsAt ? box.trialEndsAt.slice(0, 10) : "") ||
    notes !== (box.notes ?? "") ||
    num(price) !== box.priceOverride ||
    num(discount) !== box.discountPct ||
    discountNote !== (box.discountNote ?? "");

  const startedAt = box.trialStartedAt ?? box.createdAt;
  const endDate = trialEnd ? new Date(`${trialEnd}T23:59:00`) : null;
  const totalDays = endDate ? Math.round((endDate.getTime() - new Date(startedAt).getTime()) / 86_400_000) : null;
  const daysLeft = endDate ? Math.ceil((endDate.getTime() - Date.now()) / 86_400_000) : null;
  const isNew = Date.now() - new Date(box.createdAt).getTime() < 7 * 86_400_000;
  const listPrice = PLANS[plan].priceMonthly;
  const charge = monthlyCharge(listPrice, num(price), num(discount));

  const save = async () => {
    const p = num(price);
    const d = num(discount);
    if ((p !== null && (Number.isNaN(p) || p < 0)) || (d !== null && (Number.isNaN(d) || d < 0 || d > 100))) {
      toast.error("Revisa el precio y el descuento (de 0 a 100 %)");
      return;
    }
    setSaving(true);
    try {
      await setBoxPlan({
        tenantId: box.id,
        plan,
        status,
        // La prueba termina al final de ese día.
        trialEndsAt: endDate ? endDate.toISOString() : null,
        notes: notes.trim() || null,
        priceOverride: p,
        discountPct: d,
        discountNote: discountNote.trim() || null,
      });
      toast.success(`${box.name}: guardado`);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  /** Suma días o meses a la prueba (desde el fin actual, o desde hoy si ya venció). */
  const extend = (amount: number, unit: "days" | "months") => {
    if (!amount || amount < 1) return;
    const current = endDate && endDate.getTime() > Date.now() ? new Date(endDate) : new Date();
    if (unit === "days") current.setDate(current.getDate() + amount);
    else current.setMonth(current.getMonth() + amount);
    setTrialEnd(toDateKey(current));
    setStatus("trial");
  };

  /** Prueba total de N días/meses contando desde que empezó. */
  const setTotal = (amount: number, unit: "days" | "months") => {
    if (!amount || amount < 1) return;
    const d = new Date(startedAt);
    if (unit === "days") d.setDate(d.getDate() + amount);
    else d.setMonth(d.getMonth() + amount);
    setTrialEnd(toDateKey(d));
    setStatus("trial");
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{box.name}</h3>
          {isNew && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "color-mix(in srgb, var(--brand) 20%, transparent)", color: "var(--brand)" }}>NUEVO</span>
          )}
          {box.blocked && (
            <span className="rounded border border-destructive/30 bg-destructive/20 px-1.5 py-0.5 text-[10px] font-medium text-destructive">BLOQUEADO</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {box.ownerEmail ?? "sin dueño"} · /b/{box.slug} · {box.country === "ARS" ? "Argentina" : box.country === "EUR" ? "España/Europa" : box.country ?? ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {box.members} socios · {box.coaches} coaches · {Math.max(1, box.locations)} sede{box.locations > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
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
              {(Object.keys(STATUS_LABEL) as SubscriptionStatus[]).map((st) => (
                <SelectItem key={st} value={st}>{STATUS_LABEL[st]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Notas</div>
          <Input className="h-9" value={notes} placeholder="Ej. paga por transferencia" onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      {/* Prueba */}
      <div className="space-y-2 rounded-md border border-border p-3">
        <div className="text-sm font-medium">Prueba gratis</div>
        <p className="text-xs text-muted-foreground">
          Empezó el {formatDate(startedAt.slice(0, 10))}
          {endDate && (
            <>
              {" "}· termina el {formatDate(trialEnd)} ({totalDays} días en total)
              {status === "trial" && daysLeft !== null && (daysLeft > 0 ? ` · quedan ${daysLeft} días` : " · vencida")}
            </>
          )}
          {!endDate && " · sin fecha de fin"}
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Termina el</div>
            <Input type="date" className="h-9 w-[160px]" value={trialEnd} onChange={(e) => { setTrialEnd(e.target.value); if (e.target.value) setStatus("trial"); }} />
          </div>
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Cantidad</div>
            <Input type="number" min={1} className="h-9 w-[80px]" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} />
          </div>
          <Select value={addUnit} onValueChange={(v) => setAddUnit(v as "days" | "months")}>
            <SelectTrigger className="h-9 w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="days">días</SelectItem>
              <SelectItem value="months">meses</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => setTotal(Number(addAmount), addUnit)}>Prueba total de {addAmount || "…"} {addUnit === "days" ? "días" : "meses"}</Button>
          <Button size="sm" variant="outline" onClick={() => extend(Number(addAmount), addUnit)}>Sumar {addAmount || "…"} {addUnit === "days" ? "días" : "meses"}</Button>
        </div>
      </div>

      {/* Lo que paga */}
      <div className="space-y-2 rounded-md border border-border p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-medium">Lo que paga por mes</div>
          <div className="text-sm">
            <span className="font-semibold">{charge === 0 ? "Gratis" : `${charge.toLocaleString("es-ES")} €`}</span>
            {charge !== listPrice && <span className="ml-2 text-xs text-muted-foreground line-through">{listPrice} €</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Precio propio (€/mes)</div>
            <Input type="number" min={0} step="0.01" className="h-9 w-[130px]" value={price} placeholder={`${listPrice}`} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Descuento (%)</div>
            <Input type="number" min={0} max={100} className="h-9 w-[100px]" value={discount} placeholder="0" onChange={(e) => setDiscount(e.target.value)} />
          </div>
          <div className="min-w-[160px] flex-1">
            <div className="mb-1 text-xs text-muted-foreground">Motivo</div>
            <Input className="h-9" value={discountNote} placeholder="Ej. amiga, piloto, primer año" onChange={(e) => setDiscountNote(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DISCOUNTS.map((d) => (
            <Button key={d.label} size="sm" variant={num(discount) === d.pct ? "default" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setDiscount(d.pct === null ? "" : String(d.pct))}>
              {d.label}
            </Button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Solo lo ves tú: el box ve el precio de lista de su plan.</p>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={save} disabled={!dirty || saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}

/** Avisos de la plataforma: cada box nuevo que se registra. */
function AlertsPanel({ alerts, onRead }: { alerts: PlatformAlert[]; onRead: () => void }) {
  const unread = alerts.filter((a) => !a.read_at).length;
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Bell className="h-4 w-4" strokeWidth={1.5} /> Avisos
          {unread > 0 && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "var(--brand)", color: "var(--brand-foreground)" }}>
              {unread} nuevo{unread === 1 ? "" : "s"}
            </span>
          )}
        </h2>
        {unread > 0 && (
          <Button size="sm" variant="ghost" onClick={onRead}>Marcar como vistos</Button>
        )}
      </div>
      {alerts.length === 0 ? (
        <p className="text-xs text-muted-foreground">Cuando alguien cree su box para probar Kinflow, aparece acá.</p>
      ) : (
        <ul className="divide-y divide-border">
          {alerts.slice(0, 10).map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 py-2">
              <div className="min-w-0">
                <div className={`text-sm ${a.read_at ? "text-muted-foreground" : "font-medium"}`}>{a.title}</div>
                {a.body && <div className="truncate text-xs text-muted-foreground">{a.body}</div>}
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {new Date(a.created_at).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
