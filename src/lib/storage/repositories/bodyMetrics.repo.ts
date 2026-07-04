/**
 * @file Mediciones corporales del socio (peso, % graso, FC reposo, etc.).
 * Scoped por tenant.
 */
import type { BodyMetric } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

const getTid = () => sessionStore.read()?.tenantId ?? null;

export const bodyMetricsRepo = new BaseRepo<BodyMetric>("body_metrics", {
  scoped: true,
  getTenantId: getTid,
});
export function bodyMetricsRepoFor(tenantId: string) {
  return new BaseRepo<BodyMetric>("body_metrics", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
