import { Clock, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PLANS, isBlocked, subscriptionOf, trialDaysLeft } from "@/lib/plans";
import { SupportContact } from "./SupportContact";
import { currentTerms } from "@/lib/placeTerms";

/** Aviso al dueño cuando faltan 5 días o menos para que termine la prueba. */
export function TrialBanner() {
  const { currentTenant, currentUser } = useAuth();
  if (currentUser?.role !== "admin") return null;
  const sub = subscriptionOf(currentTenant);
  const left = trialDaysLeft(sub);
  if (left === null || left > 5 || left <= 0) return null;
  return (
    <div className="mb-6 rounded-lg border p-4" style={{ borderColor: "color-mix(in srgb, var(--brand) 45%, transparent)", backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)" }}>
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} style={{ color: "var(--brand)" }} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="font-medium">
            Tu prueba gratis termina {left === 1 ? "mañana" : `en ${left} días`}
          </div>
          <p className="text-sm text-muted-foreground">
            ¿Te está gustando Kinflow? Si tienes alguna duda, escríbeme y lo vemos. Para seguir usando la app, elige
            un plan: Starter {PLANS.starter.priceMonthly} €, Pro {PLANS.pro.priceMonthly} € o Business {PLANS.business.priceMonthly} € al mes.
          </p>
          <div className="flex flex-wrap gap-2">
            <SupportContact compact boxName={currentTenant?.name} message={`Hola, soy de ${currentTenant?.name ?? `mi ${currentTerms().place}`}. Mi prueba de Kinflow está por terminar y quiero elegir un plan.`} />
            <Button asChild size="sm" variant="ghost">
              <Link to="/configuracion" hash="plan">Ver planes</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ¿Hay que mostrar la pantalla de bloqueo? */
export function usePlanBlocked(): boolean {
  const { currentTenant, isImpersonating } = useAuth();
  if (isImpersonating) return false;
  return isBlocked(subscriptionOf(currentTenant));
}

/** Pantalla cuando la prueba terminó o el box está bloqueado. */
export function BlockedScreen({ onLogout }: { onLogout: () => void }) {
  const { currentTenant, currentUser } = useAuth();
  const sub = subscriptionOf(currentTenant);
  const isOwner = currentUser?.role === "admin";
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-xl space-y-5 text-center">
        <Lock className="mx-auto h-10 w-10" strokeWidth={1.5} style={{ color: "var(--brand)" }} />
        {isOwner ? (
          <>
            <div>
              <h1 className="text-xl font-semibold">
                {sub.status === "trial" ? "Tu prueba gratis terminó" : `Tu ${currentTerms().place} está pausado en Kinflow`}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Tus datos están guardados y no se pierde nada. Para volver a usar la app, elige un plan y escríbeme:
                lo activo en el momento.
              </p>
            </div>
            <div className="grid gap-3 text-left sm:grid-cols-3">
              {Object.values(PLANS).map((p) => (
                <div key={p.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.priceMonthly} €/mes</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {p.highlights.slice(0, 4).map((h) => <li key={h}>· {h}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <SupportContact
              className="justify-center"
              boxName={currentTenant?.name}
              message={`Hola, soy de ${currentTenant?.name ?? `mi ${currentTerms().place}`} y quiero activar un plan de Kinflow.`}
            />
          </>
        ) : (
          <div>
            <h1 className="text-xl font-semibold">La app de {currentTenant?.name ?? `tu ${currentTerms().place}`} no está disponible</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Por el momento no se puede usar. Consulta en recepción del {currentTerms().place}.
            </p>
          </div>
        )}
        <Button variant="ghost" onClick={onLogout}>Cerrar sesión</Button>
      </div>
    </div>
  );
}
