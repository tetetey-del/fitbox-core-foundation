import { lazy, Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toDateKey, formatDate } from "@/lib/date";
import { notifyDataChanged, useDataVersion } from "@/lib/data-bus";
import {
  addMetric,
  deleteMetric,
  latestMetric,
  listUserMetrics,
  series,
  type MetricKey,
} from "@/lib/services/health.service";
import { NumberInput } from "@/components/ui/number-input";

const MetricChart = lazy(() => import("./MetricChart"));

interface Props {
  userId: string;
  tenantId: string;
  canEdit: boolean;
}

/**
 * Panel de progreso con gráficas de evolución y registro manual.
 * En modo `canEdit=false` se usa desde la ficha del socio (solo lectura).
 */
export default function ProgressPanel({ userId, tenantId, canEdit }: Props) {
  useDataVersion();
  const metrics = useMemo(() => listUserMetrics(userId), [userId, useDataVersion()]);
  const latest = latestMetric(userId);
  const [tab, setTab] = useState<MetricKey>("weightKg");

  const [date, setDate] = useState(toDateKey(new Date()));
  const [weight, setWeight] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [hr, setHr] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    try {
      const w = weight ? Number(weight) : undefined;
      const f = fat ? Number(fat) : undefined;
      const h = hr ? Number(hr) : undefined;
      if (w === undefined && f === undefined && h === undefined) {
        toast.error("Introduce al menos una medida");
        return;
      }
      addMetric({
        tenantId,
        userId,
        date,
        weightKg: w,
        bodyFatPct: f,
        restingHr: h,
        notes: notes || undefined,
      });
      toast.success("Medición registrada");
      setWeight(""); setFat(""); setHr(""); setNotes("");
      notifyDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const data = series(userId, tab);

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground rounded-md border border-dashed border-border p-2">
        Próximamente: sincronización con Garmin y Strava.
      </p>

      {canEdit && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-medium">Registrar medición</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Peso (kg)</Label>
              <NumberInput step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">% graso</Label>
              <NumberInput step="0.1" value={fat} onChange={(e) => setFat(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">FC reposo</Label>
              <NumberInput value={hr} onChange={(e) => setHr(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Notas</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>Guardar medición</Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex justify-between mb-3">
          <h2 className="text-sm font-medium">Evolución</h2>
          {latest && (
            <span className="text-xs text-muted-foreground">Última: {formatDate(latest.date)}</span>
          )}
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as MetricKey)}>
          <TabsList>
            <TabsTrigger value="weightKg">Peso</TabsTrigger>
            <TabsTrigger value="bodyFatPct">% graso</TabsTrigger>
            <TabsTrigger value="restingHr">FC reposo</TabsTrigger>
          </TabsList>
          <TabsContent value={tab}>
            {data.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aún no hay datos.</p>
            ) : (
              <Suspense fallback={<div className="h-56" />}>
                <MetricChart data={data} label={metricLabel(tab)} />
              </Suspense>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-medium mb-3">Historial</h2>
        {metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin registros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Peso</th>
                  <th className="text-left p-2">% graso</th>
                  <th className="text-left p-2">FC</th>
                  <th className="text-left p-2">Notas</th>
                  {canEdit && <th />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...metrics].reverse().map((m) => (
                  <tr key={m.id}>
                    <td className="p-2">{formatDate(m.date)}</td>
                    <td className="p-2">{m.weightKg ?? "—"}</td>
                    <td className="p-2">{m.bodyFatPct ?? "—"}</td>
                    <td className="p-2">{m.restingHr ?? "—"}</td>
                    <td className="p-2 text-xs text-muted-foreground">{m.notes ?? ""}</td>
                    {canEdit && (
                      <td className="p-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { deleteMetric(m.id); notifyDataChanged(); }}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function metricLabel(k: MetricKey): string {
  return k === "weightKg" ? "Peso (kg)" : k === "bodyFatPct" ? "% graso" : "FC reposo";
}
