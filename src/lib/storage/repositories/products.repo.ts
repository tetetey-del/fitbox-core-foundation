/**
 * @file Catálogo de la tienda del box.
 * Scoped por tenant.
 */
import type { Product } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

const getTid = () => sessionStore.read()?.tenantId ?? null;

export const productsRepo = new BaseRepo<Product>("products", {
  scoped: true,
  getTenantId: getTid,
});
export function productsRepoFor(tenantId: string) {
  return new BaseRepo<Product>("products", { scoped: true, getTenantId: () => tenantId });
}
