import { CalendarDays, LayoutGrid, Newspaper, Palette, Trophy, Users } from "lucide-react";
import { Reveal } from "../animations";

const FEATURES = [
  { icon: CalendarDays, title: "Reservas con waitlist", desc: "Calendario semanal, lista de espera automática, check-ins y ventana de cancelación configurable." },
  { icon: Users, title: "Socios y créditos", desc: "Planes ilimitados o por créditos, renovaciones, historial de pagos y estado a un vistazo." },
  { icon: Trophy, title: "PRs y leaderboard", desc: "Registra marcas, revisa la evolución con gráficas y saca ránkings del box por ejercicio." },
  { icon: Newspaper, title: "Feed del box", desc: "Publica avisos, WODs, consejos y recetas. Notifica a tus socios sin depender de WhatsApp." },
  { icon: Palette, title: "Temas y branding", desc: "Cinco temas listos, tu color de marca y tu logo. Que la app sea tu box, no un genérico más." },
  { icon: LayoutGrid, title: "Panel multi-box", desc: "Gestiona varios boxes desde un único panel. Métricas globales, impersonación y control total." },
];

/** Grid de 6 features principales del producto. */
export function FeaturesSection() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24">
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/3 -z-10 h-64 blur-3xl opacity-40"
        style={{ background: "radial-gradient(50% 100% at 50% 50%, rgba(249,115,22,0.18), transparent 70%)" }}
      />
      <div className="max-w-2xl">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Todo lo que tu box necesita, sin lo que sobra.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            FitBox reúne lo esencial de un CRM, un reservador y una comunidad en una
            sola herramienta pensada para dueños de box.
          </p>
        </Reveal>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, desc }, i) => (
          <Reveal key={title} delay={i * 80}>
            <div className="group relative rounded-xl border border-border bg-card p-6 h-full transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F97316]/40">
              <div
                aria-hidden
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ boxShadow: "0 0 0 1px rgba(249,115,22,0.35), 0 24px 48px -20px rgba(249,115,22,0.35)" }}
              />
              <div
                className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-[#F97316]/10 text-[#F97316]"
                style={{ boxShadow: "inset 0 0 0 1px rgba(249,115,22,0.28)" }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
