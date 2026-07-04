import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Exercise } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXERCISE_CATEGORY_LABEL, EXERCISE_UNIT_LABEL } from "@/types";
import { parseSeconds } from "@/lib/format";
import { toDateKey } from "@/lib/date";
import { registerPR } from "@/lib/services/prs.service";
import { notifyDataChanged } from "@/lib/data-bus";

interface PRFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  exercises: Exercise[];
  defaultExerciseId?: string;
}

export function PRFormDialog({
  open,
  onOpenChange,
  userId,
  exercises,
  defaultExerciseId,
}: PRFormDialogProps) {
  const [exerciseId, setExerciseId] = useState(defaultExerciseId ?? exercises[0]?.id ?? "");
  const [valueStr, setValueStr] = useState("");
  const [rx, setRx] = useState(true);
  const [date, setDate] = useState(toDateKey(new Date()));
  const [notes, setNotes] = useState("");

  const exercise = useMemo(
    () => exercises.find((e) => e.id === exerciseId) ?? null,
    [exercises, exerciseId],
  );

  function reset() {
    setValueStr("");
    setRx(true);
    setDate(toDateKey(new Date()));
    setNotes("");
    setExerciseId(defaultExerciseId ?? exercises[0]?.id ?? "");
  }

  function submit() {
    if (!exercise) {
      toast.error("Selecciona un ejercicio");
      return;
    }
    let value: number | null;
    if (exercise.unit === "tiempo") {
      value = parseSeconds(valueStr);
      if (value === null) {
        toast.error("Formato de tiempo no válido (usa mm:ss o hh:mm:ss)");
        return;
      }
    } else {
      const n = Number(valueStr.replace(",", "."));
      value = Number.isFinite(n) && n > 0 ? n : null;
      if (value === null) {
        toast.error("Introduce un valor válido");
        return;
      }
    }
    const pr = registerPR({
      userId,
      exerciseId: exercise.id,
      value,
      rx,
      date,
      notes: notes.trim() || undefined,
    });
    if (!pr) {
      toast.error("No se pudo registrar el PR");
      return;
    }
    notifyDataChanged();
    toast.success("PR registrado");
    reset();
    onOpenChange(false);
  }

  const placeholder =
    exercise?.unit === "tiempo" ? "mm:ss (ej. 3:45)" : `Valor en ${exercise ? EXERCISE_UNIT_LABEL[exercise.unit] : ""}`;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar PR</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Ejercicio</Label>
            <Select value={exerciseId} onValueChange={setExerciseId}>
              <SelectTrigger><SelectValue placeholder="Ejercicio" /></SelectTrigger>
              <SelectContent>
                {exercises.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} · {EXERCISE_CATEGORY_LABEL[e.category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Marca ({exercise ? EXERCISE_UNIT_LABEL[exercise.unit] : "—"})</Label>
            <Input
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              placeholder={placeholder}
              inputMode={exercise?.unit === "tiempo" ? "text" : "decimal"}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <div className="text-sm font-medium">RX</div>
              <div className="text-xs text-muted-foreground">
                {rx ? "Con pesos/estándares oficiales" : "Escalado"}
              </div>
            </div>
            <Switch checked={rx} onCheckedChange={setRx} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>Guardar PR</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
