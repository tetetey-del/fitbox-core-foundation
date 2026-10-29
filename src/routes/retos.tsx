import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trophy, Trash2, Pencil, Users } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion, notifyDataChanged } from "@/lib/data-bus";
import { useRequireModule } from "@/hooks/useRequireModule";
import { challengesRepo, challengeParticipantsRepo } from "@/lib/storage/repositories/challenges.repo";
import { exercisesRepo } from "@/lib/storage/repositories/exercises.repo";
import {
  createChallenge,
  deleteChallenge,
  getChallengeRanking,
  joinChallenge,
  leaveChallenge,
  refreshChallenges,
  updateChallenge,
} from "@/lib/services/challenges.service";
import type { Challenge } from "@/types";
import { toDateKey, addDays, formatDate } from "@/lib/date";
import { formatPrValue } from "@/lib/format";
import { NumberInput } from "@/components/ui/number-input";

export const Route = createFileRoute("/retos")({
  head: () => ({ meta: [{ title: "Retos — Kinflow" }] }),
  component: RetosPage,
});

function RetosPage() {
  const enabled = useRequireModule("challenges");
  const { currentUser, tenantUsers } = useAuth();
  useDataVersion();
  const [editing, setEditing] = useState<Challenge | null>(null);
  const [creating, setCreating] = useState(false);
  const [rankingOf, setRankingOf] = useState<Challenge | null>(null);

  useEffect(() => {
    refreshChallenges();
  }, []);

  if (!enabled || !currentUser) return null;
  const isStaff = currentUser.role === "admin" || currentUser.role === "coach";
  const all = challengesRepo.list().sort((a, b) => b.startDate.localeCompare(a.startDate));
  const visible = isStaff ? all : all.filter((c) => c.status !== "draft");
  const userById = new Map(tenantUsers.map((u) => [u.id, u]));

  return (
    <AppLayout>
      <PageHeader title="Retos" description="Retos del mes de asistencia y benchmarks.">
        {isStaff && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Nuevo reto
          </Button>
        )}
      </PageHeader>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Trophy className="h-6 w-6 mx-auto text-muted-foreground" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-muted-foreground">
            No hay retos aún. {isStaff ? "Crea el primero." : "Vuelve pronto."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 max-w-3xl">
          {visible.map((c) => (
            <ChallengeCard
              key={c.id}
              ch={c}
              userId={currentUser.id}
              isStaff={isStaff}
              onEdit={() => setEditing(c)}
              onDelete={() => {
                deleteChallenge(c.id);
                toast.success("Reto eliminado");
                notifyDataChanged();
              }}
              onRanking={() => setRankingOf(c)}
            />
          ))}
        </div>
      )}

      <ChallengeFormDialog
        open={creating || !!editing}
        initial={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />

      <Dialog open={!!rankingOf} onOpenChange={(o) => !o && setRankingOf(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ranking · {rankingOf?.title}</DialogTitle>
          </DialogHeader>
          {rankingOf && <RankingList challenge={rankingOf} userById={userById} />}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function ChallengeCard({
  ch,
  userId,
  isStaff,
  onEdit,
  onDelete,
  onRanking,
}: {
  ch: Challenge;
  userId: string;
  isStaff: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRanking: () => void;
}) {
  const participants = challengeParticipantsRepo.query({ challengeId: ch.id });
  const my = participants.find((p) => p.userId === userId);
  const target = ch.type === "attendance" ? Number(ch.goal) || 0 : 0;
  const pct = my && target > 0 ? Math.min(100, Math.round((my.progress / target) * 100)) : 0;
  const ex = ch.type === "benchmark" ? exercisesRepo.getById(String(ch.goal)) : null;

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{ch.badge}</span>
            <h3 className="font-semibold truncate">{ch.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(ch.startDate)} → {formatDate(ch.endDate)} ·{" "}
            {ch.type === "attendance" ? `Asistencia · ${ch.goal} clases` : `Benchmark · ${ex?.name ?? "?"}`}
          </p>
          <p className="text-sm mt-2 text-muted-foreground">{ch.description}</p>
        </div>
        {isStaff && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        )}
      </div>

      {ch.type === "attendance" && my && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Progreso</span>
            <span>{my.progress} / {target}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-[#14B8A6]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      {ch.type === "benchmark" && my && ex && my.progress > 0 && (
        <p className="text-sm">Tu mejor marca: <span className="font-medium">{formatPrValue(my.progress, ex.unit)}</span></p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {ch.status === "active" && !my && (
          <Button
            size="sm"
            onClick={() => {
              joinChallenge(ch.id, userId);
              toast.success("Te has unido al reto");
              notifyDataChanged();
            }}
          >
            Unirme
          </Button>
        )}
        {ch.status === "active" && my && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              leaveChallenge(ch.id, userId);
              toast.success("Has salido del reto");
              notifyDataChanged();
            }}
          >
            Salir
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onRanking}>
          <Users className="h-4 w-4 mr-1" strokeWidth={1.5} /> Ranking ({participants.length})
        </Button>
        {ch.status === "finished" && (
          <span className="text-xs text-muted-foreground self-center">Finalizado</span>
        )}
      </div>
    </div>
  );
}

function RankingList({
  challenge,
  userById,
}: {
  challenge: Challenge;
  userById: Map<string, { name: string }>;
}) {
  const rows = getChallengeRanking(challenge.id);
  const ex = challenge.type === "benchmark" ? exercisesRepo.getById(String(challenge.goal)) : null;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sin participantes aún.</p>;
  return (
    <ol className="divide-y divide-border">
      {rows.map((r, i) => (
        <li key={r.userId} className="py-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className="w-5 text-muted-foreground">{i + 1}.</span>
            <span className="font-medium">{userById.get(r.userId)?.name ?? "?"}</span>
            {r.completedAt && <span title="Completado">✓</span>}
          </span>
          <span className="text-muted-foreground">
            {ex ? formatPrValue(r.progress, ex.unit) : `${r.progress} clases`}
          </span>
        </li>
      ))}
    </ol>
  );
}

function ChallengeFormDialog({
  open,
  initial,
  onClose,
}: {
  open: boolean;
  initial: Challenge | null;
  onClose: () => void;
}) {
  const { currentTenant } = useAuth();
  const exercises = useMemo(() => exercisesRepo.list(), []);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<Challenge["type"]>("attendance");
  const [attendGoal, setAttendGoal] = useState(12);
  const [exerciseId, setExerciseId] = useState<string>(exercises[0]?.id ?? "");
  const [startDate, setStartDate] = useState(toDateKey(new Date()));
  const [endDate, setEndDate] = useState(toDateKey(addDays(new Date(), 30)));
  const [badge, setBadge] = useState("🏆");

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setDesc(initial.description);
      setType(initial.type);
      if (initial.type === "attendance") setAttendGoal(Number(initial.goal));
      else setExerciseId(String(initial.goal));
      setStartDate(initial.startDate);
      setEndDate(initial.endDate);
      setBadge(initial.badge);
    } else {
      setTitle("");
      setDesc("");
      setType("attendance");
      setAttendGoal(12);
      setExerciseId(exercises[0]?.id ?? "");
      setStartDate(toDateKey(new Date()));
      setEndDate(toDateKey(addDays(new Date(), 30)));
      setBadge("🏆");
    }
  }, [initial, open, exercises]);

  const save = () => {
    if (!currentTenant) return;
    if (!title.trim()) return toast.error("Ponle un título al reto");
    if (endDate < startDate) return toast.error("La fecha fin debe ser posterior");
    const goal = type === "attendance" ? attendGoal : exerciseId;
    if (type === "benchmark" && !exerciseId) return toast.error("Elige un ejercicio");
    if (initial) {
      updateChallenge(initial.id, {
        title,
        description: desc,
        type,
        goal,
        startDate,
        endDate,
        badge,
      });
      toast.success("Reto actualizado");
    } else {
      createChallenge({
        tenantId: currentTenant.id,
        title,
        description: desc,
        type,
        goal,
        startDate,
        endDate,
        badge,
      });
      toast.success("Reto creado");
    }
    notifyDataChanged();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar reto" : "Nuevo reto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as Challenge["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Asistencia</SelectItem>
                  <SelectItem value="benchmark">Benchmark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Insignia (emoji)</Label>
              <Input value={badge} onChange={(e) => setBadge(e.target.value)} />
            </div>
          </div>
          {type === "attendance" ? (
            <div>
              <Label>Meta de asistencias</Label>
              <NumberInput
                min={1}
                value={attendGoal}
                onChange={(e) => setAttendGoal(Number(e.target.value))}
              />
            </div>
          ) : (
            <div>
              <Label>Ejercicio</Label>
              <Select value={exerciseId} onValueChange={setExerciseId}>
                <SelectTrigger><SelectValue placeholder="Elige…" /></SelectTrigger>
                <SelectContent>
                  {exercises.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Inicio</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Fin</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
