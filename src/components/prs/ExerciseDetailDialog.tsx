import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { Exercise, PersonalRecord } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date";
import { formatPrValue } from "@/lib/format";
import { deletePR, getExerciseHistory } from "@/lib/services/prs.service";
import { notifyDataChanged, useDataVersion } from "@/lib/data-bus";
import { PRHistoryChart } from "./PRHistoryChart";

interface ExerciseDetailDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  exercise: Exercise | null;
  userId: string;
  canEdit?: boolean;
}

export function ExerciseDetailDialog({
  open,
  onOpenChange,
  exercise,
  userId,
  canEdit = true,
}: ExerciseDetailDialogProps) {
  useDataVersion();
  if (!exercise) return null;
  const history: PersonalRecord[] = getExerciseHistory(userId, exercise.id);
  const desc = [...history].sort((a, b) => b.date.localeCompare(a.date));

  function handleDelete(id: string) {
    if (deletePR(id)) {
      notifyDataChanged();
      toast.success("Marca eliminada");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{exercise.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6">
          <PRHistoryChart exercise={exercise} history={history} />

          {desc.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sin marcas registradas.</div>
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2">Fecha</th>
                    <th className="text-right px-3 py-2">Marca</th>
                    <th className="text-right px-3 py-2">Tipo</th>
                    <th className="text-left px-3 py-2">Notas</th>
                    {canEdit && <th className="w-10" />}
                  </tr>
                </thead>
                <tbody>
                  {desc.map((pr) => (
                    <tr key={pr.id} className="border-t border-border">
                      <td className="px-3 py-2">{formatDate(pr.date)}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatPrValue(pr.value, exercise.unit)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Badge variant={pr.rx ? "default" : "secondary"} className="text-[10px]">
                          {pr.rx ? "RX" : "Scaled"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {pr.notes ?? "—"}
                      </td>
                      {canEdit && (
                        <td className="px-2 py-2 text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(pr.id)}>
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
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
      </DialogContent>
    </Dialog>
  );
}
