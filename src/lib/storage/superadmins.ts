import type { SuperAdmin, SuperSession } from "@/types";
import { buildKey, get, newId, nowIso, remove, set } from "./db";

const SUPERADMINS_KEY = buildKey(null, "superadmins");
const SUPER_SESSION_KEY = buildKey(null, "super_session");

export const superAdminsStore = {
  list(): SuperAdmin[] {
    return get<SuperAdmin[]>(SUPERADMINS_KEY, []);
  },
  create(data: Omit<SuperAdmin, "id" | "createdAt">): SuperAdmin {
    const items = this.list();
    const entity: SuperAdmin = {
      ...data,
      id: newId(),
      createdAt: nowIso(),
    };
    items.push(entity);
    set(SUPERADMINS_KEY, items);
    return entity;
  },
  getById(id: string): SuperAdmin | null {
    return this.list().find((s) => s.id === id) ?? null;
  },
  replaceAll(list: SuperAdmin[]) {
    set(SUPERADMINS_KEY, list);
  },
};

export const superSessionStore = {
  read(): SuperSession | null {
    return get<SuperSession | null>(SUPER_SESSION_KEY, null);
  },
  write(s: SuperSession) {
    set(SUPER_SESSION_KEY, s);
  },
  clear() {
    remove(SUPER_SESSION_KEY);
  },
};
