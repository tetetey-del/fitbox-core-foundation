import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, Copy, Users as UsersIcon, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { hasPersonalTraining } from "@/lib/services/membership.service";
import { useDataVersion, notifyDataChanged } from "@/lib/data-bus";
import { useRequireModule } from "@/hooks/useRequireModule";
import {
  assignProgram,
  assignmentProgress,
  createProgram,
  deleteProgram,
  duplicateProgram,
  listMyAssignments,
  listProgramSessions,
  markSessionCompleted,
  unassignProgram,
  unmarkSession,
  upsertProgramSession,
} from "@/lib/services/programs.service";
import { programsRepo, programAssignmentsRepo, programProgressRepo } from "@/lib/storage/repositories/programs.repo";
import type { Program, ProgramSession, WodBlock, WodBlockType } from "@/types";
import { PROGRAM_LEVEL_LABEL, WOD_BLOCK_LABEL } from "@/types";
import { DAY_LABELS } from "@/lib/date";

export const Route = createFileRoute("/rutinas")({
  head: () => ({ meta: [{ title: "Rutinas — Kinflow" }] }),
  component: RutinasPage,
});

function RutinasPage() {
  const enabled = useRequireModule("programs");
  const { currentUser } = useAuth();
  useDataVersion();
  if (!enabled || !currentUser) return null;
  const isStaff = currentUser.role === "admin" || currentUser.role === "coach";
  return (
    <AppLayout>
      <PageHeader title="Rutinas" description="Programas semanales para socios." />
      {isStaff ? (
        <StaffView />
      ) : hasPersonalTraining(currentUser.id) ? (
        <MemberView userId={currentUser.id} />
      ) : (
        <EmptyState text="Tu plan no incluye entreno personalizado. Si te interesa, habla con tu box." />
      )}
    </AppLayout>
  );
}

function StaffView() {
  const { currentTenant, tenantUsers } = useAuth();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const programs = programsRepo.list().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <Tabs defaultValue="programs">
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="programs">Programas</TabsTrigger>
          <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
        </TabsList>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} /> Nuevo programa
        </Button>
      </div>

      <TabsContent value="programs" className="space-y-4">
        {programs.length === 0 ? (
          <EmptyState text="Crea tu primer programa (por ejemplo, Fuerza básica 4 semanas)." />
        ) : (
          programs.map((p) => (
            <ProgramRow key={p.id} program={p} onEdit={() => setEditing(p)} />
          ))
        )}
      </TabsContent>
      <TabsContent value="assignments">
        <AssignmentsTable users={tenantUsers} />
      </TabsContent>

      {(creating || editing) && currentTenant && (
        <ProgramEditorDialog
          open={creating || !!editing}
          program={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </Tabs>
  );
}

function ProgramRow({ program, onEdit }: { program: Program; onEdit: () => void }) {
  const { tenantUsers, currentUser, currentTenant } = useAuth();
  const [assignOpen, setAssignOpen] = useState(false);
  const [pickedUser, setPickedUser] = useState<string>("");
  const eligibleMembers = tenantUsers.filter((u) => u.role === "member" && hasPersonalTraining(u.id));
  const sessionsCount = listProgramSessions(program.id).length;
  const assignments = programAssignmentsRepo.query({ programId: program.id });

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{program.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {program.weeks} semanas · {PROGRAM_LEVEL_LABEL[program.level]} · {sessionsCount} sesiones · {assignments.length} asignados
          </p>
          <p className="text-sm mt-2 text-muted-foreground">{program.description}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>Editar</Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              duplicateProgram(program.id);
              toast.success("Programa duplicado");
              notifyDataChanged();
            }}
          >
            <Copy className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              deleteProgram(program.id);
              toast.success("Programa eliminado");
              notifyDataChanged();
            }}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
          <UsersIcon className="h-4 w-4 mr-1" strokeWidth={1.5} /> Asignar a socio
        </Button>
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar "{program.title}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Socio</Label>
              <Select value={pickedUser} onValueChange={setPickedUser}>
                <SelectTrigger><SelectValue placeholder="Elige socio…" /></SelectTrigger>
                <SelectContent>
                  {eligibleMembers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {eligibleMembers.length === 0
                  ? "Ningún socio tiene un plan con entreno personalizado. Actívalo en Configuración → Planes y precios."
                  : "Solo aparecen los socios cuyo plan incluye entreno personalizado."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
            <Button
              disabled={!pickedUser}
              onClick={() => {
                if (!currentTenant || !currentUser) return;
                assignProgram({
                  tenantId: currentTenant.id,
                  programId: program.id,
                  userId: pickedUser,
                  assignedBy: currentUser.id,
                });
                toast.success("Programa asignado");
                notifyDataChanged();
                setAssignOpen(false);
                setPickedUser("");
              }}
            >
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssignmentsTable({ users }: { users: Array<{ id: string; name: string }> }) {
  const userById = new Map(users.map((u) => [u.id, u]));
  const assignments = programAssignmentsRepo
    .list()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (assignments.length === 0) return <EmptyState text="Aún no hay programas asignados." />;
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="text-left p-2">Socio</th>
            <th className="text-left p-2">Programa</th>
            <th className="text-left p-2">Progreso</th>
            <th className="text-left p-2">Estado</th>
            <th />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {assignments.map((a) => {
            const p = programsRepo.getById(a.programId);
            const prog = assignmentProgress(a.id);
            return (
              <tr key={a.id}>
                <td className="p-2">{userById.get(a.userId)?.name ?? "?"}</td>
                <td className="p-2">{p?.title ?? "?"}</td>
                <td className="p-2">{prog.done}/{prog.total} ({prog.pct}%)</td>
                <td className="p-2">{a.status}</td>
                <td className="p-2 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      unassignProgram(a.id);
                      toast.success("Asignación eliminada");
                      notifyDataChanged();
                    }}
                  >
                    Quitar
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MemberView({ userId }: { userId: string }) {
  const items = listMyAssignments(userId);
  if (items.length === 0) return <EmptyState text="Aún no te han asignado ninguna rutina." />;
  return (
    <div className="grid gap-4 max-w-3xl">
      {items.map(({ assignment, program, progress }) => {
        const sessions = listProgramSessions(program.id);
        const done = new Set(programProgressRepo.query({ assignmentId: assignment.id }).map((p) => p.programSessionId));
        return (
          <div key={assignment.id} className="rounded-lg border border-border bg-card p-5 space-y-3">
            <div>
              <h3 className="font-semibold">{program.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {program.weeks} semanas · {PROGRAM_LEVEL_LABEL[program.level]}
              </p>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Progreso</span><span>{progress.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-[#14B8A6]" style={{ width: `${progress.pct}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: program.weeks }).map((_, wi) => {
                const week = wi + 1;
                const wSessions = sessions.filter((s) => s.weekNumber === week);
                if (wSessions.length === 0) return null;
                return (
                  <Collapsible key={week} defaultOpen={week === 1}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                      Semana {week}
                      <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {wSessions.map((s) => (
                        <MemberSessionRow
                          key={s.id}
                          session={s}
                          assignmentId={assignment.id}
                          tenantId={assignment.tenantId}
                          completed={done.has(s.id)}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MemberSessionRow({
  session,
  assignmentId,
  tenantId,
  completed,
}: {
  session: ProgramSession;
  assignmentId: string;
  tenantId: string;
  completed: boolean;
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium">
            Día {session.dayNumber} ({DAY_LABELS[(session.dayNumber - 1) % 7]}) · {session.title}
          </div>
          <ul className="mt-1 text-xs text-muted-foreground space-y-0.5">
            {session.blocks.map((b, i) => (
              <li key={i}>
                <span className="font-medium text-foreground">{WOD_BLOCK_LABEL[b.type]}:</span> {b.content}
              </li>
            ))}
          </ul>
        </div>
        {completed ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              unmarkSession(assignmentId, session.id);
              toast.success("Sesión desmarcada");
              notifyDataChanged();
            }}
          >
            <Check className="h-4 w-4 mr-1" strokeWidth={1.5} /> Hecha
          </Button>
        ) : (
          <Button size="sm" onClick={() => setNotesOpen(true)}>Marcar hecha</Button>
        )}
      </div>
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sesión completada</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                markSessionCompleted({
                  tenantId,
                  assignmentId,
                  programSessionId: session.id,
                  notes: notes || undefined,
                });
                toast.success("Sesión marcada");
                notifyDataChanged();
                setNotesOpen(false);
                setNotes("");
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Editor de programa ----

function ProgramEditorDialog({
  open,
  program,
  onClose,
}: {
  open: boolean;
  program: Program | null;
  onClose: () => void;
}) {
  const { currentTenant, currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [level, setLevel] = useState<Program["level"]>("iniciacion");
  const [current, setCurrent] = useState<Program | null>(null);

  useMemo(() => {
    if (program) {
      setTitle(program.title);
      setDescription(program.description);
      setWeeks(program.weeks);
      setLevel(program.level);
      setCurrent(program);
    } else {
      setTitle("");
      setDescription("");
      setWeeks(4);
      setLevel("iniciacion");
      setCurrent(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program?.id]);

  const saveMeta = () => {
    if (!currentTenant || !currentUser) return;
    if (!title.trim()) return toast.error("Falta título");
    if (current) {
      programsRepo.update(current.id, { title, description, weeks, level });
      toast.success("Programa actualizado");
    } else {
      const created = createProgram({
        tenantId: currentTenant.id,
        title,
        description,
        weeks,
        level,
        createdBy: currentUser.id,
      });
      setCurrent(created);
      toast.success("Programa creado");
    }
    notifyDataChanged();
  };

  const sessions = current ? listProgramSessions(current.id) : [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{current ? "Editar programa" : "Nuevo programa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Semanas</Label>
              <Input type="number" min={1} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} />
            </div>
            <div>
              <Label>Nivel</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as Program["level"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROGRAM_LEVEL_LABEL) as Program["level"][]).map((k) => (
                    <SelectItem key={k} value={k}>{PROGRAM_LEVEL_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={saveMeta}>{current ? "Guardar datos" : "Crear programa"}</Button>

          {current && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h4 className="text-sm font-medium">Sesiones</h4>
              {Array.from({ length: weeks }).map((_, i) => {
                const week = i + 1;
                const wSessions = sessions.filter((s) => s.weekNumber === week);
                return (
                  <Collapsible key={week} defaultOpen={week === 1}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                      Semana {week} ({wSessions.length})
                      <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {wSessions.map((s) => (
                        <SessionEditor
                          key={s.id}
                          tenantId={current.tenantId}
                          programId={current.id}
                          session={s}
                        />
                      ))}
                      <SessionEditor
                        tenantId={current.tenantId}
                        programId={current.id}
                        defaultWeek={week}
                        isNew
                      />
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SessionEditor({
  tenantId,
  programId,
  session,
  defaultWeek,
  isNew,
}: {
  tenantId: string;
  programId: string;
  session?: ProgramSession;
  defaultWeek?: number;
  isNew?: boolean;
}) {
  const [title, setTitle] = useState(session?.title ?? "");
  const [day, setDay] = useState(session?.dayNumber ?? 1);
  const [blocks, setBlocks] = useState<WodBlock[]>(
    session?.blocks ?? [{ type: "metcon", content: "" }],
  );

  const save = () => {
    if (!title.trim()) return toast.error("Falta título");
    upsertProgramSession({
      tenantId,
      programId,
      weekNumber: session?.weekNumber ?? defaultWeek ?? 1,
      dayNumber: day,
      title,
      blocks,
      id: session?.id,
    });
    notifyDataChanged();
    toast.success("Sesión guardada");
    if (isNew) {
      setTitle("");
      setDay(1);
      setBlocks([{ type: "metcon", content: "" }]);
    }
  };

  return (
    <div className={`rounded-md border ${isNew ? "border-dashed" : ""} border-border p-3 space-y-2`}>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Label className="text-xs">Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isNew ? "Nueva sesión…" : ""} />
        </div>
        <div>
          <Label className="text-xs">Día</Label>
          <Input type="number" min={1} max={7} value={day} onChange={(e) => setDay(Number(e.target.value))} />
        </div>
      </div>
      {blocks.map((b, i) => (
        <div key={i} className="grid grid-cols-4 gap-2 items-start">
          <Select
            value={b.type}
            onValueChange={(v) => setBlocks(blocks.map((x, ix) => (ix === i ? { ...x, type: v as WodBlockType } : x)))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(WOD_BLOCK_LABEL) as WodBlockType[]).map((k) => (
                <SelectItem key={k} value={k}>{WOD_BLOCK_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            className="col-span-3"
            rows={2}
            value={b.content}
            onChange={(e) =>
              setBlocks(blocks.map((x, ix) => (ix === i ? { ...x, content: e.target.value } : x)))
            }
          />
        </div>
      ))}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setBlocks([...blocks, { type: "accesorio", content: "" }])}
        >
          + bloque
        </Button>
        <div className="flex gap-2">
          {!isNew && session && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                programsRepo; // no-op para importar el símbolo
                if (session.id) {
                  // usa el servicio
                  import("@/lib/services/programs.service").then((m) => {
                    m.deleteProgramSession(session.id);
                    notifyDataChanged();
                  });
                }
              }}
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          )}
          <Button size="sm" onClick={save}>{isNew ? "Añadir" : "Guardar"}</Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
