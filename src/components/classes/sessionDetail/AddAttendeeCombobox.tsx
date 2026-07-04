import { UserPlus } from "lucide-react";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  addable: User[];
  addUserId: string;
  onChangeUserId: (v: string) => void;
  onAdd: () => void;
}

/** Selector combinado para que staff añada un asistente manual a la sesión. */
export function AddAttendeeCombobox({ addable, addUserId, onChangeUserId, onAdd }: Props) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Añadir asistente
      </div>
      <div className="flex gap-2">
        <Select value={addUserId} onValueChange={onChangeUserId}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Seleccionar usuario" />
          </SelectTrigger>
          <SelectContent>
            {addable.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
            {addable.length === 0 && (
              <div className="p-2 text-xs text-muted-foreground">
                Todos los usuarios ya están apuntados.
              </div>
            )}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={onAdd} disabled={!addUserId}>
          <UserPlus className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}
