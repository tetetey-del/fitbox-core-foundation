import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, TrendingUp, UserPlus, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDataVersion } from "@/lib/data-bus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  getExpiringMemberships,
  getMonthlyKpis,
  getMonthlyRevenue,
  getOccupancyByWeekday,
} from "@/lib/services/analytics.service";
import { formatMoney, formatMonthShort } from "@/lib/format";
import { formatDate } from "@/lib/date";
import { pendingOrdersCount } from "@/lib/services/shop.service";
import { useModules } from "@/hooks/useModules";
import { ShoppingBag } from "lucide-react";


/**
 * Panel principal del rol admin: KPIs mensuales, gráficos de ingresos y
 * ocupación, y listado de membresías próximas a expirar.
 */
export function OwnerDashboard() {
  useDataVersion();
  const kpis = useMemo(() => getMonthlyKpis(), []);
  const revenue = useMemo(() => getMonthlyRevenue(6), []);
  const occupancy = useMemo(() => getOccupancyByWeekday(4), []);
  const expiring = useMemo(() => getExpiringMemberships(7), []);

  const modules = useModules();
  const pendingOrders = useMemo(() => (modules.shop ? pendingOrdersCount() : 0), [modules.shop]);

  const revenueData = revenue.map((r) => ({ ...r, label: formatMonthShort(r.month) }));

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ingresos del mes"
          value={formatMoney(kpis.revenue)}
          icon={<TrendingUp className="h-4 w-4" strokeWidth={1.5} />}
        />
        <KpiCard
          label="Socios activos"
          value={kpis.activeMembers}
          icon={<Users className="h-4 w-4" strokeWidth={1.5} />}
        />
        <KpiCard
          label="Altas del mes"
          value={kpis.newMembersThisMonth}
          icon={<UserPlus className="h-4 w-4" strokeWidth={1.5} />}
        />
        <KpiCard
          label="Asistencias del mes"
          value={kpis.attendancesThisMonth}
          icon={<Calendar className="h-4 w-4" strokeWidth={1.5} />}
        />
      </div>

      {modules.shop && pendingOrders > 0 && (
        <Link
          to="/tienda"
          className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-[#F97316]" strokeWidth={1.5} />
            <div>
              <div className="text-sm font-medium">Pedidos pendientes en la tienda</div>
              <p className="text-xs text-muted-foreground">
                {pendingOrders} pedido{pendingOrders === 1 ? "" : "s"} sin preparar.
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        </Link>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium mb-1">Ingresos por mes</h3>
          <p className="text-xs text-muted-foreground mb-4">Últimos 6 meses</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [formatMoney(v), "Ingresos"]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium mb-1">Ocupación media por día</h3>
          <p className="text-xs text-muted-foreground mb-4">Últimas 4 semanas · % del aforo</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="weekday" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v}%`, "Ocupación"]}
                />
                <Bar dataKey="occupancy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium">Membresías que expiran pronto</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Próximos 7 días</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/socios">Ver socios <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} /></Link>
          </Button>
        </div>
        {expiring.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay membresías próximas a expirar.</p>
        ) : (
          <div className="divide-y divide-border">
            {expiring.map((e) => (
              <div key={e.userId} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium">{e.userName}</div>
                  <div className="text-xs text-muted-foreground">Caduca {formatDate(e.endDate)}</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {e.daysLeft === 0 ? "Hoy" : `${e.daysLeft} día${e.daysLeft === 1 ? "" : "s"}`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
