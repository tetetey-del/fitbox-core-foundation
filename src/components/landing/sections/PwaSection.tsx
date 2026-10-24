import { ArrowRight, Download, Smartphone, WifiOff, Zap } from "lucide-react";
import { KinflowMark } from "@/components/brand/KinflowLogo";
import { Button } from "@/components/ui/button";
import { Reveal } from "../animations";
import { useT } from "../i18n";

const ICONS = [Download, Zap, WifiOff];

/** Sección que promociona el soporte PWA y muestra un mockup del móvil. */
export function PwaSection({ onCreate }: { onCreate: () => void }) {
  const t = useT().pwa;
  const items = t.items.map((it, i) => ({ ...it, icon: ICONS[i] }));
  return (
    <section className="relative border-y border-border/60 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 fb-gradient-anim"
        style={{
          background:
            "radial-gradient(50% 60% at 20% 30%, rgba(20,184,166,0.14) 0%, transparent 70%), radial-gradient(45% 55% at 80% 70%, rgba(45,212,191,0.12) 0%, transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24 grid gap-12 lg:grid-cols-2 items-center">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 py-1 text-xs text-[#14B8A6] font-medium">
              <Smartphone className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t.badge}
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight">
              {t.titleA} <span className="bg-gradient-to-r from-[#14B8A6] to-[#A3E635] bg-clip-text text-transparent">{t.titleB}</span>{t.titleC}
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-lg">
              {t.subtitle}
            </p>
          </Reveal>
          <div className="mt-8 space-y-3">
            {items.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={200 + i * 80}>
                <div className="flex items-start gap-3">
                  <div
                    className="h-9 w-9 shrink-0 rounded-lg bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center"
                    style={{ boxShadow: "inset 0 0 0 1px rgba(20,184,166,0.28)" }}
                  >
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
              {t.cta}
              <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
            </Button>
          </Reveal>
        </div>
        <Reveal delay={200}>
          <div className="relative mx-auto w-64 sm:w-72">
            <div
              aria-hidden
              className="absolute -inset-8 rounded-[3rem] blur-2xl opacity-60"
              style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.4), rgba(45,212,191,0.25))" }}
            />
            <div className="relative rounded-[2.2rem] border border-border/80 bg-card p-3 shadow-2xl">
              <div className="rounded-[1.6rem] border border-border/70 bg-background overflow-hidden aspect-[9/19] flex flex-col">
                <div className="h-8 bg-background/60 border-b border-border/50 flex items-center justify-center">
                  <div className="h-1 w-16 rounded-full bg-muted-foreground/30" />
                </div>
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <KinflowMark className="h-8 w-8" />
                    <div>
                      <div className="text-[11px] font-semibold">Kinflow</div>
                      <div className="text-[9px] text-muted-foreground">{t.phoneBox}</div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-2.5">
                    <div className="text-[10px] font-medium">{t.phoneClass}</div>
                    <div className="mt-1 h-1 rounded bg-muted overflow-hidden">
                      <div className="h-full bg-[#14B8A6]" style={{ width: "75%" }} />
                    </div>
                    <div className="mt-1 text-[9px] text-muted-foreground">{t.phoneBooked}</div>
                  </div>
                  <div className="rounded-lg border border-[#14B8A6]/30 bg-[#14B8A6]/5 p-2.5">
                    <div className="text-[10px] font-medium text-[#14B8A6]">WOD · Fran</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">21-15-9 Thrusters + Pull-ups</div>
                  </div>
                  <div className="rounded-lg border border-[#14B8A6]/20 bg-[#14B8A6]/5 p-2.5">
                    <div className="text-[10px] font-medium text-[#14B8A6]">{t.phonePr}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">Back Squat · 120 kg</div>
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
