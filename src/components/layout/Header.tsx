import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditsBadge } from "@/components/members/CreditsBadge";
import { MembershipBadge } from "@/components/members/MembershipBadge";
import { getMembershipStatus } from "@/lib/services/membership.service";
import { useDataVersion } from "@/lib/data-bus";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  coach: "Coach",
  member: "Socio",
};

export function Header() {
  const { currentTenant, currentUser, tenantUsers, switchUser, logout } = useAuth();
  useDataVersion();
  if (!currentTenant || !currentUser) return null;

  const accent = currentTenant.brandColor;
  const isMember = currentUser.role === "member";
  const status = isMember ? getMembershipStatus(currentUser.id) : null;

  return (
    <header className="h-14 flex items-center justify-between gap-3 border-b border-border px-3 sm:px-4 md:px-6 bg-background">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          aria-hidden
          className="h-6 w-1 rounded-full shrink-0"
          style={{ backgroundColor: accent }}
        />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">
            {currentTenant.name}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {ROLE_LABEL[currentUser.role]} · {currentUser.name}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isMember && status && (
          <>
            <MembershipBadge status={status} className="hidden sm:inline-flex" />
            <CreditsBadge userId={currentUser.id} className="hidden sm:inline-flex" />
          </>
        )}
        <Select value={currentUser.id} onValueChange={switchUser}>
          <SelectTrigger className="h-9 w-[140px] sm:w-[220px]" aria-label="Cambiar usuario">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tenantUsers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} — {ROLE_LABEL[u.role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Cerrar sesión" title="Salir">
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>
    </header>
  );
}

