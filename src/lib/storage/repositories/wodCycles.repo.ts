/**
 * @file Ciclos de programación (WODs que se repiten cada N semanas). Solo staff.
 */
import type { WodCycle } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const wodCyclesRepo = new BaseRepo<WodCycle>("wod_cycles", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});
