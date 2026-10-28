import { useState } from "react";
import { Lock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { notifyDataChanged } from "@/lib/data-bus";
import { exercisesRepo } from "@/lib/storage/repositories/exercises.repo";
import { addNote, deleteNote, notesOf, updateNote } from "@/lib/services/coachNotes.service";
import { formatDate } from "@/lib/date";
import type { CoachNote } from "@/types";

const GENERAL = "general";

/** Notas de los coaches sobre el socio (solo staff). Las atadas a un ejercicio avisan en las clases. */
export function MemberNotesTab({ memberId }: { memberId: string }) {
  const { session, currentUser, tenantUsers } = useAuth();
  const [text, setText] = useState("");
  const [exerciseId, setExerciseId] = useState(GENERAL);
  const [editing, setEditing] = useState<CoachNote | null>(null);

  if (!session || !currentUser) return null;
  const exercises = exercisesRepo.list().sort((a, b) => a.name.localeCompare(b.name));
  const exById = new Map(exercises.map((e) => [e.id, e]));
  const nameOf = (id: string) => tenantUsers.find((u) => u.id === id)?.name.split(" ")[0] ?? "Coach";
  const notes = notesOf(memberId);
  const isAdmin = currentUser.role === "admin";

  const reset = () => {
    setText("");
    setExerciseId(GENERAL);
    setEditing(null);
  };

  const save = () => {
    if (!text.trim()) return toast.error("Escribe la nota");
    const ex = exerciseId === GENERAL ? undefined : exerciseId;
    if (editing) updateNote(editing.id, { text, exerciseId: ex });
    else addNote({ tenantId: session.tenantId, memberId, authorId: currentUser.id, exerciseId: ex, text });
    notifyDataChanged();
    toast.success(editing ? "Nota actualizada" : "Nota guardada");
    reset();
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Notas de los coaches</h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" strokeWidth={2} /> Solo las ven el dueño y los coaches. Si eliges un ejercicio, verás el
          aviso en la clase cuando esté en el WOD.
        </p>
      </div>

      <div className="space-y-2 rounded-md border border-border p-3">
        <Select value={exerciseId} onValueChange={setExerciseId}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={GENERAL}>General (sin ejercicio)</SelectItem>
            {exercises.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Ej. Le cuesta mantener la espalda recta; bajar el peso y trabajar la técnica."
        />
        <div className="flex justify-end gap-2">
          {editing && (
            <Button variant="ghost" size="sm" onClick={reset}>
              Cancelar
            </Button>
          )}
          <Button size="sm" onClick={save}>
            {editing ? "Guardar cambios" : "Agregar nota"}
          </Button>
        </div>
      </div>

      {notes.length > 0 && (
        <ul className="space-y-2">
          {notes.map((n) => {
            const ex = n.exerciseId ? exById.get(n.exerciseId) : undefined;
            const mine = n.authorId === currentUser.id;
            return (
              <li key={n.id} className="rounded-md border border-border bg-card px-3 py-2">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    {ex && (
                      <span
                        className="mb-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ backgroundColor: "color-mix(in srgb, var(--brand) 18%, transparent)", color: "var(--brand)" }}
                      >
                        {ex.name}
                      </span>
                    )}
                    <p className="whitespace-pre-line text-sm">{n.text}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {nameOf(n.authorId)} · {formatDate(n.createdAt.slice(0, 10))}
                    </p>
                  </div>
                  {(mine || isAdmin) && (
                    <div className="flex shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Editar nota"
                        onClick={() => {
                          setEditing(n);
                          setText(n.text);
                          setExerciseId(n.exerciseId ?? GENERAL);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Borrar nota"
                        onClick={() => {
                          deleteNote(n.id);
                          notifyDataChanged();
                          if (editing?.id === n.id) reset();
                          toast.success("Nota borrada");
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" strokeWidth={1.5} />
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
