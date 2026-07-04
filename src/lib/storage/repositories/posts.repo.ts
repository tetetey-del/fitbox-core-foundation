/**
 * @file Publicaciones del feed interno (avisos, WODs, recetas, tips).
 *
 * Scoped por tenant. Imágenes en base64; el tamaño se limita al subir (ver `lib/image.ts`).
 */
import type { Post } from "@/types";
import { sessionStore } from "../session";
import { BaseRepo } from "./base.repo";

export const postsRepo = new BaseRepo<Post>("posts", {
  scoped: true,
  getTenantId: () => sessionStore.read()?.tenantId ?? null,
});

export function postsRepoFor(tenantId: string) {
  return new BaseRepo<Post>("posts", {
    scoped: true,
    getTenantId: () => tenantId,
  });
}
