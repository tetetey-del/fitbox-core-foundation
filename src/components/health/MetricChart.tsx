import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SeriesPoint } from "@/lib/services/health.service";

/**
 * Gráfica de línea para una serie de mediciones corporales.
 * Carga recharts perezosamente.
 */
export default function MetricChart({ data, label }: { data: SeriesPoint[]; label: string }) {
  return (
    <div className="h-56 mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            labelFormatter={(l) => String(l)}
            formatter={(v: number) => [v, label]}
          />
          <Line type="monotone" dataKey="value" stroke="#14B8A6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
