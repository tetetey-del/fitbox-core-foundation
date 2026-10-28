import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Copy, Repeat, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { WodBlock, WodBlockType, WodCycle, WodCycleDay } from "@/types";
import { WOD_BLOCK_LABEL } from "@/types";
import { notifyDataChanged, useDataVersion } from "@/lib/data-bus";
import { addDays, formatDate, parseDateKey, toDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  CYCLE_DAYS_AHEAD,
  MAX_CYCLE_WEEKS,
  WEEKDAY_LABEL,
  cyclePosition,
  dayKey,
  deleteCycle,
  hasContent,
  listCycles,
  mondayOf,
  saveCycle,
} from "@/lib/services/wodCycle.service";

const BLOCK_ORDER: WodBlockType[] = ["calentamiento", "fuerza", "metcon", "accesorio"];

function blockText(day: WodCycleDay | undefined, type: WodBlockType): string {
  return day?.blocks.find((b) => b.type === type)?.content ?? "";
}

function withBlock(day: WodCycleDay | undefined, type: WodBlockType, content: string): WodCycleDay {
  const map = new Map<WodBlockType, string>(BLOCK_ORDER.map((t) => [t, blockText(day, t)]));
  map.set(type, content);
  const blocks: WodBlock[] = BLOCK_ORDER.filter((t) => (map.get(t) ?? "").trim()).map((t) => ({ type: t, content: map.get(t)! }));
  return { title: day?.title ?? "", blocks };
}

/**
 * Ciclo de programación: se arman una vez las N semanas y la app pone el WOD de cada día,
 * repitiendo desde la semana 1 al terminar. Cada box elige cuántas semanas dura.
 */
export function WodCycleManager() {
  useDataVersion();
  const cycles = listCycles();
  const current = cycles.find((c) => c.active) ?? cycles[0] ?? null;
  const [creating, setCreating] = useState(false);

  if (!current && !creating) {
    return (
      <div className="space-y-3 rounded-lg border border-dashed border-border p-5 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Repeat className="h-4 w-4" strokeWidth={1.75} style={{ color: "var(--brand)" }} />
          Programación que se repite
        </div>
        <p className="text-muted-foreground">
          Si tu box programa por ciclos (por ejemplo, 12 semanas), arma las semanas una sola vez y elige cuándo empieza la
          semana 1. La app pone el WOD de cada día y, al terminar la última semana, vuelve a empezar. Si un día cambias
          algo desde "WOD por día", solo cambia ese día.
        </p>
        <Button onClick={() => setCreating(true)}>Crear ciclo</Button>
      </div>
    );
  }

  return <CycleEditor key={current?.id ?? "new"} cycle={creating ? null : current} onDone={() => setCreating(false)} />;
}

function CycleEditor({ cycle, onDone }: { cycle: WodCycle | null; onDone: () => void }) {
  const today = toDateKey(new Date());
  const [name, setName] = useState(cycle?.name ?? "Programación");
  const [weeks, setWeeks] = useState(cycle?.weeks ?? 12);
  const [startDate, setStartDate] = useState(cycle?.startDate ?? mondayOf(today));
  const [active, setActive] = useState(cycle?.active ?? true);
  const [days, setDays] = useState<Record<string, WodCycleDay>>(cycle?.days ?? {});
  const [week, setWeek] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dirty, setDirty] = useState(false);

  const pos = useMemo(() => cyclePosition({ startDate, weeks }, today), [startDate, weeks, today]);
  useEffect(() => {
    if (pos) setWeek(pos.week);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeWeeks = Math.min(MAX_CYCLE_WEEKS, Math.max(1, Number(weeks) || 1));
  const filledWeeks = new Set(Object.entries(days).filter(([, d]) => hasContent(d)).map(([k]) => Number(k.split("-")[0])));

  const setDay = (d: number, next: WodCycleDay) => {
    setDays((cur) => ({ ...cur, [dayKey(week, d)]: next }));
    setDirty(true);
  };

  const copyPrevious = () => {
    if (week <= 1) return;
    setDays((cur) => {
      const next = { ...cur };
      for (let d = 1; d <= 7; d++) {
        const prev = cur[dayKey(week - 1, d)];
        if (prev) next[dayKey(week, d)] = { title: prev.title, blocks: prev.blocks.map((b) => ({ ...b })) };
        else delete next[dayKey(week, d)];
      }
      return next;
    });
    setDirty(true);
    toast.success(`Semana ${week - 1} copiada en la semana ${week}`);
  };

  const save = () => {
    saveCycle(cycle?.id ?? null, { name, weeks: safeWeeks, startDate, active, days });
    notifyDataChanged();
    setDirty(false);
    toast.success("Ciclo guardado", {
      description: active ? `Los WODs de las próximas ${CYCLE_DAYS_AHEAD / 7} semanas ya están en el calendario.` : "El ciclo está apagado.",
    });
    onDone();
  };

  const weekStart = addDays(parseDateKey(mondayOf(startDate)), 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Nombre</Label>
          <Input value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Dura (semanas)</Label>
          <Input
            type="number"
            min={1}
            max={MAX_CYCLE_WEEKS}
            value={weeks}
            onChange={(e) => {
              setWeeks(Number(e.target.value));
              setDirty(true);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Empieza la semana 1</Label>
          <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setDirty(true); }} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span>La semana 1 empieza el lunes {formatDate(toDateKey(weekStart))}.</span>
        {pos && active && (
          <span className="font-medium" style={{ color: "var(--brand)" }}>
            Hoy: semana {pos.week} de {safeWeeks} · {WEEKDAY_LABEL[pos.day - 1].toLowerCase()}
          </span>
        )}
        <label className="ml-auto flex items-center gap-2 text-sm text-foreground">
          <Switch checked={active} onCheckedChange={(v) => { setActive(v); setDirty(true); }} />
          Activo
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs text-muted-foreground">Semana</Label>
          {week > 1 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={copyPrevious}>
              <Copy className="mr-1 h-3.5 w-3.5" strokeWidth={1.5} /> Copiar semana {week - 1}
            </Button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {Array.from({ length: safeWeeks }, (_, i) => i + 1).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWeek(w)}
              className={cn(
                "relative h-9 min-w-9 shrink-0 rounded-md border px-2 text-sm transition-colors",
                w === week ? "border-transparent font-semibold text-white" : "border-border hover:border-foreground/40",
              )}
              style={w === week ? { backgroundColor: "var(--brand)" } : undefined}
              aria-pressed={w === week}
            >
              {w}
              {filledWeeks.has(w) && w !== week && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--brand)" }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {WEEKDAY_LABEL.map((label, i) => {
          const d = i + 1;
          const day = days[dayKey(week, d)];
          const isToday = pos?.week === week && pos.day === d && active;
          return (
            <Collapsible key={`${week}-${d}`} defaultOpen={hasContent(day) || isToday}>
              <div className={cn("rounded-lg border bg-card", isToday ? "border-[var(--brand)]" : "border-border")}>
                <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
                  <span className="w-24 shrink-0 text-sm font-medium">{label}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {hasContent(day) ? day.title || day.blocks.map((b) => WOD_BLOCK_LABEL[b.type]).join(" · ") : "Sin WOD"}
                  </span>
                  {isToday && <span className="text-[10px] font-semibold uppercase" style={{ color: "var(--brand)" }}>Hoy</span>}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 px-3 pb-3">
                  <Input
                    value={day?.title ?? ""}
                    onChange={(e) => setDay(d, { ...(day ?? { blocks: [] }), title: e.target.value })}
                    placeholder="Título (opcional). Ej. Fran, 5x5 Back Squat…"
                  />
                  {BLOCK_ORDER.map((t) => (
                    <div key={t} className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">{WOD_BLOCK_LABEL[t]}</Label>
                      <Textarea
                        rows={2}
                        className="text-sm"
                        value={blockText(day, t)}
                        onChange={(e) => setDay(d, withBlock(day, t, e.target.value))}
                      />
                    </div>
                  ))}
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {cycle && (
          <Button variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="mr-1.5 h-4 w-4" strokeWidth={1.5} /> Borrar ciclo
          </Button>
        )}
        {!cycle && (
          <Button variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{dirty ? "Hay cambios sin guardar" : ""}</span>
        <Button onClick={save}>Guardar ciclo</Button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar el ciclo "{cycle?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitan del calendario los WODs futuros que puso el ciclo. Los días pasados y los que editaste a mano se
              quedan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (cycle) deleteCycle(cycle.id);
                notifyDataChanged();
                toast.success("Ciclo borrado");
                onDone();
              }}
            >
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
