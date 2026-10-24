import { Reveal } from "../animations";
import { useT } from "../i18n";


/** Sección "Empieza en tres pasos". */
export function HowItWorksSection() {
  const t = useT().how;
  const steps = t.steps.map((s, i) => ({ ...s, n: `0${i + 1}` }));
  return (
    <section className="border-y border-border/60 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">{t.title}</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t.subtitle}
            </p>
          </Reveal>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 100}>
              <div className="rounded-xl border border-border bg-background p-6 h-full transition-colors hover:border-[#14B8A6]/40">
                <div className="text-xs font-mono text-[#14B8A6]">{s.n}</div>
                <h3 className="mt-2 text-base font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
