import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Exercise, ExerciseCategory, ExerciseUnit } from "@/types";
import { EXERCISE_CATEGORY_LABEL, EXERCISE_UNIT_LABEL } from "@/types";
import { notifyDataChanged } from "@/lib/data-bus";
import {
  createExercise,
  deleteExercise,
  exerciseNameTaken,
  exercisePRCount,
  updateExercise,
} from "@/lib/services/prs.service";

export const EXERCISE_CATEGORY_ORDER: ExerciseCategory[] = ["fuerza", "olimpico", "benchmark_wod", "gimnastico", "cardio", "otro"];

const UNIT_HELP: Record<ExerciseUnit, string> = {
  kg: "kg (más es mejor)",
  reps: "repeticiones (más es mejor)",
  tiempo: "tiempo (menos es mejor)",
  metros: "metros (más es mejor)",
};

/** Catálogo de ejercicios del box: crear, renombrar, otros nombres, categoría, unidad y borrar. */
export function ExercisesManager({ tenantId, exercises }: { tenantId: string; exercises: Exercise[] }) {
  const [editing, setEditing] = useState<Exercise | "new" | null>(null);
  const [deleting, setDeleting] = useState<Exercise | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          Los ejercicios del box para marcas y para los avisos de los coaches. Agrega <strong>otros nombres</strong> (por
          ejemplo "Peso muerto" para Deadlift) para que se reconozcan en el WOD.
        </p>
        <Button onClick={() => setEditing("new")}>
          <Plus className="mr-1 h-4 w-4" strokeWidth={1.5} /> Nuevo ejercicio
        </Button>
      </div>

      {EXERCISE_CATEGORY_ORDER.map((cat) => {
        const items = exercises.filter((e) => e.category === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat}>
            <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{EXERCISE_CATEGORY_LABEL[cat]}</h3>
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {items.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{e.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {EXERCISE_UNIT_LABEL[e.unit]}
                      {e.aliases && e.aliases.length > 0 && ` · También: ${e.aliases.join(", ")}`}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" aria-label={`Editar ${e.name}`} onClick={() => setEditing(e)}>
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Borrar ${e.name}`} onClick={() => setDeleting(e)}>
                    <Trash2 className="h-4 w-4 text-destructive" strokeWidth={1.5} />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {editing && (
        <ExerciseDialog
          tenantId={tenantId}
          exercise={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && exercisePRCount(deleting.id) > 0
                ? `También se borran sus ${exercisePRCount(deleting.id)} marcas registradas. No se puede deshacer.`
                : "No tiene marcas registradas."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleting) return;
                deleteExercise(deleting.id);
                notifyDataChanged();
                toast.success("Ejercicio borrado");
                setDeleting(null);
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

function ExerciseDialog({ tenantId, exercise, onClose }: { tenantId: string; exercise: Exercise | null; onClose: () => void }) {
  const [name, setName] = useState(exercise?.name ?? "");
  const [aliases, setAliases] = useState((exercise?.aliases ?? []).join(", "));
  const [category, setCategory] = useState<ExerciseCategory>(exercise?.category ?? "fuerza");
  const [unit, setUnit] = useState<ExerciseUnit>(exercise?.unit ?? "kg");

  const save = () => {
    const n = name.trim();
    if (!n) return toast.error("Ponle un nombre al ejercicio");
    if (exerciseNameTaken(n, exercise?.id)) return toast.error("Ya hay un ejercicio con ese nombre");
    const input = { name: n, category, unit, aliases: aliases.split(",") };
    if (exercise) updateExercise(exercise.id, input);
    else createExercise(tenantId, input);
    notifyDataChanged();
    toast.success(exercise ? "Ejercicio actualizado" : "Ejercicio creado");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{exercise ? "Editar ejercicio" : "Nuevo ejercicio"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ex-name">Nombre</Label>
            <Input id="ex-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Thruster" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ex-aliases">Otros nombres (opcional)</Label>
            <Input
              id="ex-aliases"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder="Separados por comas. Ej. Peso muerto, DL"
            />
            <p className="text-xs text-muted-foreground">Así se reconoce en el WOD aunque lo escriban distinto.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExerciseCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXERCISE_CATEGORY_ORDER.map((c) => (
                    <SelectItem key={c} value={c}>
                      {EXERCISE_CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Se mide en</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as ExerciseUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(UNIT_HELP) as ExerciseUnit[]).map((u) => (
                    <SelectItem key={u} value={u}>
                      {UNIT_HELP[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
