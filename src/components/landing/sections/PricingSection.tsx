import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "../animations";

interface Plan {
  name: string;
  monthly: number;
  featured?: boolean;
  desc: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    monthly: 29,
    desc: "Para boxes pequeños que empiezan.",
    features: ["Hasta 50 socios", "Reservas y cuotas", "1 admin y 1 coach", "Feed básico", "Soporte por email"],
  },
  {
    name: "Pro",
    monthly: 59,
    featured: true,
    desc: "Para boxes en crecimiento.",
    features: ["Socios ilimitados", "Todos los módulos", "PRs y leaderboard", "Temas y logo personalizado", "Coaches ilimitados", "Notificaciones internas"],
  },
  {
    name: "Business",
    monthly: 99,
    desc: "Para cadenas y multi-box.",
    features: ["Todo lo del plan Pro", "Multi-box con panel global", "Exportación de datos", "Soporte prioritario", "Onboarding personalizado"],
  },
];

/** Sección de precios con selector mensual/anual. */
export function PricingSection({ onCreate }: { onCreate: () => void }) {
  const [annual, setAnnual] = useState(false);
  const price = (m: number) => (annual ? Math.round(m * 12 * 0.8) : m);
  return (
    <section id="pricing" className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-full fb-gradient-anim"
        style={{
          background:
            "radial-gradient(45% 45% at 50% 20%, rgba(249,115,22,0.16) 0%, transparent 70%), radial-gradient(35% 40% at 15% 70%, rgba(251,146,60,0.10) 0%, transparent 70%), radial-gradient(35% 40% at 85% 70%, rgba(252,211,77,0.10) 0%, transparent 70%)",
        }}
      />
      <div className="text-center max-w-2xl mx-auto">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Planes que crecen contigo</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Empieza gratis 14 días. Cambia o cancela cuando quieras.
          </p>
        </Reveal>
        <Reveal delay={140}>
          <div className="mt-6 inline-flex items-center rounded-full border border-border p-1 text-xs">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`px-4 h-8 rounded-full font-medium transition-colors ${
                !annual ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`px-4 h-8 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                annual ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              Anual
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F97316]/15 text-[#F97316] font-semibold">
                -20%
              </span>
            </button>
          </div>
        </Reveal>
      </div>
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {PLANS.map((p, i) => (
          <Reveal key={p.name} delay={i * 80}>
            {p.featured ? (
              <div className="relative h-full rounded-xl p-[1.5px] bg-gradient-to-br from-[#F97316] via-[#FB923C] to-[#FCD34D]">
                <div className="relative rounded-[10px] bg-card p-6 h-full flex flex-col">
                  <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wide shadow-lg">
                    Más popular
                  </span>
                  <PlanBody plan={p} price={price(p.monthly)} annual={annual} onCreate={onCreate} />
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl border border-border bg-card p-6 h-full flex flex-col transition-colors hover:border-[#F97316]/40">
                <PlanBody plan={p} price={price(p.monthly)} annual={annual} onCreate={onCreate} />
              </div>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function PlanBody({
  plan,
  price,
  annual,
  onCreate,
}: {
  plan: Plan;
  price: number;
  annual: boolean;
  onCreate: () => void;
}) {
  return (
    <>
      <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{plan.desc}</p>
      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight">{price}€</span>
        <span className="text-xs text-muted-foreground">/ {annual ? "año" : "mes"}</span>
      </div>
      {annual && (
        <div className="text-[11px] mt-1 text-[#F97316]">
          Equivale a {Math.round(plan.monthly * 0.8)}€/mes
        </div>
      )}
      <ul className="mt-6 space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#F97316]" strokeWidth={1.5} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button className="mt-6 h-10" variant={plan.featured ? "default" : "outline"} onClick={onCreate}>
        Empezar con {plan.name}
      </Button>
    </>
  );
}
