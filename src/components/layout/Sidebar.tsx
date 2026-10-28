import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Dumbbell,
  Trophy,
  Settings,
  Newspaper,
  User as UserIcon,
  Award,
  ClipboardList,
  ShoppingBag,
  BadgeCheck,
} from "lucide-react";
import type { UserRole } from "@/types";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/hooks/useModules";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
  module?: keyof ReturnType<typeof useModules>;
}

const STAFF_NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, roles: ["admin", "coach"] },
  { label: "Reservas", to: "/reservas", icon: CalendarDays, roles: ["admin", "coach"], module: "reservas" },
  { label: "Feed", to: "/feed", icon: Newspaper, roles: ["admin", "coach"], module: "feed" },
  { label: "Socios", to: "/socios", icon: Users, roles: ["admin", "coach"], module: "socios" },
  { label: "Clases", to: "/clases", icon: Dumbbell, roles: ["admin", "coach"], module: "reservas" },
  { label: "PRs", to: "/prs", icon: Trophy, roles: ["admin", "coach"], module: "prs" },
  { label: "Retos", to: "/retos", icon: Award, roles: ["admin", "coach"], module: "challenges" },
  { label: "Rutinas", to: "/rutinas", icon: ClipboardList, roles: ["admin", "coach"], module: "programs" },
  { label: "Tienda", to: "/tienda", icon: ShoppingBag, roles: ["admin", "coach"], module: "shop" },
  { label: "Configuración", to: "/configuracion", icon: Settings, roles: ["admin"] },
];

const MEMBER_NAV: NavItem[] = [
  { label: "Feed", to: "/feed", icon: Newspaper, roles: ["member"], module: "feed" },
  { label: "Reservas", to: "/reservas", icon: CalendarDays, roles: ["member"], module: "reservas" },
  { label: "Membresía", to: "/membresia", icon: BadgeCheck, roles: ["member"] },
  { label: "Mi cuenta", to: "/mi-cuenta", icon: UserIcon, roles: ["member"] },
];

export function Sidebar() {
  const { role, isAny } = useRole();
  const { currentTenant } = useAuth();
  const modules = useModules();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const source = role === "member" ? MEMBER_NAV : STAFF_NAV;
  const items = source
    .filter((n) => isAny(n.roles))
    .filter((n) => !n.module || modules[n.module]);

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-border bg-background">
      <div className="h-14 flex items-center gap-2 px-6 border-b border-border">
        {currentTenant?.logo ? (
          <img src={currentTenant.logo} alt="" className="h-6 w-6 rounded object-cover" />
        ) : null}
        <span className="font-semibold tracking-tight text-foreground truncate">
          {currentTenant?.name ?? "Kinflow"}
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {items.map((item) => {
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
        Kinflow · v0.9
      </div>
    </aside>
  );
}
