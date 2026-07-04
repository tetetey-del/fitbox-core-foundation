import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { membershipPlansRepo } from "@/lib/storage/repositories/membershipPlans.repo";
import { assignMembership } from "@/lib/services/membership.service";
import { parseDateKey, toDateKey } from "@/lib/date";
import { notifyDataChanged } from "@/lib/data-bus";
import { registerPayment } from "@/lib/services/membership.service";
import type { PaymentMethod } from "@/types";
import { PAYMENT_METHOD_LABEL } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string;
}

export function AssignPlanDialog({ open, onOpenChange, userId }: Props) {
  const plans = useMemo(() => membershipPlansRepo.list().filter((p) => p.active), []);
  const [planId, setPlanId] = useState<string>(plans[0]?.id ?? "");
  const [startDate, setStartDate] = useState(toDateKey(new Date()));
  const [withPayment, setWithPayment] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>("tarjeta");

  useEffect(() => {
    if (open) {
      setPlanId(plans[0]?.id ?? "");
      setStartDate(toDateKey(new Date()));
      setWithPayment(true);
      setMethod("tarjeta");
    }
  }, [open, plans]);

  const plan = plans.find((p) => p.id === planId);

  const submit = () => {
    if (!plan) return toast.error("Selecciona un plan");
    const res = assignMembership(userId, plan.id, parseDateKey(startDate));
    if (!res.ok || !res.membership) return toast.error(res.reason ?? "No se pudo asignar");
    if (withPayment) {
      registerPayment({
        userId,
        membershipId: res.membership.id,
        amount: plan.priceMonthly,
        method,
        date: startDate,
        notes: `Alta ${plan.name}`,
      });
    }
    toast.success("Plan asignado");
    notifyDataChanged();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar plan</DialogTitle>
        </DialogHeader>
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay planes activos. Crea uno en Configuración → Planes y precios.
          </p>
        ) : (
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Plan</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.priceMonthly}€
                      {p.type === "credits" ? ` · ${p.creditsPerMonth} créditos` : " · Ilimitado"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fecha de inicio</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="pay"
                checked={withPayment}
                onCheckedChange={(v) => setWithPayment(!!v)}
              />
              <Label htmlFor="pay" className="text-sm font-normal">
                Registrar pago de {plan?.priceMonthly ?? 0}€
              </Label>
            </div>
            {withPayment && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Método de pago</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((m) => (
                      <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={plans.length === 0}>Asignar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
