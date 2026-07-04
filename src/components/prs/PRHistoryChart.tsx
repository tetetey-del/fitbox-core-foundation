import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Exercise, PersonalRecord } from "@/types";
import { formatPrValue, formatSeconds } from "@/lib/format";
import { formatDate } from "@/lib/date";

interface PRHistoryChartProps {
  exercise: Exercise;
  history: PersonalRecord[];
}

export function PRHistoryChart({ exercise, history }: PRHistoryChartProps) {
  if (history.length < 2) {
    return (
      <div className="text-sm text-muted-foreground">
        Necesitas al menos dos marcas para ver la evolución.
      </div>
    );
  }

  const data = history.map((pr) => ({
    date: pr.date,
    value: pr.value,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickFormatter={(v) => formatDate(v).replace(/ \d{4}$/, "")}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickFormatter={(v) =>
              exercise.unit === "tiempo" ? formatSeconds(Number(v)) : String(v)
            }
            width={exercise.unit === "tiempo" ? 56 : 40}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(l) => formatDate(String(l))}
            formatter={(v: number) => [formatPrValue(v, exercise.unit), "Marca"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
