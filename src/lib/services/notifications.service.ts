import type { Notification, NotificationType } from "@/types";
import { notificationsRepo, notificationsRepoFor } from "@/lib/storage/repositories/notifications.repo";
import { listUsersOfTenant } from "@/lib/storage/repositories/users.repo";
import { membershipsRepo } from "@/lib/storage/repositories/memberships.repo";
import { daysBetween, parseDateKey } from "@/lib/date";
import { sessionStore } from "@/lib/storage/session";

export interface NotifyInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkTo?: string;
  dedupeKey?: string;
}

export function notify(input: NotifyInput): Notification | null {
  const repo = notificationsRepoFor(input.tenantId);
  if (input.dedupeKey) {
    const existing = repo.list().find(
      (n) => n.userId === input.userId && n.dedupeKey === input.dedupeKey,
    );
    if (existing) return existing;
  }
  return repo.create({
    tenantId: input.tenantId,
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    linkTo: input.linkTo,
    dedupeKey: input.dedupeKey,
    read: false,
  });
}

export function notifyManyUsers(
  tenantId: string,
  userIds: string[],
  type: NotificationType,
  title: string,
  body: string,
  linkTo?: string,
) {
  userIds.forEach((userId) =>
    notify({ tenantId, userId, type, title, body, linkTo }),
  );
}

export function listMyNotifications(): Notification[] {
  const s = sessionStore.read();
  if (!s) return [];
  return notificationsRepo
    .query({ userId: s.userId })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadCount(): number {
  const s = sessionStore.read();
  if (!s) return 0;
  return notificationsRepo.query({ userId: s.userId, read: false }).length;
}

export function markRead(id: string): void {
  notificationsRepo.update(id, { read: true });
}

export function markAllRead(): void {
  const s = sessionStore.read();
  if (!s) return;
  notificationsRepo
    .query({ userId: s.userId, read: false })
    .forEach((n) => notificationsRepo.update(n.id, { read: true }));
}

/**
 * Genera notificaciones de membresía próxima a expirar (7 días).
 * Idempotente por membershipId + endDate.
 */
export function scanExpiringMembershipsForTenant(tenantId: string): void {
  const users = listUsersOfTenant(tenantId);
  const today = new Date();
  users
    .filter((u) => u.role === "member")
    .forEach((u) => {
      const active = membershipsRepo
        .query({ userId: u.id })
        .find((m) => m.status === "active");
      if (!active) return;
      const days = daysBetween(today, parseDateKey(active.endDate));
      if (days < 0 || days > 7) return;
      notify({
        tenantId,
        userId: u.id,
        type: "membership_expiring",
        title: "Tu plan expira pronto",
        body:
          days === 0
            ? "Tu plan caduca hoy. Habla con el box para renovarlo."
            : `Tu plan caduca en ${days} día${days === 1 ? "" : "s"}.`,
        linkTo: "/dashboard",
        dedupeKey: `expiring:${active.id}:${active.endDate}`,
      });
    });
}

export function relativeTime(iso: string): string {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - d);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}
