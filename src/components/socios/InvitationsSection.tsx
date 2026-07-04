import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { notifyDataChanged, useDataVersion } from "@/lib/data-bus";
import type { Invitation, InvitationStatus } from "@/types";
import {
  buildInvitationLink,
  createInvitation,
  expireOutdatedInvitations,
  listInvitationsForTenant,
  regenerateInvitation,
  revokeInvitation,
} from "@/lib/services/invitations.service";
import { membershipPlansRepoFor } from "@/lib/storage/repositories/membershipPlans.repo";

const STATUS_LABEL: Record<InvitationStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  revoked: "Revocada",
  expired: "Caducada",
};

const STATUS_STYLE: Record<InvitationStatus, string> = {
  pending: "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30",
  accepted: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  revoked: "bg-muted text-muted-foreground border-border",
  expired: "bg-muted text-muted-foreground border-border",
};

export function InviteMemberDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { currentTenant, session } = useAuth();
  const [role, setRole] = useState<"coach" | "member">("member");
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState<string>("");
  const [created, setCreated] = useState<Invitation | null>(null);

  const plans = useMemo(() => {
    if (!currentTenant) return [];
    return membershipPlansRepoFor(currentTenant.id).query({ active: true });
  }, [currentTenant]);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setRole("member");
      setPlanId("");
      setCreated(null);
    }
  }, [open]);

  const submit = () => {
    if (!currentTenant || !session) return;
    const inv = createInvitation({
      tenantId: currentTenant.id,
      invitedBy: session.userId,
      role,
      email: email.trim() || undefined,
      planId: planId || undefined,
    });
    setCreated(inv);
    notifyDataChanged();
  };

  const copyLink = () => {
    if (!created) return;
    navigator.clipboard
      .writeText(buildInvitationLink(created.code))
      .then(() => toast.success("Enlace copiado"))
      .catch(() => toast.error("No se pudo copiar"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar a alguien nuevo</DialogTitle>
        </DialogHeader>
        {!created ? (
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "coach" | "member")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Socio/a</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email (opcional)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {role === "member" && plans.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Plan preasignado (opcional)</Label>
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger><SelectValue placeholder="Sin preasignar" /></SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} · {p.priceMonthly}€/mes</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">Invitación generada. Comparte este enlace:</p>
            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
              <code className="block text-xs font-mono break-all">{buildInvitationLink(created.code)}</code>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Código:</span>
                <span className="font-mono text-sm font-semibold tracking-wider">{created.code}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Válido hasta {new Date(created.expiresAt).toLocaleDateString("es-ES")}.
            </p>
          </div>
        )}
        <DialogFooter>
          {!created ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={submit}>Generar invitación</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cerrar</Button>
              <Button onClick={copyLink}>
                <Copy className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Copiar enlace
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PendingInvitations({ tenantId }: { tenantId: string }) {
  useDataVersion();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    expireOutdatedInvitations(tenantId);
  }, [tenantId]);

  const invitations = listInvitationsForTenant(tenantId);
  if (invitations.length === 0) return null;

  const copy = (code: string) => {
    navigator.clipboard
      .writeText(buildInvitationLink(code))
      .then(() => toast.success("Enlace copiado"));
  };

  const regen = (id: string) => {
    setLoading(true);
    regenerateInvitation(tenantId, id);
    notifyDataChanged();
    setLoading(false);
    toast.success("Código regenerado");
  };

  const revoke = (id: string) => {
    revokeInvitation(tenantId, id);
    notifyDataChanged();
    toast.success("Invitación revocada");
  };

  return (
    <section className="mt-6 rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-medium mb-3">Invitaciones</h3>
      <ul className="divide-y divide-border">
        {invitations.map((i) => (
          <li key={i.id} className="py-3 flex flex-wrap items-center gap-3 justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium">
                {i.email ?? "(sin email)"} · {i.role === "coach" ? "Coach" : "Socio"}
              </div>
              <div className="text-xs text-muted-foreground font-mono truncate">
                {i.code} · caduca {new Date(i.expiresAt).toLocaleDateString("es-ES")}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${STATUS_STYLE[i.status]}`}>
                {STATUS_LABEL[i.status]}
              </span>
              {i.status === "pending" && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => copy(i.code)} aria-label="Copiar enlace">
                    <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => regen(i.id)} aria-label="Regenerar" disabled={loading}>
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => revoke(i.id)} aria-label="Revocar">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" strokeWidth={1.5} />
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InviteButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick}>
      <UserPlus className="h-4 w-4 mr-2" strokeWidth={1.5} />
      Invitar
    </Button>
  );
}
