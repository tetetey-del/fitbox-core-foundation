import { Input } from "@/components/ui/input";

export interface DraftPlan {
  name: string;
  price: number;
  type: "unlimited" | "credits";
  credits: number;
}

interface Props {
  plans: DraftPlan[];
  onUpdate: (i: number, patch: Partial<DraftPlan>) => void;
}

/** Paso 3: definición inicial de planes de membresía. */
export function StepPlans({ plans, onUpdate }: Props) {
  return (
    <div className="space-y-3">
      {plans.map((p, i) => (
        <div key={i} className="grid grid-cols-[1fr_100px_100px] gap-2 items-end">
          <div>
            <MiniLabel>Nombre</MiniLabel>
            <Input value={p.name} onChange={(e) => onUpdate(i, { name: e.target.value })} />
          </div>
          <div>
            <MiniLabel>Precio/mes</MiniLabel>
            <Input
              type="number"
              value={p.price}
              onChange={(e) => onUpdate(i, { price: Number(e.target.value) })}
            />
          </div>
          <div>
            <MiniLabel>Créditos</MiniLabel>
            <Input
              type="number"
              value={p.credits}
              disabled={p.type === "unlimited"}
              onChange={(e) => onUpdate(i, { credits: Number(e.target.value) })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium text-muted-foreground">{children}</div>;
}
