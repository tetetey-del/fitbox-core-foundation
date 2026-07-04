import { toast } from "sonner";
import { Ban, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cancelMembership,
  getActiveMembership,
  getPlan,
  renewMembership,
} from "@/lib/services/membership.service";
import { notifyDataChanged } from "@/lib/data-bus";
import { formatDate } from "@/lib/date";

interface Props {
  userId: string;
  onAssign: () => void;
}

/** Bloque de membresía actual: mostrar plan/vigencia y acciones renovar/cancelar. */
export function MemberMembershipTab({ userId, onAssign }: Props) {
  const membership = getActiveMembership(userId);
  const plan = membership ? getPlan(membership.planId) : null;

  const handleRenew = () => {
    if (!membership || !plan) return;
    const res = renewMembership(membership.id, {
      registerPayment: {
        amount: plan.priceMonthly,
        method: "tarjeta",
        notes: `Renovación ${plan.name}`,
      },
    });
    if (!res.ok) return toast.error(res.reason ?? "No se pudo renovar");
    toast.success("Membresía renovada y pago registrado");
    notifyDataChanged();
  };

  const handleCancel = () => {
    if (!membership) return;
    if (!confirm("¿Cancelar la membresía activa?")) return;
    cancelMembership(membership.id);
    toast.success("Membresía cancelada");
    notifyDataChanged();
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Membresía</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={onAssign}>
            <Plus className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
            Asignar plan
          </Button>
          {membership && (
            <>
              <Button variant="outline" size="sm" onClick={handleRenew}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
                Renovar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-destructive hover:text-destructive"
              >
                <Ban className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>
      {membership && plan ? (
        <div className="rounded-lg border border-border bg-card p-4 text-sm">
          <div className="font-medium">{plan.name}</div>
          <div className="text-muted-foreground mt-1">
            {plan.type === "unlimited"
              ? "Ilimitado"
              : `${membership.creditsRemaining ?? 0}/${plan.creditsPerMonth} créditos`}
          </div>
          <div className="text-muted-foreground text-xs mt-2">
            Del {formatDate(membership.startDate)} al {formatDate(membership.endDate)}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sin plan activo.</p>
      )}
    </section>
  );
}
