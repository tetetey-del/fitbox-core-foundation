import { Metric } from "../animations";

/** Banda con métricas animadas debajo del hero. */
export function SocialProofSection() {
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
