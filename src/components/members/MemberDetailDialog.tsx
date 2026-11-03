import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/types";
import { getActiveMembership, getMembershipStatus, getPlan } from "@/lib/services/membership.service";
import { membershipsRepo } from "@/lib/storage/repositories/memberships.repo";
import { useDataVersion } from "@/lib/data-bus";
import { AssignPlanDialog } from "./AssignPlanDialog";
import { PaymentDialog } from "./PaymentDialog";
import { MembershipBadge } from "./MembershipBadge";
import { CreditsBadge } from "./CreditsBadge";
import { MemberProfileTab } from "./memberDetail/MemberProfileTab";
import { MemberMembershipTab } from "./memberDetail/MemberMembershipTab";
import { MemberPaymentsTab } from "./memberDetail/MemberPaymentsTab";
import { MemberAttendanceTab } from "./memberDetail/MemberAttendanceTab";
import { MemberNotesTab } from "./memberDetail/MemberNotesTab";
import { UserAvatar } from "@/components/members/UserAvatar";
import { MemberPRsTab } from "./memberDetail/MemberPRsTab";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/hooks/useModules";

// Re-export para no romper importadores existentes.
export { lastAttendanceOf } from "./memberDetail/attendance.helpers";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: User | null;
}

/**
 * Diálogo de ficha completa del socio. Se compone de 4 secciones
 * independientes (perfil, membresía, pagos, asistencia) definidas en
 * `./memberDetail/*` y de los diálogos anidados para asignar plan y
 * registrar pagos.
 */
export function MemberDetailDialog({ open, onOpenChange, user }: Props) {
  useDataVersion();
  const [assigning, setAssigning] = useState(false);
  const [paying, setPaying] = useState(false);
  const { currentUser } = useAuth();
  const modules = useModules();
  // El coach ve una ficha recortada: nombre, foto, notas, marcas y asistencia. Sin cuota, pagos ni datos personales.
  const isCoach = currentUser?.role === "coach";

  if (!user) return null;

  if (isCoach) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <UserAvatar name={user.name} src={user.avatar} className="h-10 w-10 text-sm" />
              {user.name}
            </DialogTitle>
            <DialogDescription>Notas, marcas y asistencia.</DialogDescription>
          </DialogHeader>
          <MemberNotesTab memberId={user.id} />
          {modules.prs && (
            <>
              <Separator />
              <MemberPRsTab userId={user.id} />
            </>
          )}
          <Separator />
          <MemberAttendanceTab userId={user.id} />
        </DialogContent>
      </Dialog>
    );
  }

  const membership = getActiveMembership(user.id);
  const plan = membership ? getPlan(membership.planId) : null;
  const uiStatus = getMembershipStatus(user.id);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <UserAvatar name={user.name} src={user.avatar} className="h-10 w-10 text-sm" />
              {user.name}
              <MembershipBadge status={uiStatus} />
              <CreditsBadge userId={user.id} />
            </DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>

          <MemberProfileTab user={user} />
          <Separator />
          <MemberNotesTab memberId={user.id} />
          <Separator />
          <MemberMembershipTab userId={user.id} onAssign={() => setAssigning(true)} />
          <Separator />
          <MemberPaymentsTab userId={user.id} onNewPayment={() => setPaying(true)} />
          <Separator />
          <MemberAttendanceTab userId={user.id} />

          {membership && (
            <p className="text-xs text-muted-foreground">
              Estado guardado: {membership.status} ·{" "}
              {membershipsRepo.query({ userId: user.id }).length} membresías históricas
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
