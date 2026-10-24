import { CalendarDays, LayoutGrid, Newspaper, Palette, Trophy, Users } from "lucide-react";
import { Reveal } from "../animations";
import { useT } from "../i18n";

const ICONS = [CalendarDays, Users, Trophy, Newspaper, Palette, LayoutGrid];

/** Grid de 6 features principales del producto. */
export function FeaturesSection() {
  const t = useT().features;
  const features = t.items.map((f, i) => ({ ...f, icon: ICONS[i] }));
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-24">
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/3 -z-10 h-64 blur-3xl opacity-40"
        style={{ background: "radial-gradient(50% 100% at 50% 50%, rgba(20,184,166,0.18), transparent 70%)" }}
      />
      <div className="max-w-2xl">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {t.title}
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            {t.subtitle}
          </p>
        </Reveal>
      </div>
      <div className="mt-6 sm:mt-10 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }, i) => (
          <Reveal key={title} delay={i * 80}>
            <div className="group relative rounded-xl border border-border bg-card p-3 sm:p-6 h-full transition-all duration-300 hover:-translate-y-0.5 hover:border-[#14B8A6]/40">
              <div
                aria-hidden
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ boxShadow: "0 0 0 1px rgba(20,184,166,0.35), 0 24px 48px -20px rgba(20,184,166,0.35)" }}
              />
              <div
                className="inline-flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#14B8A6]/10 text-[#14B8A6]"
                style={{ boxShadow: "inset 0 0 0 1px rgba(20,184,166,0.28)" }}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} />
              </div>
              <h3 className="mt-2 sm:mt-4 text-sm sm:text-base font-semibold tracking-tight leading-tight">{title}</h3>
              <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-muted-foreground leading-snug">{desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
