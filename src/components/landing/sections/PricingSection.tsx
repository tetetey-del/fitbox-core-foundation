import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "../animations";
import { useT, type LandingCopy } from "../i18n";

type PlanName = keyof LandingCopy["pricing"]["plans"];

interface Plan {
  name: PlanName;
  monthly: number;
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    monthly: 29,
  },
  {
    name: "Pro",
    monthly: 59,
    featured: true,
  },
  {
    name: "Business",
    monthly: 99,
  },
];

/** Sección de precios con selector mensual/anual. */
export function PricingSection({ onCreate }: { onCreate: () => void }) {
  const t = useT().pricing;
  const [annual, setAnnual] = useState(false);
  const price = (m: number) => (annual ? Math.round(m * 12 * 0.8) : m);
  return (
    <section id="pricing" className="relative mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-24 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-full fb-gradient-anim"
        style={{
          background:
            "radial-gradient(45% 45% at 50% 20%, rgba(20,184,166,0.16) 0%, transparent 70%), radial-gradient(35% 40% at 15% 70%, rgba(45,212,191,0.10) 0%, transparent 70%), radial-gradient(35% 40% at 85% 70%, rgba(163,230,53,0.10) 0%, transparent 70%)",
        }}
      />
      <div className="text-center max-w-2xl mx-auto">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">{t.title}</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            {t.subtitle}
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
              {t.monthly}
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`px-4 h-8 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                annual ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              {t.annual}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#14B8A6]/15 text-[#14B8A6] font-semibold">
                -20%
              </span>
            </button>
          </div>
        </Reveal>
      </div>
      <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-5 lg:grid-cols-3">
        {PLANS.map((p, i) => (
          <Reveal key={p.name} delay={i * 80}>
            {p.featured ? (
              <div className="relative h-full rounded-xl p-[1.5px] bg-gradient-to-br from-[#14B8A6] via-[#2DD4BF] to-[#A3E635]">
                <div className="relative rounded-[10px] bg-card p-5 sm:p-6 h-full flex flex-col">
                  <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-white text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wide shadow-lg">
                    {t.popular}
                  </span>
                  <PlanBody plan={p} price={price(p.monthly)} annual={annual} onCreate={onCreate} />
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl border border-border bg-card p-5 sm:p-6 h-full flex flex-col transition-colors hover:border-[#14B8A6]/40">
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
  const t = useT().pricing;
  const info = t.plans[plan.name];
  return (
    <>
      <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{info.desc}</p>
      <div className="mt-3 sm:mt-5 flex items-baseline gap-1.5">
        <span className="text-3xl sm:text-4xl font-semibold tracking-tight">{price} €</span>
        <span className="text-xs text-muted-foreground">/ {annual ? t.perYear : t.perMonth}</span>
      </div>
      {annual && (
        <div className="text-[11px] mt-1 text-[#14B8A6]">
          {t.equals(Math.round(plan.monthly * 0.8))}
        </div>
      )}
      <ul className="mt-4 sm:mt-6 space-y-2 sm:space-y-2.5 flex-1">
        {info.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#14B8A6]" strokeWidth={1.5} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button className="mt-5 sm:mt-6 h-10" variant={plan.featured ? "default" : "outline"} onClick={onCreate}>
        {t.start(plan.name)}
      </Button>
    </>
  );
}
