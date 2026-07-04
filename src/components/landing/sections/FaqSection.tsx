import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "../animations";

const FAQS = [
  { q: "¿Puedo migrar mis socios y planes actuales?", a: "Sí. Puedes crear cuentas manualmente en segundos o importar datos desde JSON. El plan Business incluye onboarding y ayuda con la migración." },
  { q: "¿Qué pasa con mis datos si cancelo?", a: "Tuyos son. Puedes exportar toda la información del box en JSON en cualquier momento desde la sección de Configuración → Datos." },
  { q: "¿Funciona en móvil sin instalar app?", a: "Sí. FitBox es una web app pensada para móvil primero. Tus socios reservan desde el navegador, sin descargas ni pop-ups." },
  { q: "¿Cuántos coaches puedo tener?", a: "En Starter, un coach; en Pro y Business, ilimitados. Cada coach tiene su propio acceso con permisos limitados." },
  { q: "¿Cobráis comisión por las cuotas?", a: "No. Cobramos una tarifa fija mensual y ya. Tú cobras a tus socios como prefieras: efectivo, tarjeta, domiciliación." },
  { q: "¿Necesito conocimientos técnicos?", a: "Ninguno. Si sabes usar Instagram, sabes usar FitBox. Y si te atascas, escríbenos: contestamos rápido." },
];

/** Preguntas frecuentes con acordeón. */
export function FaqSection() {
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
