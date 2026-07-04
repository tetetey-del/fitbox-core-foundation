import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Exercise, ExerciseCategory } from "@/types";
import { EXERCISE_CATEGORY_LABEL } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion } from "@/lib/data-bus";
import { exercisesRepo } from "@/lib/storage/repositories/exercises.repo";
import {
  getLeaderboard,
  getUserPRs,
  type RxFilter,
} from "@/lib/services/prs.service";
import { PRCard } from "@/components/prs/PRCard";
import { PRFormDialog } from "@/components/prs/PRFormDialog";
import { LeaderboardTable } from "@/components/prs/LeaderboardTable";
import { ExerciseDetailDialog } from "@/components/prs/ExerciseDetailDialog";

export const Route = createFileRoute("/prs")({ component: PRsPage });

const CATEGORY_ORDER: ExerciseCategory[] = [
  "fuerza",
  "olimpico",
  "benchmark_wod",
  "gimnastico",
  "cardio",
];

function PRsPage() {
  const { currentUser, tenantUsers } = useAuth();
  useDataVersion();

  const exercises = useMemo<Exercise[]>(
    () => exercisesRepo.list().sort((a, b) => a.name.localeCompare(b.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useDataVersion()],
  );

  const isStaff = currentUser?.role === "owner" || currentUser?.role === "coach";
  const members = useMemo(
    () => tenantUsers.filter((u) => u.role === "member" || u.id === currentUser?.id),
    [tenantUsers, currentUser],
  );
  const userMap = useMemo(() => new Map(tenantUsers.map((u) => [u.id, u])), [tenantUsers]);

  // Estado
  const [athleteId, setAthleteId] = useState<string>(currentUser?.id ?? "");
  const [openForm, setOpenForm] = useState(false);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  // Leaderboard
  const [lbExerciseId, setLbExerciseId] = useState<string>(exercises[0]?.id ?? "");
  const [rxFilter, setRxFilter] = useState<RxFilter>("all");
  const lbExercise = exercises.find((e) => e.id === lbExerciseId) ?? null;
  const leaderboard = useMemo(
    () => (lbExerciseId ? getLeaderboard(lbExerciseId, { rxFilter }) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lbExerciseId, rxFilter, useDataVersion()],
  );

  const effectiveUserId = isStaff ? athleteId || currentUser?.id || "" : currentUser?.id || "";
  const summaries = useMemo(
    () => (effectiveUserId ? getUserPRs(effectiveUserId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveUserId, useDataVersion()],
  );

  const grouped = useMemo(() => {
    const map = new Map<ExerciseCategory, typeof summaries>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const s of summaries) {
      map.get(s.exercise.category)?.push(s);
    }
    return map;
  }, [summaries]);

  if (!currentUser) {
    return (
      <AppLayout>
        <PageHeader title="PRs" description="Inicia sesión para ver tus marcas." />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="PRs & Benchmarks"
        description="Registra tus marcas, sigue tu progresión y compite con el resto del box."
      >
        <Button onClick={() => setOpenForm(true)}>
          <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} /> Registrar PR
        </Button>
      </PageHeader>

      <Tabs defaultValue="mis-prs" className="w-full">
        <TabsList>
          <TabsTrigger value="mis-prs">{isStaff ? "Marcas" : "Mis PRs"}</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="mis-prs" className="mt-6">
          {isStaff && (
            <div className="mb-6 flex items-center gap-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Atleta</span>
              <Select value={effectiveUserId} onValueChange={setAthleteId}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Elige atleta" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-8">
            {CATEGORY_ORDER.map((cat) => {
              const items = grouped.get(cat) ?? [];
              if (items.length === 0) return null;
              return (
                <section key={cat}>
                  <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                    {EXERCISE_CATEGORY_LABEL[cat]}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((it) => (
                      <PRCard
                        key={it.exercise.id}
                        exercise={it.exercise}
                        best={it.best}
                        total={it.total}
                        onClick={() => setDetailExercise(it.exercise)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Ejercicio</span>
              <Select value={lbExerciseId} onValueChange={setLbExerciseId}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Ejercicio" /></SelectTrigger>
                <SelectContent>
                  {exercises.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Tipo</span>
              <Select value={rxFilter} onValueChange={(v) => setRxFilter(v as RxFilter)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="rx">RX</SelectItem>
                  <SelectItem value="scaled">Scaled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {lbExercise && (
            <LeaderboardTable
              exercise={lbExercise}
              entries={leaderboard}
              userMap={userMap}
            />
          )}
        </TabsContent>
      </Tabs>

      <PRFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        userId={effectiveUserId}
        exercises={exercises}
      />

      <ExerciseDetailDialog
        open={!!detailExercise}
        onOpenChange={(v) => { if (!v) setDetailExercise(null); }}
        exercise={detailExercise}
        userId={effectiveUserId}
      />
    </AppLayout>
  );
}
