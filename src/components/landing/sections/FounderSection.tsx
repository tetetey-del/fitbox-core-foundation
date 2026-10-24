import { Reveal } from "../animations";
import { useT } from "../i18n";

/** Historia de la fundadora: reemplaza a los testimonios de ejemplo. */
export function FounderSection() {
  const t = useT().founder;
  const initials = t.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <section className="border-y border-border/60 bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14 sm:py-24">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center">{t.title}</h2>
        </Reveal>
        <Reveal delay={80}>
          <figure className="mt-8 rounded-xl border border-border bg-background p-5 sm:p-8">
            <blockquote className="text-[15px] sm:text-lg text-foreground/90 leading-relaxed">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-6 pt-4 border-t border-border/60 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#0F766E] flex items-center justify-center text-white text-xs font-semibold">
                {initials}
              </div>
              <div className="text-sm">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
