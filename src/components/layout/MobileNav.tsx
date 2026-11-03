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
  User as UserIcon,
  Award,
  ClipboardList,
  ShoppingBag,
  BadgeCheck,
  LayoutGrid,
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

const STAFF_PRIMARY: NavItem[] = [
  { label: "Inicio", to: "/dashboard", icon: LayoutDashboard, roles: ["admin", "coach"] },
  { label: "Reservas", to: "/reservas", icon: CalendarDays, roles: ["admin", "coach"], module: "reservas" },
  { label: "Socios", to: "/socios", icon: Users, roles: ["admin", "coach"], module: "socios" },
];
const STAFF_SECONDARY: NavItem[] = [
  { label: "Feed", to: "/feed", icon: Newspaper, roles: ["admin", "coach"], module: "feed" },
  { label: "Clases", to: "/clases", icon: Dumbbell, roles: ["admin", "coach"], module: "reservas" },
  { label: "PRs", to: "/prs", icon: Trophy, roles: ["admin"], module: "prs" },
  { label: "Retos", to: "/retos", icon: Award, roles: ["admin"], module: "challenges" },
  { label: "Rutinas", to: "/rutinas", icon: ClipboardList, roles: ["admin", "coach"], module: "programs" },
  { label: "Tienda", to: "/tienda", icon: ShoppingBag, roles: ["admin"], module: "shop" },
  { label: "Configuración", to: "/configuracion", icon: Settings, roles: ["admin"] },
];

// Socio: cuatro secciones abajo. Membresía, retos, marcas y rutinas están en "Más"; Mi cuenta, en el avatar.
// Si el box no usa tienda, Membresía vuelve a la barra.
const MEMBER_PRIMARY: NavItem[] = [
  { label: "Feed", to: "/feed", icon: Newspaper, roles: ["member"], module: "feed" },
  { label: "Reservas", to: "/reservas", icon: CalendarDays, roles: ["member"], module: "reservas" },
  { label: "Tienda", to: "/tienda", icon: ShoppingBag, roles: ["member"], module: "shop" },
  { label: "Más", to: "/mas", icon: LayoutGrid, roles: ["member"] },
];
const MEMBER_SECONDARY: NavItem[] = [];

export function MobileNav() {
  const { role, isAny } = useRole();
  const modules = useModules();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);

  const isMember = role === "member";
  const primaryRaw = isMember ? MEMBER_PRIMARY : STAFF_PRIMARY;
  const secondaryRaw = isMember ? MEMBER_SECONDARY : STAFF_SECONDARY;

  const filt = (list: NavItem[]) =>
    list.filter((n) => isAny(n.roles)).filter((n) => !n.module || modules[n.module]);
  let primary = filt(primaryRaw);
  if (isMember && !modules.shop) {
    const i = primary.findIndex((n) => n.to === "/mas");
    primary = [...primary.slice(0, i), { label: "Membresía", to: "/membresia", icon: BadgeCheck, roles: ["member"] }, ...primary.slice(i)];
  }
  const secondary = filt(secondaryRaw);

  return (
    <>
      <div className="md:hidden h-16" aria-hidden />
      <nav
        aria-label="Navegación principal"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid h-16 grid-cols-4">
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
                  style={active ? { color: "var(--brand)" } : undefined}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
          {!isMember && <li>
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
          </li>}
        </ul>
      </nav>
    </>
  );
}
