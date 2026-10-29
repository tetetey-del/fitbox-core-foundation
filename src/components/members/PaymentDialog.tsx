import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentMethod } from "@/types";
import { currencySymbol } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/types";
import { toDateKey } from "@/lib/date";
import { registerPayment } from "@/lib/services/membership.service";
import { notifyDataChanged } from "@/lib/data-bus";
import { NumberInput } from "@/components/ui/number-input";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string;
  membershipId?: string;
  defaultAmount?: number;
}

export function PaymentDialog({
  open,
  onOpenChange,
  userId,
  membershipId,
  defaultAmount,
}: Props) {
  const [amount, setAmount] = useState<number>(defaultAmount ?? 0);
  const [method, setMethod] = useState<PaymentMethod>("tarjeta");
  const [date, setDate] = useState(toDateKey(new Date()));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount ?? 0);
      setMethod("tarjeta");
      setDate(toDateKey(new Date()));
      setNotes("");
    }
  }, [open, defaultAmount]);

  const submit = () => {
    if (amount <= 0) return toast.error("El importe debe ser mayor que 0");
    registerPayment({
      userId,
      membershipId,
      amount,
      method,
      date,
      notes: notes || undefined,
    });
    toast.success("Pago registrado");
    notifyDataChanged();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Importe ({currencySymbol()})</Label>
              <NumberInput
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Método</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notas</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
