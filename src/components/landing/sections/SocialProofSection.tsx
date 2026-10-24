import { Metric } from "../animations";
import { useT } from "../i18n";

/** Banda con métricas animadas debajo del hero. */
export function SocialProofSection() {
  const metrics = useT().metrics;
  return (
    <section className="border-b border-border/60 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid grid-cols-2 sm:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <Metric key={m.label} value={m.value} label={m.label} suffix={m.suffix} />
        ))}
      </div>
    </section>
  );
}
