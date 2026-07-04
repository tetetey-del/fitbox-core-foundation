import { Reveal } from "../animations";

const STEPS = [
  { n: "01", title: "Crea tu box", desc: "Nombre, color y logo. Diez segundos." },
  { n: "02", title: "Añade planes y clases", desc: "Tarifas y horarios recurrentes con plantillas." },
  { n: "03", title: "Invita a tus socios", desc: "Comparten reservas, PRs y créditos desde el día uno." },
];

/** Sección "Empieza en tres pasos". */
export function HowItWorksSection() {
  return (
    <section className="border-y border-border/60 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Empieza en tres pasos</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              De cero a operativo en menos de cinco minutos.
            </p>
          </Reveal>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 100}>
              <div className="rounded-xl border border-border bg-background p-6 h-full transition-colors hover:border-[#F97316]/40">
                <div className="text-xs font-mono text-[#F97316]">{s.n}</div>
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
