import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { notifyDataChanged } from "@/lib/data-bus";
import type { ClassTemplate, User } from "@/types";
import { CLASS_TYPE_LABEL } from "@/types";

interface Props {
  templates: ClassTemplate[];
  coaches: Pick<User, "id" | "name">[];
  onEdit: (t: ClassTemplate) => void;
}

/** Tabla de plantillas de clase con acciones de editar/eliminar. */
export function TemplatesTable({ templates, coaches, onEdit }: Props) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Duración</TableHead>
            <TableHead>Aforo</TableHead>
            <TableHead>Coach</TableHead>
            <TableHead className="w-[100px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                Todavía no hay plantillas.
              </TableCell>
            </TableRow>
          )}
          {templates.map((t) => {
            const coach = coaches.find((c) => c.id === t.defaultCoachId);
            return (
              <TableRow key={t.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: t.color ?? "var(--brand)" }}
                    />
                    {t.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{CLASS_TYPE_LABEL[t.type]}</TableCell>
                <TableCell className="text-muted-foreground">{t.durationMinutes} min</TableCell>
                <TableCell className="text-muted-foreground">{t.defaultCapacity}</TableCell>
                <TableCell className="text-muted-foreground">{coach?.name ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => onEdit(t)}>
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (!confirm(`¿Eliminar la plantilla "${t.name}"?`)) return;
                      classTemplatesRepo.remove(t.id);
                      toast.success("Plantilla eliminada");
                      notifyDataChanged();
                    }}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
