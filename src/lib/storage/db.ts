/**
 * Low-level typed wrapper over localStorage.
 * Never use directly from UI components — go through a repository.
 */

const ROOT = "fitbox";

export const isBrowser = () => typeof window !== "undefined" && !!window.localStorage;

export function buildKey(tenantId: string | null, collection: string): string {
  return `${ROOT}:${tenantId ?? "_global"}:${collection}`;
}

export function get<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[db] error leyendo ${key}`, err);
    return fallback;
  }
}

export function set<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[db] error escribiendo ${key}`, err);
  }
}

export function remove(key: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
}

export function clearAll(): void {
  if (!isBrowser()) return;
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(`${ROOT}:`)) keys.push(k);
  }
  keys.forEach((k) => window.localStorage.removeItem(k));
}

export function newId(): string {
  if (isBrowser() && "randomUUID" in crypto) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
