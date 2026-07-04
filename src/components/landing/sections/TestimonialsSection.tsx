import { Reveal } from "../animations";

const TESTIMONIALS = [
  {
    quote: "En una semana pasé de una hoja de cálculo y WhatsApp a tener reservas, cuotas y PRs en un solo sitio. Mis socios lo notaron el primer día.",
    name: "Sergio Torres",
    role: "Owner, CrossFit Norte",
    city: "Madrid",
  },
  {
    quote: "La lista de espera automática y las notificaciones nos han quitado horas de gestión cada semana. Y el leaderboard engancha una barbaridad.",
    name: "Marta Ríos",
    role: "Coach, Box Sur",
    city: "Sevilla",
  },
  {
    quote: "Probé tres plataformas antes. FitBox es la única que no me sobra ni una sola pantalla. Rápida y directa, como debe ser.",
    name: "Iker Mendieta",
    role: "Owner, Iron Athletic",
    city: "Bilbao",
  },
];

/** Rejilla de 3 testimonios con avatar de iniciales. */
export function TestimonialsSection() {
  return (
    <section className="border-y border-border/60 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center">
            Boxes que ya usan FitBox
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <figure className="rounded-xl border border-border bg-background p-6 h-full flex flex-col">
                <blockquote className="text-sm text-foreground/90 leading-relaxed">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 pt-4 border-t border-border/60 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#F97316] to-[#c2410c] flex items-center justify-center text-white text-xs font-semibold">
                    {t.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="text-xs">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-muted-foreground">{t.role} · {t.city}</div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
