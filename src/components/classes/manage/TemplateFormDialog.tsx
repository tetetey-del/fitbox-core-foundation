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
import { useAuth } from "@/contexts/AuthContext";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { notifyDataChanged } from "@/lib/data-bus";
import type { ClassTemplate, ClassType, User } from "@/types";
import { CLASS_TYPE_LABEL } from "@/types";
import { ClassFieldRow } from "./ClassFieldRow";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: ClassTemplate | null;
  coaches: Pick<User, "id" | "name">[];
}

/** Diálogo de creación/edición de una plantilla de clase. */
export function TemplateFormDialog({ open, onOpenChange, initial, coaches }: Props) {
  const { currentTenant } = useAuth();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<ClassType>(initial?.type ?? "wod");
  const [duration, setDuration] = useState(initial?.durationMinutes ?? 60);
  const [capacity, setCapacity] = useState(initial?.defaultCapacity ?? 12);
  const [coach, setCoach] = useState<string>(initial?.defaultCoachId ?? "");
  const [color, setColor] = useState(initial?.color ?? "#F97316");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setType(initial?.type ?? "wod");
      setDuration(initial?.durationMinutes ?? 60);
      setCapacity(initial?.defaultCapacity ?? 12);
      setCoach(initial?.defaultCoachId ?? "");
      setColor(initial?.color ?? "#F97316");
    }
  }, [open, initial]);

  const submit = () => {
    if (!name.trim()) return toast.error("El nombre es obligatorio");
    if (!currentTenant) return;
    const payload = {
      name: name.trim(),
      type,
      durationMinutes: Number(duration),
      defaultCapacity: Number(capacity),
      defaultCoachId: coach || undefined,
      color,
    };
    if (initial) {
      classTemplatesRepo.update(initial.id, payload);
      toast.success("Plantilla actualizada");
    } else {
      classTemplatesRepo.create({ ...payload, tenantId: currentTenant.id });
      toast.success("Plantilla creada");
    }
    notifyDataChanged();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <ClassFieldRow label="Nombre">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </ClassFieldRow>
          <div className="grid grid-cols-2 gap-3">
            <ClassFieldRow label="Tipo">
              <Select value={type} onValueChange={(v) => setType(v as ClassType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CLASS_TYPE_LABEL) as ClassType[]).map((t) => (
                    <SelectItem key={t} value={t}>{CLASS_TYPE_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ClassFieldRow>
            <ClassFieldRow label="Coach por defecto">
              <Select value={coach} onValueChange={setCoach}>
                <SelectTrigger><SelectValue placeholder="Sin coach" /></SelectTrigger>
                <SelectContent>
                  {coaches.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ClassFieldRow>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ClassFieldRow label="Duración (min)">
              <Input
                type="number"
                min={15}
                step={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
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
          <ClassFieldRow label="Color">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 rounded-md border border-border bg-background cursor-pointer"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </ClassFieldRow>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>{initial ? "Guardar" : "Crear"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
