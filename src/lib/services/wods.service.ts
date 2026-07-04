/**
 * @file Servicio de WODs (workout of the day).
 * Responsabilidad: publicar/editar el WOD de una fecha y, al publicar,
 * crear un post en el feed y notificar a los socios (efectos idempotentes).
 */
import type { Wod, WodBlock } from "@/types";
import { WOD_BLOCK_LABEL } from "@/types";
import { wodsRepo, wodsRepoFor } from "@/lib/storage/repositories/wods.repo";
import { postsRepo, postsRepoFor } from "@/lib/storage/repositories/posts.repo";
import { listUsersOfTenant } from "@/lib/storage/repositories/users.repo";
import { sessionStore } from "@/lib/storage/session";
import { notifyManyUsers } from "./notifications.service";
import { formatDate } from "@/lib/date";

export function getWodByDate(date: string): Wod | null {
  return wodsRepo.list().find((w) => w.date === date) ?? null;
}

export function getPublishedWodByDate(date: string): Wod | null {
  const w = getWodByDate(date);
  return w && w.published ? w : null;
}

function summarize(blocks: WodBlock[]): string {
  return blocks
    .filter((b) => b.content.trim())
    .map((b) => `**${WOD_BLOCK_LABEL[b.type]}**\n${b.content.trim()}`)
    .join("\n\n");
}

export interface SaveWodInput {
  date: string;
  title: string;
  blocks: WodBlock[];
  publish: boolean;
}

export function saveWod(input: SaveWodInput): Wod {
  const s = sessionStore.read();
  if (!s) throw new Error("Sin sesión");
  const existing = getWodByDate(input.date);
  const payload = {
    tenantId: s.tenantId,
    date: input.date,
    title: input.title.trim() || `WOD ${formatDate(input.date)}`,
    blocks: input.blocks,
    published: input.publish,
    publishedBy: input.publish ? s.userId : existing?.publishedBy,
  };
  let saved: Wod;
  if (existing) {
    saved = wodsRepo.update(existing.id, payload) as Wod;
  } else {
    saved = wodsRepo.create(payload);
  }
  if (input.publish) publishWodSideEffects(saved);
  return saved;
}

function publishWodSideEffects(wod: Wod) {
  // Crear post de feed (si no existe ya para ese WOD)
  const existingPost = postsRepo
    .list()
    .find((p) => p.type === "wod" && p.title === `WOD ${formatDate(wod.date)} · ${wod.title}`);
  if (!existingPost) {
    postsRepo.create({
      tenantId: wod.tenantId,
      authorId: wod.publishedBy ?? "",
      type: "wod",
      title: `WOD ${formatDate(wod.date)} · ${wod.title}`,
      content: summarize(wod.blocks),
      pinned: false,
    });
  }
  // Notificar a los socios
  const users = listUsersOfTenant(wod.tenantId).filter((u) => u.role === "member");
  notifyManyUsers(
    wod.tenantId,
    users.map((u) => u.id),
    "new_post",
    "Nuevo WOD publicado",
    `${wod.title} · ${formatDate(wod.date)}`,
    "/feed",
  );
}

// Variante server-side (usada por seed) que no depende de sessionStore
export function seedWod(
  tenantId: string,
  publisherId: string,
  input: SaveWodInput,
): Wod {
  const repo = wodsRepoFor(tenantId);
  const payload = {
    tenantId,
    date: input.date,
    title: input.title,
    blocks: input.blocks,
    published: input.publish,
    publishedBy: publisherId,
  };
  const wod = repo.create(payload);
  if (input.publish) {
    const posts = postsRepoFor(tenantId);
    posts.create({
      tenantId,
      authorId: publisherId,
      type: "wod",
      title: `WOD ${formatDate(wod.date)} · ${wod.title}`,
      content: summarize(wod.blocks),
      pinned: false,
    });
  }
  return wod;
}
