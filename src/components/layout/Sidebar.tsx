import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Dumbbell,
  Trophy,
  Settings,
} from "lucide-react";
import type { UserRole } from "@/types";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, roles: ["admin", "coach", "member"] },
  { label: "Reservas", to: "/reservas", icon: CalendarDays, roles: ["admin", "coach", "member"] },
  { label: "Socios", to: "/socios", icon: Users, roles: ["admin", "coach"] },
  { label: "Clases", to: "/clases", icon: Dumbbell, roles: ["admin", "coach"] },
  { label: "PRs", to: "/prs", icon: Trophy, roles: ["admin", "coach", "member"] },
  { label: "Configuración", to: "/configuracion", icon: Settings, roles: ["admin"] },
];

export function Sidebar() {
  const { isAny } = useRole();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-border bg-background">
      <div className="h-14 flex items-center px-6 border-b border-border">
        <span className="font-semibold tracking-tight text-foreground">FitBox</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.filter((item) => isAny(item.roles)).map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 h-9 rounded-md text-sm transition-colors",
                active
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-muted-foreground border-t border-border">
        v0.1 · Fase 1
      </div>
    </aside>
  );
}
