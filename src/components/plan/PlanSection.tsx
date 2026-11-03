import { Check, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PLANS, PLAN_FEATURE_LABEL, countActive, planOf, subscriptionOf, trialDaysLeft } from "@/lib/plans";
import { formatDate } from "@/lib/date";
import { SupportContact } from "./SupportContact";

/** Configuración → Tu plan y ayuda. Solo el dueño. */
export function PlanSection() {
  const { currentTenant } = useAuth();
  const sub = subscriptionOf(currentTenant);
  const plan = planOf(currentTenant);
  const left = trialDaysLeft(sub);
  const members = countActive("member");
  const coaches = countActive("coach");
  const missing = (Object.keys(PLAN_FEATURE_LABEL) as Array<keyof typeof PLAN_FEATURE_LABEL>).filter(
    (f) => !plan.features.includes(f),
  );

  const statusText =
    sub.status === "trial"
      ? left !== null && left > 0
        ? `Prueba gratis · quedan ${left} día${left === 1 ? "" : "s"}${sub.trialEndsAt ? ` (hasta el ${formatDate(sub.trialEndsAt.slice(0, 10))})` : ""}`
        : "La prueba gratis terminó"
      : sub.status === "blocked"
        ? "Bloqueado"
        : "Activo";

  return (
    <>
      <section id="plan" className="scroll-mt-20 space-y-4 rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Crown className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--brand)" }} />
              Tu plan: {plan.name}
            </h2>
            <p className="text-sm text-muted-foreground">{statusText}</p>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold">{plan.priceMonthly} € / mes</div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <Usage label="Socios" value={members} max={plan.maxMembers} />
          <Usage label="Coaches" value={coaches} max={plan.maxCoaches} />
          <Usage label="Sedes" value={1} max={plan.maxLocations} />
        </div>

        <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
          {plan.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} style={{ color: "var(--brand)" }} />
              {h}
            </li>
          ))}
        </ul>

        {missing.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Con el plan Pro sumas: {missing.map((f) => PLAN_FEATURE_LABEL[f]).join(", ")}.
          </p>
        )}

        <details className="rounded-md border border-border p-3 text-sm">
          <summary className="cursor-pointer font-medium">Ver todos los planes</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {Object.values(PLANS).map((p) => (
              <div key={p.id} className={`rounded-md border p-3 ${p.id === plan.id ? "border-[var(--brand)]" : "border-border"}`}>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.priceMonthly} €/mes</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {p.highlights.map((h) => <li key={h}>· {h}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Para cambiar de plan, escríbeme y lo cambio en el momento.</p>
        </details>
      </section>

      <section id="ayuda" className="scroll-mt-20 space-y-3 rounded-lg border border-border bg-card p-6">
        <div>
          <h2 className="text-base font-semibold">¿Necesitas ayuda?</h2>
          <p className="text-sm text-muted-foreground">
            Dudas, problemas o ideas para la app: escríbeme directamente, sea por WhatsApp o por email.
          </p>
        </div>
        <SupportContact boxName={currentTenant?.name} />
      </section>
    </>
  );
}

function Usage({ label, value, max }: { label: string; value: number; max: number | null }) {
  const full = max !== null && value >= max;
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${full ? "text-amber-400" : ""}`}>
        {value}
        <span className="text-sm font-normal text-muted-foreground"> / {max === null ? "ilimitados" : max}</span>
      </div>
    </div>
  );
}
