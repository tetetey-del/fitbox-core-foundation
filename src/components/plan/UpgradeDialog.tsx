import { Check, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { PLANS, limitMessage, type LimitKind } from "@/lib/plans";
import { SupportContact } from "./SupportContact";

/** "Pásate a Pro": explica el límite del plan y qué se gana. */
export function UpgradeDialog({
  open,
  onOpenChange,
  kind,
  max,
  title,
  body,
  target = "pro",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kind?: LimitKind;
  max?: number;
  title?: string;
  body?: string;
  /** Plan que se ofrece (Pro por defecto; Business para quien ya es Pro). */
  target?: "pro" | "business";
}) {
  const { currentTenant } = useAuth();
  const msg = kind && max ? limitMessage(kind, max) : { title: title ?? "Disponible en el plan Pro", body: body ?? "" };
  const pro = PLANS[target];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" strokeWidth={1.5} style={{ color: "var(--brand)" }} />
            {msg.title}
          </DialogTitle>
          {msg.body && <DialogDescription>{msg.body}</DialogDescription>}
        </DialogHeader>
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Plan {pro.name}</span>
            <span className="text-sm text-muted-foreground">{pro.priceMonthly} € / mes</span>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {pro.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} style={{ color: "var(--brand)" }} />
                {h}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">Escríbeme y te lo cambio en el momento.</p>
        <SupportContact
          compact
          boxName={currentTenant?.name}
          message={`Hola, soy de ${currentTenant?.name ?? "mi box"} y quiero pasarme al plan ${pro.name} de Kinflow.`}
        />
      </DialogContent>
    </Dialog>
  );
}

/** Etiqueta "Pro" para lo que el plan Starter no incluye. */
export function ProBadge() {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: "color-mix(in srgb, var(--brand) 18%, transparent)", color: "var(--brand)" }}
    >
      Pro
    </span>
  );
}
