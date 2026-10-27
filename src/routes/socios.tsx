import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { todayKey } from "@/lib/memberData";
import { useRequireModule } from "@/hooks/useRequireModule";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { MembershipUiStatus, User } from "@/types";
import { MEMBERSHIP_UI_LABEL } from "@/types";
import { usersRepo } from "@/lib/storage/repositories/users.repo";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion, notifyDataChanged } from "@/lib/data-bus";
import {
  getActiveMembership,
  getMembershipStatus,
  getPlan,
} from "@/lib/services/membership.service";
import { MembershipBadge } from "@/components/members/MembershipBadge";
import { CreditsBadge } from "@/components/members/CreditsBadge";
import {
  MemberDetailDialog,
  lastAttendanceOf,
} from "@/components/members/MemberDetailDialog";
import {
  InviteButton,
  InviteMemberDialog,
  PendingInvitations,
} from "@/components/socios/InvitationsSection";

export const Route = createFileRoute("/socios")({ component: SociosPage });

const FILTERS: (MembershipUiStatus | "all")[] = ["all", "active", "expiring_soon", "expired", "none"];
const FILTER_LABEL: Record<(typeof FILTERS)[number], string> = {
  all: "Todos",
  active: MEMBERSHIP_UI_LABEL.active,
  expiring_soon: MEMBERSHIP_UI_LABEL.expiring_soon,
  expired: MEMBERSHIP_UI_LABEL.expired,
  none: MEMBERSHIP_UI_LABEL.none,
};

function SociosPage() {
  useRequireModule("socios");
  const { currentUser, currentTenant } = useAuth();
  const navigate = useNavigate();
  useDataVersion();

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin" && currentUser.role !== "coach") {
      navigate({ to: "/dashboard" });
    }
  }, [currentUser, navigate]);

  const members = useMemo(
    () => usersRepo.list().filter((u) => u.role === "member"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useDataVersion()],
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((u) => (q ? u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) : true))
      .filter((u) => (filter === "all" ? true : getMembershipStatus(u.id) === filter))
      .sort((a, b) => a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, query, filter, useDataVersion()]);

  return (
    <AppLayout>
      <PageHeader
        title="Socios"
        description={`${members.length} socio${members.length === 1 ? "" : "s"} en ${currentTenant?.name}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o email"
              className="pl-8"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FILTERS.map((f) => (
                <SelectItem key={f} value={f}>{FILTER_LABEL[f]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <InviteButton onClick={() => setInviting(true)} />
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Nuevo socio
          </Button>
        </div>
      </div>
      {currentTenant && <PendingInvitations tenantId={currentTenant.id} />}

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Socio</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Créditos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última asistencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((u) => {
              const membership = getActiveMembership(u.id);
              const plan = membership ? getPlan(membership.planId) : null;
              const status = getMembershipStatus(u.id);
              const last = lastAttendanceOf(u.id);
              return (
                <TableRow
                  key={u.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(u)}
                >
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{plan?.name ?? "—"}</TableCell>
                  <TableCell><CreditsBadge userId={u.id} /></TableCell>
                  <TableCell><MembershipBadge status={status} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{last ?? "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <MemberDetailDialog
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        user={selected}
      />

      <NewMemberDialog open={creating} onOpenChange={setCreating} />
      <InviteMemberDialog open={inviting} onOpenChange={setInviting} />
    </AppLayout>
  );
}

function NewMemberDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { currentTenant } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setPhone("");
      setEmail("");
      setBirthDate("");
    }
  }, [open]);

  const submit = () => {
    if (!currentTenant) return;
    if (!name.trim() || !phone.trim() || !email.trim()) {
      return toast.error("Nombre, teléfono y email son obligatorios");
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return toast.error("Revisa el email");
    usersRepo.create({
      tenantId: currentTenant.id,
      name: name.trim(),
      email: email.trim(),
      role: "member",
      profile: { phone: phone.trim(), birthDate: birthDate || undefined },
    });
    toast.success("Socio creado", {
      description: "El resto de sus datos (DNI, dirección, contacto de emergencia) los completa el socio desde su cuenta.",
    });
    notifyDataChanged();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo socio</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Nombre y apellido *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Teléfono *</Label>
            <Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email *</Label>
            <Input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Fecha de nacimiento</Label>
            <Input type="date" value={birthDate} max={todayKey()} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Si no sabes la fecha de nacimiento, déjala vacía: al entrar, la app le pide al socio que la complete junto con su DNI, dirección y contacto de emergencia.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>Crear socio</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
