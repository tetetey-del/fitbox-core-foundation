import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDataVersion } from "@/lib/data-bus";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { bookingsRepo } from "@/lib/storage/repositories/bookings.repo";
import { toDateKey, formatDate } from "@/lib/date";
import { MembershipBadge } from "@/components/members/MembershipBadge";
import { CreditsBadge } from "@/components/members/CreditsBadge";
import {
  getActiveMembership,
  getMembershipStatus,
  getPlan,
} from "@/lib/services/membership.service";
import { getLastPRs } from "@/lib/services/prs.service";
import { formatPrValue } from "@/lib/format";
import { useModules } from "@/hooks/useModules";
import { getPublishedWodByDate } from "@/lib/services/wods.service";
import { WodViewer } from "@/components/wods/WodViewer";
import { getMyActiveChallenge, refreshChallenges } from "@/lib/services/challenges.service";
import { listMyAssignments, nextPendingSession } from "@/lib/services/programs.service";
import { useEffect } from "react";

interface Props {
  userId: string;
  membership: ReturnType<typeof getActiveMembership>;
  membershipStatus: ReturnType<typeof getMembershipStatus> | null;
  plan: ReturnType<typeof getPlan>;
}

/**
 * Panel principal del rol member: WOD del día, plan, últimos PRs y
 * reservas próximas del usuario.
 */
export function MemberDashboard({ userId, membership, membershipStatus, plan }: Props) {
  useDataVersion();
  const modules = useModules();
  const now = new Date();
  const upcoming = useMemo(() => {
    const nowKey = toDateKey(now);
    const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return bookingsRepo
      .query({ userId })
      .filter((b) => b.status === "confirmed" || b.status === "waitlist")
      .map((b) => ({ b, s: classSessionsRepo.getById(b.sessionId) }))
      .filter((x): x is { b: typeof x.b; s: NonNullable<typeof x.s> } => !!x.s && x.s.status !== "cancelled")
      .filter(({ s }) => s.date > nowKey || (s.date === nowKey && s.startTime >= nowTime))
      .sort((a, b) => (a.s.date + a.s.startTime).localeCompare(b.s.date + b.s.startTime))
      .slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const lastPRs = useMemo(() => (modules.prs ? getLastPRs(userId, 3) : []), [userId, modules.prs]);
  const todayWod = useMemo(
    () => (modules.reservas ? getPublishedWodByDate(toDateKey(new Date())) : null),
    [modules.reservas],
  );

  useEffect(() => {
    if (modules.challenges) refreshChallenges();
  }, [modules.challenges]);

  const myChallenge = modules.challenges ? getMyActiveChallenge(userId) : null;
  const myPrograms = modules.programs ? listMyAssignments(userId).filter((a) => a.assignment.status === "active") : [];
  const nextRoutine = myPrograms[0] ? { assignment: myPrograms[0].assignment, program: myPrograms[0].program, session: nextPendingSession(myPrograms[0].assignment.id) } : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-4">
        {todayWod && <WodViewer wod={todayWod} defaultOpen />}
        {myChallenge && (
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Mi reto activo</div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{myChallenge.challenge.badge}</span>
              <span className="font-medium">{myChallenge.challenge.title}</span>
            </div>
            {myChallenge.challenge.type === "attendance" && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progreso</span>
                  <span>{myChallenge.participant.progress} / {String(myChallenge.challenge.goal)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-[#14B8A6]"
                    style={{
                      width: `${Math.min(100, Math.round((myChallenge.participant.progress / Number(myChallenge.challenge.goal)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-2">
              <Link to="/retos">Ver retos <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} /></Link>
            </Button>
          </div>
        )}
        {nextRoutine && nextRoutine.session && (
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Rutina · siguiente sesión</div>
            <div className="font-medium">{nextRoutine.program.title}</div>
            <p className="text-sm text-muted-foreground">
              Semana {nextRoutine.session.weekNumber} · Día {nextRoutine.session.dayNumber} · {nextRoutine.session.title}
            </p>
            <Button asChild variant="ghost" size="sm" className="mt-2">
              <Link to="/rutinas">Ir a mis rutinas <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} /></Link>
            </Button>
          </div>
        )}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Mi membresía</div>
          {membership ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-medium">{plan?.name ?? "—"}</span>
                {membershipStatus && <MembershipBadge status={membershipStatus} />}
                <CreditsBadge userId={userId} />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Vigencia: {formatDate(membership.startDate)} → {formatDate(membership.endDate)}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sin plan activo.</p>
          )}
        </div>

        {modules.prs && (
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Últimos PRs</div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/prs">Ver todos <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} /></Link>
              </Button>
            </div>
            {lastPRs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no has registrado PRs.</p>
            ) : (
              <div className="space-y-2">
                {lastPRs.map(({ pr, exercise }) => (
                  <div key={pr.id} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{exercise.name}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(pr.date)}</div>
                    </div>
                    <div className="font-mono">{formatPrValue(pr.value, exercise.unit)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {modules.reservas && (
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Mis próximas reservas</h3>
            <Button asChild variant="ghost" size="sm">
              <Link to="/reservas">Reservar <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} /></Link>
            </Button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes reservas próximas.</p>
          ) : (
            <div className="divide-y divide-border">
              {upcoming.map(({ b, s }) => (
                <div key={b.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{formatDate(s.date)} · {s.startTime}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.status === "waitlist" ? `Lista de espera · #${b.position ?? "?"}` : "Confirmada"}
                    </div>
                  </div>
                  <Badge variant={b.status === "waitlist" ? "outline" : "default"} className="text-[10px]">
                    {b.status === "waitlist" ? "Espera" : "OK"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
