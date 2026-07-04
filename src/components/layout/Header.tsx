import { useNavigate } from "@tanstack/react-router";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditsBadge } from "@/components/members/CreditsBadge";
import { MembershipBadge } from "@/components/members/MembershipBadge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getMembershipStatus } from "@/lib/services/membership.service";
import { useDataVersion } from "@/lib/data-bus";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  coach: "Coach",
  member: "Socio",
};

export function Header() {
  const { currentTenant, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  useDataVersion();
  if (!currentTenant || !currentUser) return null;

  const accent = currentTenant.brandColor;
  const isMember = currentUser.role === "member";
  const status = isMember ? getMembershipStatus(currentUser.id) : null;

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

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
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5" aria-label="Menú de cuenta">
              <UserIcon className="h-4 w-4" strokeWidth={1.5} />
              <span className="hidden sm:inline text-sm">{currentUser.name.split(" ")[0]}</span>
              <ChevronDown className="h-3 w-3 opacity-60" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="text-sm font-medium">{currentUser.name}</div>
              <div className="text-xs text-muted-foreground">{currentUser.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isMember && (
              <DropdownMenuItem onClick={() => navigate({ to: "/mi-cuenta" })}>
                <UserIcon className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Mi cuenta
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
