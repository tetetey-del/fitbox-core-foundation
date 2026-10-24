import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "../animations";

/** Sección hero con headline, CTA y mockup animado. */
export function HeroSection({ onCreate, onEnter }: { onCreate: () => void; onEnter: () => void }) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 fb-gradient-anim"
        style={{
          background:
            "radial-gradient(65% 55% at 20% 0%, rgba(20,184,166,0.32) 0%, transparent 60%), radial-gradient(50% 50% at 85% 15%, rgba(45,212,191,0.22) 0%, transparent 65%), radial-gradient(60% 55% at 55% 100%, rgba(15,118,110,0.18) 0%, transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 grid gap-12 lg:grid-cols-2 items-center">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 py-1 text-xs text-[#14B8A6] font-medium">
              Software para boxes y gimnasios boutique
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-4xl sm:text-6xl font-semibold tracking-tighter leading-[1.05]">
              Gestiona tu box
              <br />
              <span className="bg-gradient-to-r from-[#14B8A6] via-[#2DD4BF] to-[#A3E635] bg-clip-text text-transparent">
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

/** Mockup interactivo con leve parallax que ilustra la agenda del box. */
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
    <div
      ref={ref}
      className="relative"
      style={{ transform: `translateY(${offset}px)`, transition: "transform 120ms linear" }}
    >
      <div
        aria-hidden
        className="absolute -inset-6 rounded-3xl blur-2xl opacity-60"
        style={{
          background:
            "linear-gradient(135deg, rgba(20,184,166,0.45), rgba(45,212,191,0.30) 55%, rgba(163,230,53,0.18))",
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
                c.active ? "border-[#14B8A6]/60 bg-[#14B8A6]/5" : "border-border"
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
                      className="h-full bg-[#14B8A6]"
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
        <div className="mt-3 rounded-md border border-[#14B8A6]/30 bg-[#14B8A6]/5 p-2">
          <div className="text-[10px] font-medium uppercase text-[#14B8A6]">
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
