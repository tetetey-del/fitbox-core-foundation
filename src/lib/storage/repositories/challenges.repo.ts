/**
 * @file Retos del box (asistencia o benchmark).
 * Scoped por tenant.
 */
import type { Challenge, ChallengeParticipant } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

const getTid = () => sessionStore.read()?.tenantId ?? null;

export const challengesRepo = new BaseRepo<Challenge>("challenges", {
  scoped: true,
  getTenantId: getTid,
});
export function challengesRepoFor(tenantId: string) {
  return new BaseRepo<Challenge>("challenges", { scoped: true, getTenantId: () => tenantId });
}

export const challengeParticipantsRepo = new BaseRepo<ChallengeParticipant>(
  "challenge_participants",
  { scoped: true, getTenantId: getTid },
);
export function challengeParticipantsRepoFor(tenantId: string) {
  return new BaseRepo<ChallengeParticipant>("challenge_participants", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
