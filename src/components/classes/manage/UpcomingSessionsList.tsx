import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { getSessionOccupancy, removeSessions, sessionHasPeople } from "@/lib/services/booking.service";
import { notifyDataChanged, useDataVersion } from "@/lib/data-bus";
import { formatDate, toDateKey } from "@/lib/date";
import type { ClassTemplate, User } from "@/types";

interface Props {
  templates: ClassTemplate[];
  coaches: Pick<User, "id" | "name">[];
}

const ALL = "all";
const PAGE = 60;

/**
 * Próximas sesiones, con filtro por clase y fecha. El dueño puede elegir varias y
 * quitarlas de una vez: las vacías se borran y las que tienen gente se cancelan.
 */
export function UpcomingSessionsList({ templates, coaches }: Props) {
  useDataVersion();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const todayKey = toDateKey(new Date());
  const [templateFilter, setTemplateFilter] = useState(ALL);
  const [from, setFrom] = useState(todayKey);
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<string[] | null>(null);

  const templateById = new Map(templates.map((t) => [t.id, t]));
  const coachById = new Map(coaches.map((c) => [c.id, c]));
  const filtered = classSessionsRepo
    .list()
    .filter(
      (s) =>
        s.date >= (from || todayKey) &&
        (!to || s.date <= to) &&
        (templateFilter === ALL || s.templateId === templateFilter),
    )
    .sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)));
  const sessions = filtered.slice(0, limit);
  const visibleIds = sessions.map((s) => s.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggle = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });

  const summary = useMemo(() => {
    if (!confirming) return { empty: 0, withPeople: 0 };
    const withPeople = confirming.filter((id) => sessionHasPeople(id)).length;
    return { empty: confirming.length - withPeople, withPeople };
  }, [confirming]);

  const doRemove = () => {
    if (!confirming) return;
    const res = removeSessions(confirming);
    const parts = [];
    if (res.deleted) parts.push(`${res.deleted} borrada${res.deleted === 1 ? "" : "s"}`);
    if (res.cancelled) parts.push(`${res.cancelled} cancelada${res.cancelled === 1 ? "" : "s"}`);
    toast.success(parts.length ? `Clases quitadas: ${parts.join(" y ")}` : "No había nada para quitar");
    setSelected((cur) => {
      const next = new Set(cur);
      confirming.forEach((id) => next.delete(id));
      return next;
    });
    setConfirming(null);
    notifyDataChanged();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[160px] flex-1 sm:flex-none">
          <div className="mb-1 text-xs text-muted-foreground">Clase</div>
          <Select value={templateFilter} onValueChange={(v) => { setTemplateFilter(v); setLimit(PAGE); }}>
            <SelectTrigger className="h-9 sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Desde</div>
          <Input type="date" className="h-9 w-[150px]" value={from} min={todayKey} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <div className="mb-1 text-xs text-muted-foreground">Hasta</div>
          <Input type="date" className="h-9 w-[150px]" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {isAdmin && selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
          <span className="text-sm font-medium">
            {selected.size} {selected.size === 1 ? "clase elegida" : "clases elegidas"}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Quitar selección
          </Button>
          <Button variant="destructive" size="sm" className="ml-auto" onClick={() => setConfirming([...selected])}>
            <Trash2 className="mr-1.5 h-4 w-4" strokeWidth={1.5} /> Quitar {selected.size}
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && (
                <TableHead className="w-10">
                  <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAll} aria-label="Elegir todas" />
                </TableHead>
              )}
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Clase</TableHead>
              <TableHead className="hidden sm:table-cell">Coach</TableHead>
              <TableHead>Ocupación</TableHead>
              <TableHead className="hidden sm:table-cell">Estado</TableHead>
              {isAdmin && <TableHead className="w-[60px] text-right" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No hay sesiones con ese filtro.
                </TableCell>
              </TableRow>
            )}
            {sessions.map((s) => {
              const tpl = templateById.get(s.templateId);
              const coach = s.coachId ? coachById.get(s.coachId) : undefined;
              const occ = getSessionOccupancy(s.id);
              const cancelled = s.status === "cancelled";
              return (
                <TableRow key={s.id} className={cancelled ? "opacity-60" : ""} data-state={selected.has(s.id) ? "selected" : undefined}>
                  {isAdmin && (
                    <TableCell>
                      <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} aria-label="Elegir clase" />
                    </TableCell>
                  )}
                  <TableCell className="whitespace-nowrap">{formatDate(s.date)}</TableCell>
                  <TableCell>{s.startTime}</TableCell>
                  <TableCell className="font-medium">
                    {tpl?.name ?? "—"}
                    {cancelled && <span className="ml-2 text-xs font-medium text-red-400 sm:hidden">Cancelada</span>}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{coach?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {occ.confirmed.length}/{occ.capacity}
                    {occ.waitlist.length > 0 && ` (+${occ.waitlist.length})`}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {cancelled ? (
                      <span className="text-xs font-medium text-red-400">Cancelada</span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-400">Programada</span>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Quitar clase"
                        onClick={() => setConfirming([s.id])}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filtered.length > limit && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
            Ver más ({filtered.length - limit})
          </Button>
        </div>
      )}

      <AlertDialog open={!!confirming} onOpenChange={(v) => !v && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Quitar {confirming?.length === 1 ? "esta clase" : `estas ${confirming?.length} clases`}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                {summary.empty > 0 && (
                  <p>
                    {summary.empty === 1 ? "1 no tiene" : `${summary.empty} no tienen`} a nadie anotado: se borra
                    {summary.empty === 1 ? "" : "n"}.
                  </p>
                )}
                {summary.withPeople > 0 && (
                  <p>
                    {summary.withPeople === 1 ? "1 tiene" : `${summary.withPeople} tienen`} socios anotados: se cancela
                    {summary.withPeople === 1 ? "" : "n"}, se devuelven los créditos y se avisa a cada socio.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={doRemove}>
              Quitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
