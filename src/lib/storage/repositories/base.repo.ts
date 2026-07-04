/**
 * @file Repositorio base sobre localStorage con scoping opcional por tenant.
 *
 * Todos los repos concretos (`bookings`, `payments`, …) heredan de aquí.
 * La capa UI **nunca** debe leer/escribir localStorage directamente; siempre
 * pasa por un repo o un servicio.
 *
 * Modelo:
 * - `scoped: true` → clave `fitbox:<tenantId>:<collection>`. El tenantId lo
 *   resuelve dinámicamente `getTenantId()` (típicamente `sessionStore.read()`).
 *   Si no hay tenant activo, se usa la clave inerte `fitbox:_none:<collection>`
 *   para que los reads devuelvan `[]` y los writes nunca contaminen datos de
 *   otro tenant.
 * - `scoped: false` → clave `fitbox:_global:<collection>`. Usado por tenants
 *   y superadmins.
 *
 * `create()` genera `id`, `createdAt` y `updatedAt`; `update()` refresca
 * `updatedAt`. `list()` devuelve los elementos en el orden en el que fueron
 * insertados (los repos que necesiten un orden distinto lo aplican encima).
 */
import type { BaseEntity } from "@/types";
import { buildKey, get, newId, nowIso, set } from "../db";

export type Filter<T> = Partial<T> | ((item: T) => boolean);

export interface RepoOptions {
  /**
   * When true, records are scoped under the active tenantId provided by the
   * getter. When false, records are global (used for tenants themselves).
   */
  scoped: boolean;
  getTenantId?: () => string | null;
}

export class BaseRepo<T extends BaseEntity> {
  constructor(
    protected collection: string,
    protected options: RepoOptions,
  ) {}


  protected key(): string {
    const tenantId = this.options.scoped ? (this.options.getTenantId?.() ?? null) : null;
    if (this.options.scoped && !tenantId) {
      // No tenant scope yet — return an isolated key so reads return [] and
      // writes never bleed across tenants.
      return buildKey("_none", this.collection);
    }
    return buildKey(tenantId, this.collection);
  }

  list(): T[] {
    return get<T[]>(this.key(), []);
  }

  getById(id: string): T | null {
    return this.list().find((r) => r.id === id) ?? null;
  }

  query(filter: Filter<T>): T[] {
    const items = this.list();
    if (typeof filter === "function") return items.filter(filter);
    return items.filter((item) =>
      Object.entries(filter).every(([k, v]) => (item as Record<string, unknown>)[k] === v),
    );
  }

  create(data: Omit<T, "id" | "createdAt" | "updatedAt">): T {
    const now = nowIso();
    const entity = { ...data, id: newId(), createdAt: now, updatedAt: now } as T;
    const items = this.list();
    items.push(entity);
    set(this.key(), items);
    return entity;
  }

  update(id: string, patch: Partial<Omit<T, "id" | "createdAt">>): T | null {
    const items = this.list();
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const updated = { ...items[idx], ...patch, updatedAt: nowIso() } as T;
    items[idx] = updated;
    set(this.key(), items);
    return updated;
  }

  remove(id: string): boolean {
    const items = this.list();
    const next = items.filter((r) => r.id !== id);
    if (next.length === items.length) return false;
    set(this.key(), next);
    return true;
  }

  replaceAll(items: T[]): void {
    set(this.key(), items);
  }
}
