/**
 * @file Servicio de retos (challenges).
 * Progreso automático: retos de asistencia leen check-ins del periodo del reto;
 * retos benchmark leen PRs del ejercicio dentro del periodo (mejor marca).
 * Cierre automático al pasar endDate. Sin lógica en componentes.
 */
import type {
  Challenge,
  ChallengeParticipant,
  PersonalRecord,
  CheckIn,
} from "@/types";
import {
  challengeParticipantsRepo,
  challengesRepo,
} from "@/lib/storage/repositories/challenges.repo";
import { checkinsRepo } from "@/lib/storage/repositories/checkins.repo";
import { personalRecordsRepo } from "@/lib/storage/repositories/personalRecords.repo";
import { exercisesRepo } from "@/lib/storage/repositories/exercises.repo";
import { toDateKey } from "@/lib/date";
import { isBetter } from "@/lib/format";
import { notify } from "./notifications.service";

export interface ChallengeInput {
  tenantId: string;
  title: string;
  description: string;
  type: Challenge["type"];
  goal: number | string;
  startDate: string;
  endDate: string;
  badge: string;
  status?: Challenge["status"];
}

export function createChallenge(input: ChallengeInput): Challenge {
  return challengesRepo.create({
    tenantId: input.tenantId,
    title: input.title,
    description: input.description,
    type: input.type,
    goal: input.goal,
    startDate: input.startDate,
    endDate: input.endDate,
    badge: input.badge,
    status: input.status ?? "active",
  });
}

export function updateChallenge(id: string, patch: Partial<Challenge>) {
  return challengesRepo.update(id, patch);
}

export function deleteChallenge(id: string): void {
  challengesRepo.remove(id);
  challengeParticipantsRepo
    .query({ challengeId: id })
    .forEach((p) => challengeParticipantsRepo.remove(p.id));
}

export function joinChallenge(challengeId: string, userId: string): ChallengeParticipant | null {
  const ch = challengesRepo.getById(challengeId);
  if (!ch) return null;
  const existing = challengeParticipantsRepo
    .query({ challengeId, userId })[0];
  if (existing) return existing;
  return challengeParticipantsRepo.create({
    tenantId: ch.tenantId,
    challengeId,
    userId,
    progress: 0,
  });
}

export function leaveChallenge(challengeId: string, userId: string): void {
  challengeParticipantsRepo
    .query({ challengeId, userId })
    .forEach((p) => challengeParticipantsRepo.remove(p.id));
}

function computeParticipantProgress(
  ch: Challenge,
  userId: string,
  checkins: CheckIn[],
  prs: PersonalRecord[],
): { progress: number; completed: boolean } {
  if (ch.type === "attendance") {
    const target = Number(ch.goal) || 0;
    const count = checkins.filter(
      (c) =>
        c.userId === userId &&
        c.checkedInAt.slice(0, 10) >= ch.startDate &&
        c.checkedInAt.slice(0, 10) <= ch.endDate,
    ).length;
    return { progress: Math.min(count, target), completed: target > 0 && count >= target };
  }
  // benchmark: mejor marca dentro del periodo
  const exId = String(ch.goal);
  const ex = exercisesRepo.getById(exId);
  const userPRs = prs.filter(
    (pr) =>
      pr.userId === userId &&
      pr.exerciseId === exId &&
      pr.date >= ch.startDate &&
      pr.date <= ch.endDate,
  );
  if (!ex || userPRs.length === 0) return { progress: 0, completed: false };
  let best = userPRs[0];
  for (const pr of userPRs) if (isBetter(pr.value, best.value, ex.unit)) best = pr;
  return { progress: best.value, completed: true };
}

/** Recalcula progreso de todos los participantes y cierra retos vencidos. */
export function refreshChallenges(): void {
  const today = toDateKey(new Date());
  const allCheckins = checkinsRepo.list();
  const allPRs = personalRecordsRepo.list();
  for (const ch of challengesRepo.list()) {
    if (ch.status === "active" && ch.endDate < today) {
      challengesRepo.update(ch.id, { status: "finished" });
    }
    if (ch.status === "draft") continue;
    const participants = challengeParticipantsRepo.query({ challengeId: ch.id });
    for (const p of participants) {
      const { progress, completed } = computeParticipantProgress(ch, p.userId, allCheckins, allPRs);
      const patch: Partial<ChallengeParticipant> = { progress };
      if (completed && !p.completedAt) {
        patch.completedAt = new Date().toISOString();
        notify({
          tenantId: ch.tenantId,
          userId: p.userId,
          type: "challenge_completed",
          title: "¡Reto completado!",
          body: `Has completado "${ch.title}". ${ch.badge}`,
          linkTo: "/retos",
          dedupeKey: `challenge_done:${p.id}`,
        });
      }
      challengeParticipantsRepo.update(p.id, patch);
    }
  }
}

export interface ChallengeRankingEntry {
  userId: string;
  progress: number;
  completedAt?: string;
}

export function getChallengeRanking(challengeId: string): ChallengeRankingEntry[] {
  const ch = challengesRepo.getById(challengeId);
  if (!ch) return [];
  const parts = challengeParticipantsRepo.query({ challengeId });
  if (ch.type === "benchmark") {
    const ex = exercisesRepo.getById(String(ch.goal));
    if (!ex) return parts.map((p) => ({ userId: p.userId, progress: p.progress, completedAt: p.completedAt }));
    return parts
      .filter((p) => p.progress > 0)
      .map((p) => ({ userId: p.userId, progress: p.progress, completedAt: p.completedAt }))
      .sort((a, b) => (isBetter(a.progress, b.progress, ex.unit) ? -1 : 1));
  }
  return parts
    .map((p) => ({ userId: p.userId, progress: p.progress, completedAt: p.completedAt }))
    .sort((a, b) => b.progress - a.progress);
}

export function getUserBadges(userId: string): Array<{ challenge: Challenge; completedAt: string }> {
  const parts = challengeParticipantsRepo.query({ userId }).filter((p) => p.completedAt);
  return parts
    .map((p) => {
      const ch = challengesRepo.getById(p.challengeId);
      return ch ? { challenge: ch, completedAt: p.completedAt! } : null;
    })
    .filter((x): x is { challenge: Challenge; completedAt: string } => !!x)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export function getMyActiveChallenge(userId: string): { challenge: Challenge; participant: ChallengeParticipant } | null {
  const parts = challengeParticipantsRepo.query({ userId });
  for (const p of parts) {
    const ch = challengesRepo.getById(p.challengeId);
    if (ch && ch.status === "active") return { challenge: ch, participant: p };
  }
  return null;
}
