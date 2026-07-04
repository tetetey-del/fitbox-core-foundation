/**
 * @file Pedidos de la tienda (pago y recogida en el box).
 * Scoped por tenant.
 */
import type { Order } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

const getTid = () => sessionStore.read()?.tenantId ?? null;

export const ordersRepo = new BaseRepo<Order>("orders", {
  scoped: true,
  getTenantId: getTid,
});
export function ordersRepoFor(tenantId: string) {
  return new BaseRepo<Order>("orders", { scoped: true, getTenantId: () => tenantId });
}
