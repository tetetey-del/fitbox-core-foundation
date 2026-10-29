import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { generateRecurringSessions } from "@/lib/services/sessions.service";
import { notifyDataChanged } from "@/lib/data-bus";
import { addDays, DAY_LABELS, toDateKey } from "@/lib/date";
import type { ClassTemplate, User } from "@/types";
import { ClassFieldRow } from "./ClassFieldRow";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  templates: ClassTemplate[];
  coaches: Pick<User, "id" | "name">[];
}

/** Diálogo para generar sesiones recurrentes a partir de una plantilla. */
export function RecurringSessionsDialog({ open, onOpenChange, templates, coaches }: Props) {
  const [templateId, setTemplateId] = useState<string>(templates[0]?.id ?? "");
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [startTime, setStartTime] = useState("19:00");
  const [startDate, setStartDate] = useState(toDateKey(new Date()));
  const [endDate, setEndDate] = useState(toDateKey(addDays(new Date(), 28)));
  const [coachId, setCoachId] = useState<string>("");
  const [capacity, setCapacity] = useState<number>(12);

  // Solo al abrir el diálogo se elige la primera plantilla. Antes se reiniciaba cada vez que
  // llegaban datos nuevos y terminaba generando sesiones de la primera plantilla.
  useEffect(() => {
    if (open && templates[0]) {
      setTemplateId(templates[0].id);
      setCapacity(templates[0].defaultCapacity);
      setCoachId(templates[0].defaultCoachId ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const t = templates.find((x) => x.id === templateId);
    if (t) {
      setCapacity(t.defaultCapacity);
      if (!coachId && t.defaultCoachId) setCoachId(t.defaultCoachId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const toggleDay = (d: number) =>
    setWeekdays((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort(),
    );

  const submit = () => {
    const t = templates.find((x) => x.id === templateId);
    if (!t) return toast.error("Selecciona una plantilla");
    if (weekdays.length === 0) return toast.error("Selecciona al menos un día");
    const [sy, sm, sd] = startDate.split("-").map(Number);
    const [ey, em, ed] = endDate.split("-").map(Number);
    const res = generateRecurringSessions({
      templateId: t.id,
      weekdays,
      startTime,
      startDate: new Date(sy, sm - 1, sd),
      endDate: new Date(ey, em - 1, ed),
      coachId: coachId || undefined,
      capacity,
      durationMinutes: t.durationMinutes,
    });
    toast.success(`${res.created.length} sesiones de ${t.name} creadas`, {
      description:
        res.skipped.length > 0
          ? `${res.skipped.length} omitidas: ya había una clase de ${t.name} ese día a esa hora`
          : undefined,
    });
    notifyDataChanged();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generar sesiones recurrentes</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <ClassFieldRow label="Plantilla">
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ClassFieldRow>

          <ClassFieldRow label="Días de la semana">
            <div className="flex flex-wrap gap-1.5">
              {DAY_LABELS.map((label, i) => {
                const active = weekdays.includes(i);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`h-9 w-11 rounded-md border text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </ClassFieldRow>

          <div className="grid grid-cols-2 gap-3">
            <ClassFieldRow label="Hora de inicio">
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </ClassFieldRow>
            <ClassFieldRow label="Aforo">
              <Input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </ClassFieldRow>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ClassFieldRow label="Desde">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </ClassFieldRow>
            <ClassFieldRow label="Hasta">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </ClassFieldRow>
          </div>

          <ClassFieldRow label="Coach">
            <Select value={coachId} onValueChange={setCoachId}>
              <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
              <SelectContent>
                {coaches.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ClassFieldRow>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>Generar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
