import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, RotateCcw, Ban, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/types";
import { PAYMENT_METHOD_LABEL } from "@/types";
import {
  cancelMembership,
  getActiveMembership,
  getMembershipStatus,
  getPlan,
  paymentsOf,
  renewMembership,
} from "@/lib/services/membership.service";
import { membershipsRepo } from "@/lib/storage/repositories/memberships.repo";
import { checkinsRepo } from "@/lib/storage/repositories/checkins.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { usersRepo } from "@/lib/storage/repositories/users.repo";
import { notifyDataChanged, useDataVersion } from "@/lib/data-bus";
import { AssignPlanDialog } from "./AssignPlanDialog";
import { PaymentDialog } from "./PaymentDialog";
import { MembershipBadge } from "./MembershipBadge";
import { CreditsBadge } from "./CreditsBadge";
import { formatDate, toDateKey } from "@/lib/date";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: User | null;
}

export function MemberDetailDialog({ open, onOpenChange, user }: Props) {
  useDataVersion();
  const [assigning, setAssigning] = useState(false);
  const [paying, setPaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  if (!user) return null;

  const membership = getActiveMembership(user.id);
  const plan = membership ? getPlan(membership.planId) : null;
  const uiStatus = getMembershipStatus(user.id);
  const payments = paymentsOf(user.id);
  const history = attendanceOf(user.id);
  const monthly = monthlyAttendance(user.id);
  const favorite = favoriteClass(user.id);

  const saveEdit = () => {
    if (!name.trim() || !email.trim()) return toast.error("Nombre y email son obligatorios");
    usersRepo.update(user.id, { name: name.trim(), email: email.trim() });
    toast.success("Datos actualizados");
    notifyDataChanged();
    setEditing(false);
  };

  const handleRenew = () => {
    if (!membership || !plan) return;
    const res = renewMembership(membership.id, {
      registerPayment: { amount: plan.priceMonthly, method: "tarjeta", notes: `Renovación ${plan.name}` },
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {user.name}
              <MembershipBadge status={uiStatus} />
              <CreditsBadge userId={user.id} />
            </DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>

          {/* Datos personales */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Datos personales</h3>
              {!editing ? (
                <Button variant="ghost" size="sm" onClick={() => {
                  setName(user.name);
                  setEmail(user.email);
                  setEditing(true);
                }}>Editar</Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
                  <Button size="sm" onClick={saveEdit}>Guardar</Button>
                </div>
              )}
            </div>
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nombre</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Alta: {formatDate(user.createdAt.slice(0, 10))}
              </div>
            )}
          </section>

          <Separator />

          {/* Membresía */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Membresía</h3>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setAssigning(true)}>
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

          <Separator />

          {/* Pagos */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Historial de pagos</h3>
              <Button variant="outline" size="sm" onClick={() => setPaying(true)}>
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

          <Separator />

          {/* Estadísticas + asistencia */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Actividad</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-card p-3">
                <div className="text-xs text-muted-foreground">Asistencias este mes</div>
                <div className="text-2xl font-semibold mt-1">{monthly}</div>
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <div className="text-xs text-muted-foreground">Clase favorita</div>
                <div className="text-lg font-medium mt-1 truncate">{favorite ?? "—"}</div>
              </div>
            </div>
            {history.length > 0 && (
              <ul className="space-y-1">
                {history.slice(0, 6).map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
                  >
                    <span>{h.className}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(h.date)} · {h.time}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {membership && (
            <p className="text-xs text-muted-foreground">
              Estado guardado: {membership.status} · {membershipsRepo.query({ userId: user.id }).length} membresías históricas
            </p>
          )}
        </DialogContent>
      </Dialog>

      <AssignPlanDialog open={assigning} onOpenChange={setAssigning} userId={user.id} />
      <PaymentDialog
        open={paying}
        onOpenChange={setPaying}
        userId={user.id}
        membershipId={membership?.id}
        defaultAmount={plan?.priceMonthly}
      />
    </>
  );
}

interface AttendanceEntry {
  id: string;
  date: string;
  time: string;
  className: string;
}

function attendanceOf(userId: string): AttendanceEntry[] {
  const cis = checkinsRepo.query({ userId });
  const templates = classTemplatesRepo.list();
  const tplById = new Map(templates.map((t) => [t.id, t]));
  return cis
    .map((ci) => {
      const s = classSessionsRepo.getById(ci.sessionId);
      if (!s) return null;
      const tpl = tplById.get(s.templateId);
      return {
        id: ci.id,
        date: s.date,
        time: s.startTime,
        className: tpl?.name ?? "Clase",
      };
    })
    .filter((x): x is AttendanceEntry => !!x)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}

function monthlyAttendance(userId: string): number {
  const now = new Date();
  const firstKey = toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
  return attendanceOf(userId).filter((a) => a.date >= firstKey).length;
}

function favoriteClass(userId: string): string | null {
  const attendance = attendanceOf(userId);
  if (attendance.length === 0) return null;
  const counts = new Map<string, number>();
  attendance.forEach((a) => counts.set(a.className, (counts.get(a.className) ?? 0) + 1));
  let best: string | null = null;
  let bestCount = 0;
  counts.forEach((c, k) => {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  });
  return best;
}

export function lastAttendanceOf(userId: string): string | null {
  const list = attendanceOf(userId);
  if (list.length === 0) return null;
  const first = list[0];
  return `${formatDate(first.date)} · ${first.time}`;
}

// Re-export para evitar el warning de import no usado
void parseDateKey;
