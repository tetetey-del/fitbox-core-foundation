import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "../animations";

/** CTA final grande con gradiente naranja de fondo. */
export function FinalCtaSection({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 50%, rgba(20,184,166,0.20) 0%, transparent 70%)",
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
