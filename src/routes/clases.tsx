import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRequireModule } from "@/hooks/useRequireModule";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Repeat, Trash2, Ban } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { notifyDataChanged, useDataVersion } from "@/lib/data-bus";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import type { ClassTemplate, ClassType } from "@/types";
import { CLASS_TYPE_LABEL } from "@/types";
import { generateRecurringSessions } from "@/lib/services/sessions.service";
import { cancelSession, getSessionOccupancy } from "@/lib/services/booking.service";
import { addDays, DAY_LABELS, toDateKey } from "@/lib/date";

export const Route = createFileRoute("/clases")({ component: ClasesPage });

function ClasesPage() {
  useRequireModule("reservas");
  const { currentUser, tenantUsers } = useAuth();
  const navigate = useNavigate();
  useDataVersion();

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin" && currentUser.role !== "coach") {
      navigate({ to: "/dashboard" });
    }
  }, [currentUser, navigate]);

  const templates = classTemplatesRepo.list();
  const coaches = tenantUsers.filter((u) => u.role === "coach" || u.role === "admin");

  const [tab, setTab] = useState<string>("plantillas");
  const [editing, setEditing] = useState<ClassTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  return (
    <AppLayout>
      <PageHeader
        title="Clases"
        description="Gestiona las plantillas de clase y programa sesiones recurrentes."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
          <TabsTrigger value="sesiones">Sesiones próximas</TabsTrigger>
        </TabsList>

        <TabsContent value="plantillas" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {templates.length} plantilla{templates.length === 1 ? "" : "s"} definida
              {templates.length === 1 ? "" : "s"}.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setGenerating(true)}>
                <Repeat className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Generar sesiones
              </Button>
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Nueva plantilla
              </Button>
            </div>
          </div>

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
                        <Button size="icon" variant="ghost" onClick={() => setEditing(t)}>
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
        </TabsContent>

        <TabsContent value="sesiones">
          <UpcomingSessions templates={templates} coaches={coaches} />
        </TabsContent>
      </Tabs>

      <TemplateDialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        initial={editing}
        coaches={coaches}
      />

      <RecurringDialog
        open={generating}
        onOpenChange={setGenerating}
        templates={templates}
        coaches={coaches}
      />
    </AppLayout>
  );
}

function TemplateDialog({
  open,
  onOpenChange,
  initial,
  coaches,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: ClassTemplate | null;
  coaches: { id: string; name: string }[];
}) {
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
          <Field label="Nombre">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <Select value={type} onValueChange={(v) => setType(v as ClassType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CLASS_TYPE_LABEL) as ClassType[]).map((t) => (
                    <SelectItem key={t} value={t}>{CLASS_TYPE_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Coach por defecto">
              <Select value={coach} onValueChange={setCoach}>
                <SelectTrigger><SelectValue placeholder="Sin coach" /></SelectTrigger>
                <SelectContent>
                  {coaches.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duración (min)">
              <Input type="number" min={15} step={15} value={duration}
                onChange={(e) => setDuration(Number(e.target.value))} />
            </Field>
            <Field label="Aforo">
              <Input type="number" min={1} value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Color">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 rounded-md border border-border bg-background cursor-pointer"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>{initial ? "Guardar" : "Crear"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecurringDialog({
  open,
  onOpenChange,
  templates,
  coaches,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  templates: ClassTemplate[];
  coaches: { id: string; name: string }[];
}) {
  const [templateId, setTemplateId] = useState<string>(templates[0]?.id ?? "");
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [startTime, setStartTime] = useState("19:00");
  const [startDate, setStartDate] = useState(toDateKey(new Date()));
  const [endDate, setEndDate] = useState(toDateKey(addDays(new Date(), 28)));
  const [coachId, setCoachId] = useState<string>("");
  const [capacity, setCapacity] = useState<number>(12);

  useEffect(() => {
    if (open && templates[0]) {
      setTemplateId(templates[0].id);
      setCapacity(templates[0].defaultCapacity);
      setCoachId(templates[0].defaultCoachId ?? "");
    }
  }, [open, templates]);

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
    toast.success(`${res.created.length} sesiones creadas`, {
      description:
        res.skipped.length > 0
          ? `${res.skipped.length} omitidas por coincidir con otras existentes`
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
          <Field label="Plantilla">
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Días de la semana">
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
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Hora de inicio">
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </Field>
            <Field label="Aforo">
              <Input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Hasta">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>

          <Field label="Coach">
            <Select value={coachId} onValueChange={setCoachId}>
              <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
              <SelectContent>
                {coaches.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>Generar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpcomingSessions({
  templates,
  coaches,
}: {
  templates: ClassTemplate[];
  coaches: { id: string; name: string }[];
}) {
  useDataVersion();
  const todayKey = toDateKey(new Date());
  const templateById = new Map(templates.map((t) => [t.id, t]));
  const coachById = new Map(coaches.map((c) => [c.id, c]));
  const sessions = classSessionsRepo
    .list()
    .filter((s) => s.date >= todayKey)
    .sort((a, b) =>
      a.date === b.date
        ? a.startTime.localeCompare(b.startTime)
        : a.date.localeCompare(b.date),
    )
    .slice(0, 40);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Clase</TableHead>
            <TableHead>Coach</TableHead>
            <TableHead>Ocupación</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[80px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                No hay sesiones próximas.
              </TableCell>
            </TableRow>
          )}
          {sessions.map((s) => {
            const tpl = templateById.get(s.templateId);
            const coach = s.coachId ? coachById.get(s.coachId) : undefined;
            const occ = getSessionOccupancy(s.id);
            const cancelled = s.status === "cancelled";
            return (
              <TableRow key={s.id} className={cancelled ? "opacity-60" : ""}>
                <TableCell>{s.date}</TableCell>
                <TableCell>{s.startTime}</TableCell>
                <TableCell className="font-medium">{tpl?.name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{coach?.name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {occ.confirmed.length}/{occ.capacity}
                  {occ.waitlist.length > 0 && ` (+${occ.waitlist.length})`}
                </TableCell>
                <TableCell>
                  {cancelled ? (
                    <span className="text-xs text-red-400 font-medium">Cancelada</span>
                  ) : (
                    <span className="text-xs text-emerald-400 font-medium">Programada</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!cancelled && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (!confirm("¿Cancelar esta sesión y todas sus reservas?")) return;
                        cancelSession(s.id);
                        toast.success("Sesión cancelada");
                        notifyDataChanged();
                      }}
                    >
                      <Ban className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
