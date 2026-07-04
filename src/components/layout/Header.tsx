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
  if (!currentTenant || !currentUser) return null;

  const accent = currentTenant.brandColor;

  return (
    <header className="h-14 flex items-center justify-between border-b border-border px-4 md:px-6 bg-background">
      <div className="flex items-center gap-3 min-w-0">
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

      <div className="flex items-center gap-2">
        <Select value={currentUser.id} onValueChange={switchUser}>
          <SelectTrigger className="h-9 w-[220px]">
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
        <Button variant="ghost" size="icon" onClick={logout} title="Salir">
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>
    </header>
  );
}
