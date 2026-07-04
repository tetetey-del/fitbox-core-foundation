import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Trophy,
  Menu,
  Users,
  Dumbbell,
  Settings,
  Newspaper,
} from "lucide-react";
import type { UserRole } from "@/types";
import { useRole } from "@/hooks/useRole";
import { useModules } from "@/hooks/useModules";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
  module?: keyof ReturnType<typeof useModules>;
}

const PRIMARY: NavItem[] = [
  { label: "Inicio", to: "/dashboard", icon: LayoutDashboard, roles: ["admin", "coach", "member"] },
  { label: "Reservas", to: "/reservas", icon: CalendarDays, roles: ["admin", "coach", "member"], module: "reservas" },
  { label: "PRs", to: "/prs", icon: Trophy, roles: ["admin", "coach", "member"], module: "prs" },
];

const SECONDARY: NavItem[] = [
  { label: "Feed", to: "/feed", icon: Newspaper, roles: ["admin", "coach", "member"], module: "feed" },
  { label: "Socios", to: "/socios", icon: Users, roles: ["admin", "coach"], module: "socios" },
  { label: "Clases", to: "/clases", icon: Dumbbell, roles: ["admin", "coach"], module: "reservas" },
  { label: "Configuración", to: "/configuracion", icon: Settings, roles: ["admin"] },
];

export function MobileNav() {
  const { isAny } = useRole();
  const modules = useModules();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);

  const filt = (list: NavItem[]) =>
    list.filter((n) => isAny(n.roles)).filter((n) => !n.module || modules[n.module]);
  const primary = filt(PRIMARY);
  const secondary = filt(SECONDARY);

  return (
    <>
      <div className="md:hidden h-16" aria-hidden />
      <nav
        aria-label="Navegación principal"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 border-t border-border bg-background/95 backdrop-blur"
      >
        <ul className="grid grid-cols-4 h-full">
          {primary.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-label={item.label}
                  className={cn(
                    "flex flex-col items-center justify-center h-full gap-1 text-[11px] font-medium",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Más opciones"
                  className="flex flex-col items-center justify-center h-full w-full gap-1 text-[11px] font-medium text-muted-foreground"
                >
                  <Menu className="h-5 w-5" strokeWidth={1.5} />
                  <span>Más</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="pb-8">
                <SheetHeader className="mb-4">
                  <SheetTitle>Menú</SheetTitle>
                </SheetHeader>
                <ul className="grid gap-1">
                  {secondary.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.to;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 h-11 rounded-md text-sm",
                            active
                              ? "bg-muted text-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                          )}
                        >
                          <Icon className="h-4 w-4" strokeWidth={1.5} />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                  {secondary.length === 0 && (
                    <li className="text-sm text-muted-foreground px-2 py-4">
                      No hay más opciones disponibles.
                    </li>
                  )}
                </ul>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
    </>
  );
}
