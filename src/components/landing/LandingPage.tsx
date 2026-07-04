import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Dumbbell,
  CalendarDays,
  Users,
  Trophy,
  ArrowRight,
  Newspaper,
  Palette,
  LayoutGrid,
  Check,
  ChevronRight,
  Smartphone,
  Zap,
  WifiOff,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function LandingPage() {
  const navigate = useNavigate();
  const goRegister = () => navigate({ to: "/registro" });
  const goLogin = () => navigate({ to: "/login" });

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col overflow-x-hidden">
      <TopNav onEnter={goLogin} onCreate={goRegister} />
      <main className="flex-1">
        <Hero onCreate={goRegister} onEnter={goLogin} />
        <SocialProof />
        <Features />
        <HowItWorks />
        <PwaSection onCreate={goRegister} />
        <Pricing onCreate={goRegister} />
        <Testimonials />
        <FAQ />
        <FinalCta onCreate={goRegister} />
      </main>
      <Footer />
    </div>
  );
}

// ================== Reveal on scroll ==================
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
    >
      {children}
    </div>
  );
}

// ================== TopNav ==================
function TopNav({ onEnter, onCreate }: { onEnter: () => void; onCreate: () => void }) {
  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-5 w-5 text-[#F97316]" strokeWidth={1.5} />
        <span className="font-semibold tracking-tight">FitBox</span>
      </div>
      <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
        <a href="#features" className="hover:text-foreground transition-colors">Producto</a>
        <a href="#pricing" className="hover:text-foreground transition-colors">Precios</a>
        <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
      </nav>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onEnter}>Iniciar sesión</Button>
        <Button size="sm" className="hidden sm:inline-flex" onClick={onCreate}>
          Crear mi box
        </Button>
      </div>
    </header>
  );
}

// ================== Hero ==================
function Hero({ onCreate, onEnter }: { onCreate: () => void; onEnter: () => void }) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 fb-gradient-anim"
        style={{
          background:
            "radial-gradient(65% 55% at 20% 0%, rgba(249,115,22,0.32) 0%, transparent 60%), radial-gradient(50% 50% at 85% 15%, rgba(251,146,60,0.22) 0%, transparent 65%), radial-gradient(60% 55% at 55% 100%, rgba(234,88,12,0.18) 0%, transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 grid gap-12 lg:grid-cols-2 items-center">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F97316]/30 bg-[#F97316]/10 px-3 py-1 text-xs text-[#F97316] font-medium">
              Software para boxes y gimnasios boutique
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-4xl sm:text-6xl font-semibold tracking-tighter leading-[1.05]">
              Gestiona tu box
              <br />
              <span className="bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#FCD34D] bg-clip-text text-transparent">
                como un atleta entrena.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-xl text-sm sm:text-base text-muted-foreground">
              Reservas con lista de espera, socios y cuotas, PRs y leaderboard, feed
              del box y temas personalizables. Todo en una herramienta rápida y
              sobria, sin plugins ni fricción.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <Button className="h-11 px-6" onClick={onCreate}>
                Crear mi box
                <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
              </Button>
              <Button variant="outline" className="h-11 px-6" onClick={onEnter}>
                Ya tengo cuenta
              </Button>
            </div>
          </Reveal>
          <Reveal delay={280}>
            <div className="mt-6 text-xs text-muted-foreground">
              Sin tarjeta · 14 días de prueba · Cancela cuando quieras
            </div>
          </Reveal>
        </div>
        <Reveal delay={200}>
          <MockupPreview />
        </Reveal>
      </div>
    </section>
  );
}

function MockupPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const from = window.innerHeight / 2;
        const delta = (center - from) / window.innerHeight;
        setOffset(Math.max(-14, Math.min(14, -delta * 24)));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div ref={ref} className="relative" style={{ transform: `translateY(${offset}px)`, transition: "transform 120ms linear" }}>
      <div
        aria-hidden
        className="absolute -inset-6 rounded-3xl blur-2xl opacity-60"
        style={{
          background:
            "linear-gradient(135deg, rgba(249,115,22,0.45), rgba(251,146,60,0.30) 55%, rgba(252,211,77,0.18))",
        }}
      />
      <div className="relative rounded-xl border border-border bg-card/80 backdrop-blur p-4 shadow-2xl">
        <div className="flex items-center gap-1.5 pb-3 border-b border-border">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="ml-3 text-[11px] text-muted-foreground">CrossFit Norte · Reservas</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { day: "Lun 08", items: 3 },
            { day: "Mar 09", items: 4, active: true },
            { day: "Mié 10", items: 3 },
          ].map((c) => (
            <div
              key={c.day}
              className={`rounded-md border p-2 space-y-1.5 ${
                c.active ? "border-[#F97316]/60 bg-[#F97316]/5" : "border-border"
              }`}
            >
              <div className="text-[10px] font-medium text-muted-foreground">{c.day}</div>
              {Array.from({ length: c.items }).map((_, i) => (
                <div
                  key={i}
                  className="rounded border border-border/70 bg-background/60 px-1.5 py-1"
                >
                  <div className="text-[10px] font-medium">
                    {["07:00 WOD", "09:30 WOD", "17:30 Halter", "19:00 WOD"][i]}
                  </div>
                  <div className="mt-1 h-1 w-full rounded bg-muted overflow-hidden">
                    <div
                      className="h-full bg-[#F97316]"
                      style={{ width: `${40 + i * 15}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[9px] text-muted-foreground">
                    {6 + i}/{12} · {i === 2 ? "2 en espera" : "libre"}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-md border border-[#F97316]/30 bg-[#F97316]/5 p-2">
          <div className="text-[10px] font-medium uppercase text-[#F97316]">
            WOD del día · Fran
          </div>
          <div className="text-[11px] mt-1">
            21-15-9 Thrusters 43/30 + Pull-ups. Cap 10'.
          </div>
        </div>
      </div>
    </div>
  );
}

// ================== Social proof ==================
function useCounter(target: number, duration = 1200) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const start = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      obs.disconnect();
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { n, ref };
}

function Metric({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const { n, ref } = useCounter(value);
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-semibold tracking-tight">
        <span ref={ref}>{n.toLocaleString("es-ES")}</span>
        {suffix}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function SocialProof() {
  return (
    <section className="border-b border-border/60 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid grid-cols-2 sm:grid-cols-4 gap-6">
        <Metric value={420} label="Boxes activos" suffix="+" />
        <Metric value={185000} label="Reservas gestionadas" />
        <Metric value={9200} label="PRs registrados" />
        <Metric value={98} label="Satisfacción" suffix="%" />
      </div>
    </section>
  );
}

// ================== Features ==================
const FEATURES = [
  { icon: CalendarDays, title: "Reservas con waitlist", desc: "Calendario semanal, lista de espera automática, check-ins y ventana de cancelación configurable." },
  { icon: Users, title: "Socios y créditos", desc: "Planes ilimitados o por créditos, renovaciones, historial de pagos y estado a un vistazo." },
  { icon: Trophy, title: "PRs y leaderboard", desc: "Registra marcas, revisa la evolución con gráficas y saca ránkings del box por ejercicio." },
  { icon: Newspaper, title: "Feed del box", desc: "Publica avisos, WODs, consejos y recetas. Notifica a tus socios sin depender de WhatsApp." },
  { icon: Palette, title: "Temas y branding", desc: "Cinco temas listos, tu color de marca y tu logo. Que la app sea tu box, no un genérico más." },
  { icon: LayoutGrid, title: "Panel multi-box", desc: "Gestiona varios boxes desde un único panel. Métricas globales, impersonación y control total." },
];

function Features() {
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
            <div
              className="group relative rounded-xl border border-border bg-card p-6 h-full transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F97316]/40"
            >
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

// ================== PWA ==================
function PwaSection({ onCreate }: { onCreate: () => void }) {
  const items = [
    { icon: Download, title: "Instalable en el móvil", desc: "Sin App Store ni descargas. Añádela a tu pantalla de inicio en un toque." },
    { icon: Zap, title: "Rápida como una app", desc: "Carga instantánea, transiciones suaves y navegación pensada para el móvil." },
    { icon: WifiOff, title: "Datos siempre a mano", desc: "Consulta reservas y PRs incluso con conexión débil dentro del box." },
  ];
  return (
    <section className="relative border-y border-border/60 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 fb-gradient-anim"
        style={{
          background:
            "radial-gradient(50% 60% at 20% 30%, rgba(249,115,22,0.14) 0%, transparent 70%), radial-gradient(45% 55% at 80% 70%, rgba(251,146,60,0.12) 0%, transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24 grid gap-12 lg:grid-cols-2 items-center">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F97316]/30 bg-[#F97316]/10 px-3 py-1 text-xs text-[#F97316] font-medium">
              <Smartphone className="h-3.5 w-3.5" strokeWidth={1.5} />
              Funciona como app
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight">
              Una <span className="bg-gradient-to-r from-[#F97316] to-[#FCD34D] bg-clip-text text-transparent">Progressive Web App</span> real.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-lg">
              FitBox se instala en el móvil de tus socios como una app nativa: icono en el escritorio,
              pantalla completa y experiencia fluida. Sin fricciones ni pop-ups.
            </p>
          </Reveal>
          <div className="mt-8 space-y-3">
            {items.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={200 + i * 80}>
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-[#F97316]/10 text-[#F97316] flex items-center justify-center" style={{ boxShadow: "inset 0 0 0 1px rgba(249,115,22,0.28)" }}>
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={480}>
            <Button className="mt-8 h-11 px-6" onClick={onCreate}>
              Probar FitBox
              <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
            </Button>
          </Reveal>
        </div>
        <Reveal delay={200}>
          <div className="relative mx-auto w-64 sm:w-72">
            <div
              aria-hidden
              className="absolute -inset-8 rounded-[3rem] blur-2xl opacity-60"
              style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.4), rgba(251,146,60,0.25))" }}
            />
            <div className="relative rounded-[2.2rem] border border-border/80 bg-card p-3 shadow-2xl">
              <div className="rounded-[1.6rem] border border-border/70 bg-background overflow-hidden aspect-[9/19] flex flex-col">
                <div className="h-8 bg-background/60 border-b border-border/50 flex items-center justify-center">
                  <div className="h-1 w-16 rounded-full bg-muted-foreground/30" />
                </div>
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-[#F97316] flex items-center justify-center">
                      <Dumbbell className="h-4 w-4 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold">FitBox</div>
                      <div className="text-[9px] text-muted-foreground">CrossFit Norte</div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-2.5">
                    <div className="text-[10px] font-medium">Hoy · 19:00 WOD</div>
                    <div className="mt-1 h-1 rounded bg-muted overflow-hidden">
                      <div className="h-full bg-[#F97316]" style={{ width: "75%" }} />
                    </div>
                    <div className="mt-1 text-[9px] text-muted-foreground">9/12 · reservada</div>
                  </div>
                  <div className="rounded-lg border border-[#F97316]/30 bg-[#F97316]/5 p-2.5">
                    <div className="text-[10px] font-medium text-[#F97316]">WOD · Fran</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">21-15-9 Thrusters + Pull-ups</div>
                  </div>
                  <div className="rounded-lg border border-[#F97316]/20 bg-[#F97316]/5 p-2.5">
                    <div className="text-[10px] font-medium text-[#F97316]">PR</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">Back Squat · 120kg</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ================== How it works ==================
const STEPS = [
  { n: "01", title: "Crea tu box", desc: "Nombre, color y logo. Diez segundos." },
  { n: "02", title: "Añade planes y clases", desc: "Tarifas y horarios recurrentes con plantillas." },
  { n: "03", title: "Invita a tus socios", desc: "Comparten reservas, PRs y créditos desde el día uno." },
];

function HowItWorks() {
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

// ================== Pricing ==================
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

function Pricing({ onCreate }: { onCreate: () => void }) {
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
              className={`px-4 h-8 rounded-full font-medium transition-colors ${!annual ? "bg-foreground text-background" : "text-muted-foreground"}`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`px-4 h-8 rounded-full font-medium transition-colors flex items-center gap-1.5 ${annual ? "bg-foreground text-background" : "text-muted-foreground"}`}
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

// ================== Testimonios ==================
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

function Testimonials() {
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

// ================== FAQ ==================
const FAQS = [
  { q: "¿Puedo migrar mis socios y planes actuales?", a: "Sí. Puedes crear cuentas manualmente en segundos o importar datos desde JSON. El plan Business incluye onboarding y ayuda con la migración." },
  { q: "¿Qué pasa con mis datos si cancelo?", a: "Tuyos son. Puedes exportar toda la información del box en JSON en cualquier momento desde la sección de Configuración → Datos." },
  { q: "¿Funciona en móvil sin instalar app?", a: "Sí. FitBox es una web app pensada para móvil primero. Tus socios reservan desde el navegador, sin descargas ni pop-ups." },
  { q: "¿Cuántos coaches puedo tener?", a: "En Starter, un coach; en Pro y Business, ilimitados. Cada coach tiene su propio acceso con permisos limitados." },
  { q: "¿Cobráis comisión por las cuotas?", a: "No. Cobramos una tarifa fija mensual y ya. Tú cobras a tus socios como prefieras: efectivo, tarjeta, domiciliación." },
  { q: "¿Necesito conocimientos técnicos?", a: "Ninguno. Si sabes usar Instagram, sabes usar FitBox. Y si te atascas, escríbenos: contestamos rápido." },
];

function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 sm:px-6 py-20 sm:py-24">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Preguntas frecuentes</h2>
        </Reveal>
      </div>
      <Reveal>
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`f-${i}`}>
              <AccordionTrigger className="text-left text-sm sm:text-base">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}

// ================== Final CTA ==================
function FinalCta({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 50%, rgba(249,115,22,0.20) 0%, transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-24 text-center">
        <Reveal>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tighter">
            Empieza hoy. Sin tarjeta.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Crea tu box en menos de un minuto y prueba FitBox con datos demo.
          </p>
        </Reveal>
        <Reveal delay={140}>
          <Button className="mt-8 h-12 px-8 text-base" onClick={onCreate}>
            Crear mi box
            <ChevronRight className="h-5 w-5 ml-1" strokeWidth={1.5} />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

// ================== Footer ==================
function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-[#F97316]" strokeWidth={1.5} />
            <span className="font-semibold tracking-tight">FitBox</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Software todo-en-uno para boxes de CrossFit y gimnasios boutique.
          </p>
        </div>
        <FooterCol
          title="Producto"
          items={[
            { label: "Funciones", href: "#features" },
            { label: "Precios", href: "#pricing" },
            { label: "FAQ", href: "#faq" },
          ]}
        />
        <FooterCol
          title="Cuenta"
          items={[
            { label: "Crear cuenta", to: "/registro" },
            { label: "Iniciar sesión", to: "/login" },
            { label: "Recuperar contraseña", to: "/recuperar" },
          ]}
        />
        <FooterCol
          title="Legal"
          items={[
            { label: "Privacidad", to: "/legal/privacidad" },
            { label: "Cookies", to: "/legal/cookies" },
            { label: "Términos", to: "/legal/terminos" },
            { label: "Aviso legal", to: "/legal/aviso-legal" },
          ]}
        />
      </div>
      <div className="border-t border-border/60 py-4 text-center text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} FitBox · Demo local, los datos se guardan en tu navegador
      </div>
    </footer>
  );
}

interface FooterItem { label: string; href?: string; to?: string }

function FooterCol({ title, items }: { title: string; items: FooterItem[] }) {
  return (
    <div>
      <div className="text-xs font-semibold mb-3">{title}</div>
      <ul className="space-y-2 text-xs text-muted-foreground">
        {items.map((i) => (
          <li key={i.label}>
            {i.to ? (
              <Link to={i.to} className="hover:text-foreground transition-colors">{i.label}</Link>
            ) : (
              <a href={i.href} className="hover:text-foreground transition-colors">{i.label}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
