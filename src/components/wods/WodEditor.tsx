import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Plus, Save, Send, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Wod, WodBlock, WodBlockType } from "@/types";
import { WOD_BLOCK_LABEL } from "@/types";
import { toDateKey } from "@/lib/date";
import { getWodByDate, saveWod } from "@/lib/services/wods.service";
import { notifyDataChanged, useDataVersion } from "@/lib/data-bus";

const DEFAULT_BLOCKS: WodBlock[] = [
  { type: "calentamiento", content: "" },
  { type: "metcon", content: "" },
];

export function WodEditor() {
  useDataVersion();
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<WodBlock[]>(DEFAULT_BLOCKS);

  const existing: Wod | null = useMemo(() => getWodByDate(date), [date]);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setBlocks(existing.blocks.length ? existing.blocks : DEFAULT_BLOCKS);
    } else {
      setTitle("");
      setBlocks(DEFAULT_BLOCKS);
    }
  }, [date, existing]);

  const addBlock = () =>
    setBlocks((cur) => [...cur, { type: "accesorio", content: "" }]);

  const removeBlock = (idx: number) =>
    setBlocks((cur) => cur.filter((_, i) => i !== idx));

  const updateBlock = (idx: number, patch: Partial<WodBlock>) =>
    setBlocks((cur) => cur.map((b, i) => (i === idx ? { ...b, ...patch } : b)));

  const move = (idx: number, dir: -1 | 1) =>
    setBlocks((cur) => {
      const next = [...cur];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return cur;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const doSave = (publish: boolean) => {
    if (!title.trim() && !blocks.some((b) => b.content.trim())) {
      return toast.error("Añade al menos un bloque con contenido");
    }
    saveWod({ date, title, blocks: blocks.filter((b) => b.content.trim()), publish });
    toast.success(publish ? "WOD publicado" : "WOD guardado");
    notifyDataChanged();
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Fecha</Label>
          <div className="relative">
            <CalendarDays
              className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              strokeWidth={1.5}
            />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Título del WOD</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Fran, Cindy, 5x5 Back Squat…"
          />
        </div>
      </div>

      <div className="space-y-2">
        {blocks.map((b, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                className="text-muted-foreground/70 hover:text-foreground cursor-grab"
                aria-label="Reordenar"
                onClick={() => move(i, -1)}
              >
                <GripVertical className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <Select
                value={b.type}
                onValueChange={(v) => updateBlock(i, { type: v as WodBlockType })}
              >
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(WOD_BLOCK_LABEL) as WodBlockType[]).map((t) => (
                    <SelectItem key={t} value={t}>{WOD_BLOCK_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => move(i, 1)}
                aria-label="Bajar"
                className="h-7 text-xs"
                disabled={i === blocks.length - 1}
              >↓</Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => move(i, -1)}
                aria-label="Subir"
                className="h-7 text-xs"
                disabled={i === 0}
              >↑</Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeBlock(i)}
                aria-label="Eliminar bloque"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Button>
            </div>
            <Textarea
              value={b.content}
              onChange={(e) => updateBlock(i, { content: e.target.value })}
              placeholder={
                b.type === "metcon"
                  ? "21-15-9 Thrusters 43/30 kg + Pull-ups"
                  : b.type === "fuerza"
                    ? "5x5 Back Squat @ 80% 1RM"
                    : b.type === "calentamiento"
                      ? "3 rondas: 200m row + 10 air squats + 10 pass-throughs"
                      : "Accesorio a criterio del coach"
              }
              rows={3}
              className="text-sm"
            />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addBlock}>
          <Plus className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
          Añadir bloque
        </Button>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-border">
        {existing && (
          <span className="mr-auto text-xs text-muted-foreground self-center">
            {existing.cycleId
              ? "Del ciclo de programación · si lo cambias, solo cambia este día"
              : `${existing.published ? "Publicado" : "Borrador"} · guardado`}
          </span>
        )}
        <Button variant="outline" onClick={() => doSave(false)}>
          <Save className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
          Guardar borrador
        </Button>
        <Button onClick={() => doSave(true)}>
          <Send className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
          Publicar
        </Button>
      </div>
    </div>
  );
}
