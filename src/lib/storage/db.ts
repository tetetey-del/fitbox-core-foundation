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

/**
 * Gancho de escritura: lo usa la sincronización con Supabase (src/lib/cloud/sync.ts)
 * para enterarse de cada cambio en los datos de un box real.
 */
type WriteHook = (key: string, prev: unknown, next: unknown) => void;
let writeHook: WriteHook | null = null;
export function setWriteHook(fn: WriteHook | null): void {
  writeHook = fn;
}

export function set<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    const prev = writeHook ? window.localStorage.getItem(key) : null;
    window.localStorage.setItem(key, JSON.stringify(value));
    if (writeHook) writeHook(key, prev === null ? null : JSON.parse(prev), value);
  } catch (err) {
    console.error(`[db] error escribiendo ${key}`, err);
  }
}

/** Escribe sin avisar al gancho (para cargar datos que vienen de Supabase). */
export function setRaw<T>(key: string, value: T): void {
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
