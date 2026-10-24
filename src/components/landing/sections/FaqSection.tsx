import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "../animations";
import { useT } from "../i18n";


/** Preguntas frecuentes con acordeón. */
export function FaqSection() {
  const t = useT().faq;
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 sm:px-6 py-20 sm:py-24">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">{t.title}</h2>
        </Reveal>
      </div>
      <Reveal>
        <Accordion type="single" collapsible className="w-full">
          {t.items.map((f, i) => (
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
