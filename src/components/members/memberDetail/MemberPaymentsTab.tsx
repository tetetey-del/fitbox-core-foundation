import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentsOf } from "@/lib/services/membership.service";
import { PAYMENT_METHOD_LABEL } from "@/types";
import { formatDate } from "@/lib/date";

interface Props {
  userId: string;
  onNewPayment: () => void;
}

/** Historial de pagos del socio + botón "Registrar pago". */
export function MemberPaymentsTab({ userId, onNewPayment }: Props) {
  const payments = paymentsOf(userId);
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Historial de pagos</h3>
        <Button variant="outline" size="sm" onClick={onNewPayment}>
          <Wallet className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
          Registrar pago
        </Button>
      </div>
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
      ) : (
        <ul className="space-y-1">
          {payments.slice(0, 8).map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium">{p.amount.toFixed(2)} €</div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(p.date)} · {PAYMENT_METHOD_LABEL[p.method]}
                  {p.notes ? ` · ${p.notes}` : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
