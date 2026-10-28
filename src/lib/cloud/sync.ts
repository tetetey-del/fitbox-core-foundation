/**
 * @file Sincronización entre el navegador y Supabase para los boxes reales.
 *
 * La app sigue leyendo y escribiendo con los repositorios de siempre (localStorage),
 * que funcionan como copia local. Para el box activo en la nube:
 * - cada escritura se compara con la versión anterior y los cambios se suben a
 *   `public.records` (o `public.tenants` para los datos del box);
 * - `pullTenant()` baja lo que la persona puede ver según su rol (RLS) y reemplaza
 *   la copia local.
 * La demo no pasa por aquí: vive solo en el navegador.
 */
import type { UserRole } from "@/types";
import { buildKey, isBrowser, setRaw, setWriteHook } from "@/lib/storage/db";
import { notifyDataChanged } from "@/lib/data-bus";
import { sb } from "./client";

interface CloudContext {
  tenantId: string;
  role: UserRole;
  appUserId: string;
  /** Cuenta de Supabase Auth con la que se entró (para detectar cambios de cuenta). */
  authUserId?: string;
}

let ctx: CloudContext | null = null;

/** Colecciones que nunca se suben (solo tienen sentido en el navegador). */
const LOCAL_ONLY = new Set(["password_resets", "session", "demo_version"]);
const TENANTS_KEY = buildKey(null, "tenants");
const PAGE = 1000;

type Row = { id: string } & Record<string, unknown>;
type Op = { kind: "upsert"; collection: string; id: string; data: Row } | { kind: "delete"; collection: string; id: string };

const queue = new Map<string, Op>();
let tenantPatch: Record<string, unknown> | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<void> | null = null;

// ---------- Eventos (errores y datos nuevos) ----------

type SyncListener = (e: { type: "pulled" } | { type: "error"; message: string }) => void;
const listeners = new Set<SyncListener>();
export function onCloudSync(fn: SyncListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(e: Parameters<SyncListener>[0]) {
  listeners.forEach((l) => l(e));
}

// ---------- Contexto activo ----------

export function getCloudContext(): CloudContext | null {
  return ctx;
}

export function setCloudContext(next: CloudContext | null): void {
  ctx = next;
  setWriteHook(next ? onWrite : null);
}

// ---------- Subida de cambios ----------

function diffArrays(prev: unknown, next: unknown): { upserts: Row[]; deletes: string[] } {
  const prevArr = Array.isArray(prev) ? (prev as Row[]) : [];
  const nextArr = Array.isArray(next) ? (next as Row[]) : [];
  const before = new Map(prevArr.filter((r) => r && r.id).map((r) => [r.id, JSON.stringify(r)]));
  const upserts: Row[] = [];
  const seen = new Set<string>();
  for (const r of nextArr) {
    if (!r || !r.id) continue;
    seen.add(r.id);
    if (before.get(r.id) !== JSON.stringify(r)) upserts.push(r);
  }
  const deletes = [...before.keys()].filter((id) => !seen.has(id));
  return { upserts, deletes };
}

function onWrite(key: string, prev: unknown, next: unknown): void {
  if (!ctx) return;
  if (key === TENANTS_KEY) {
    if (ctx.role !== "admin") return; // solo el admin puede cambiar los datos del box
    const find = (list: unknown) => (Array.isArray(list) ? (list as Row[]).find((t) => t.id === ctx!.tenantId) : undefined);
    const a = find(prev);
    const b = find(next);
    if (b && JSON.stringify(a) !== JSON.stringify(b)) {
      tenantPatch = b;
      schedule();
    }
    return;
  }
  const prefix = `fitbox:${ctx.tenantId}:`;
  if (!key.startsWith(prefix)) return;
  const collection = key.slice(prefix.length);
  if (LOCAL_ONLY.has(collection)) return;
  let { upserts, deletes } = diffArrays(prev, next);
  if (ctx.role === "member") {
    // Mismas reglas que la base (RLS): lo que la base rechazaría no se sube.
    const before = new Map((Array.isArray(prev) ? (prev as Row[]) : []).map((r) => [r.id, r]));
    upserts = upserts.filter((r) => memberMayWrite(collection, r, before.has(r.id)));
    deletes = deletes.filter((id) => MEMBER_DELETABLE.has(collection) && isOwn(collection, before.get(id)));
  }
  for (const data of upserts) {
    const clean = collection === "users" ? (({ passwordHash: _p, ...rest }) => rest)(data as Row & { passwordHash?: string }) : data;
    queue.set(`${collection}:${data.id}`, { kind: "upsert", collection, id: data.id, data: clean as Row });
  }
  for (const id of deletes) queue.set(`${collection}:${id}`, { kind: "delete", collection, id });
  if (upserts.length || deletes.length) schedule();
}

// ---------- Qué puede escribir un socio (espejo de las políticas RLS) ----------

const MEMBER_WRITABLE = new Set([
  "users", "personal_records", "body_metrics", "orders", "notifications",
  "program_assignments", "program_progress", "challenge_participants",
]);
const MEMBER_DELETABLE = new Set(["personal_records", "body_metrics", "program_progress"]);

function readLocal(collection: string): Row[] {
  if (!ctx || !isBrowser()) return [];
  try {
    return JSON.parse(window.localStorage.getItem(buildKey(ctx.tenantId, collection)) ?? "[]") as Row[];
  } catch {
    return [];
  }
}

function isOwn(collection: string, row: Row | undefined): boolean {
  if (!ctx || !row) return false;
  if (collection === "users") return row.id === ctx.appUserId;
  if (collection === "program_progress") {
    const a = readLocal("program_assignments").find((x) => x.id === row.assignmentId);
    return !!a && a.userId === ctx.appUserId;
  }
  return row.userId === ctx.appUserId;
}

function memberMayWrite(collection: string, row: Row, existed: boolean): boolean {
  if (!MEMBER_WRITABLE.has(collection) || !isOwn(collection, row)) return false;
  if (collection === "orders" && existed) return false; // los pedidos solo los cambia el staff
  return true;
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void flush(), 350);
}

/** Sube a Supabase todo lo pendiente. */
export async function flush(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (flushing) await flushing;
  if (!ctx || (!queue.size && !tenantPatch)) return;
  const tenantId = ctx.tenantId;
  const ops = [...queue.values()];
  queue.clear();
  const patch = tenantPatch;
  tenantPatch = null;

  flushing = (async () => {
    const client = sb();
    let failed = false;
    if (patch) {
      const { error } = await client.from("tenants").update({ data: patch }).eq("id", tenantId);
      if (error) failed = true;
    }
    const upserts = ops.filter((o): o is Extract<Op, { kind: "upsert" }> => o.kind === "upsert");
    for (let i = 0; i < upserts.length; i += 500) {
      const chunk = upserts.slice(i, i + 500).map((o) => ({ tenant_id: tenantId, collection: o.collection, id: o.id, data: o.data }));
      const { error } = await client.from("records").upsert(chunk, { onConflict: "tenant_id,collection,id" });
      if (error) {
        // Si falla el lote (por ejemplo, un registro sin permiso), se reintenta uno por uno
        // para que el resto se guarde igual.
        for (const row of chunk) {
          const { error: e2 } = await client.from("records").upsert(row, { onConflict: "tenant_id,collection,id" });
          if (e2) failed = true;
        }
      }
    }
    const deletes = ops.filter((o) => o.kind === "delete");
    const byCollection = new Map<string, string[]>();
    deletes.forEach((o) => byCollection.set(o.collection, [...(byCollection.get(o.collection) ?? []), o.id]));
    for (const [collection, ids] of byCollection) {
      const { error } = await client.from("records").delete().eq("tenant_id", tenantId).eq("collection", collection).in("id", ids);
      if (error) failed = true;
    }
    if (failed) {
      emit({ type: "error", message: "Algunos cambios no se pudieron guardar. Revisa tu conexión e inténtalo de nuevo." });
      // Volver a la versión real del servidor para no mostrar datos que no se guardaron.
      await pullTenant();
    }
  })();
  try {
    await flushing;
  } finally {
    flushing = null;
  }
}

// ---------- Bajada de datos ----------

// Momento del último dato bajado por box (para pedir solo lo que cambió después).
const lastSync = new Map<string, string>();
let lastFullAt = 0;
/** Cada cuánto se hace igual una bajada completa (por si algo se perdió). */
const FULL_EVERY_MS = 15 * 60_000;
/** Margen para no perder cambios que se guardaron mientras se bajaba. */
const OVERLAP_MS = 30_000;

type PulledRow = { collection: string; id: string; data: Row; updated_at: string };

async function fetchRows(tenantId: string, since: string | null): Promise<PulledRow[]> {
  const client = sb();
  const rows: PulledRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client.rpc("kf_pull", { t: tenantId, since }).range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as PulledRow[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

function newestOf(rows: PulledRow[], fallback: string | undefined): string | undefined {
  let max = fallback;
  for (const r of rows) if (!max || r.updated_at > max) max = r.updated_at;
  return max;
}

function readLocalFor(tenantId: string, collection: string): Row[] {
  try {
    return JSON.parse(window.localStorage.getItem(buildKey(tenantId, collection)) ?? "[]") as Row[];
  } catch {
    return [];
  }
}

async function pullTenantRow(tenantId: string): Promise<void> {
  const { data: tenantRow, error } = await sb().from("tenants").select("id,data").eq("id", tenantId).maybeSingle();
  if (error) throw error;
  if (!tenantRow) return;
  const tenant = { ...(tenantRow.data as Row), id: tenantRow.id as string };
  let list: Row[] = [];
  try {
    list = JSON.parse(window.localStorage.getItem(TENANTS_KEY) ?? "[]");
  } catch {
    list = [];
  }
  const idx = list.findIndex((t) => t.id === tenant.id);
  if (idx === -1) list.push(tenant);
  else if (JSON.stringify(list[idx]) === JSON.stringify(tenant)) return;
  else list[idx] = tenant;
  setRaw(TENANTS_KEY, list);
}

/**
 * Bajada completa: lo que esta persona puede ver (RLS), sin lo viejo (clases, reservas y
 * WODs de hace más de 2 meses para socios, 6 para el staff). Reemplaza la copia local.
 */
export async function pullTenant(): Promise<void> {
  if (!ctx || !isBrowser()) return;
  const { tenantId, role, appUserId } = ctx;
  const client = sb();
  const startedAt = new Date(Date.now() - OVERLAP_MS).toISOString();

  await pullTenantRow(tenantId);
  const rows = await fetchRows(tenantId, null);
  if (!ctx || ctx.tenantId !== tenantId) return; // cambió la sesión mientras bajaba

  const byCollection = new Map<string, Row[]>();
  for (const r of rows) {
    const item = { ...r.data, id: r.id } as Row;
    const list = byCollection.get(r.collection);
    if (list) list.push(item);
    else byCollection.set(r.collection, [item]);
  }

  // Los socios no ven las fichas completas de los demás: solo nombre, foto y rol.
  if (role === "member") {
    const { data: dir } = await client.rpc("kf_directory", { t: tenantId });
    const own = (byCollection.get("users") ?? []).filter((u) => u.id === appUserId);
    const others = ((dir ?? []) as Row[]).filter((u) => u.id !== appUserId);
    byCollection.set("users", [...own, ...others]);
  }

  // Reemplazar la copia local: colecciones que ya no tienen datos quedan vacías.
  const prefix = `fitbox:${tenantId}:`;
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k || !k.startsWith(prefix)) continue;
    const c = k.slice(prefix.length);
    if (!LOCAL_ONLY.has(c) && !byCollection.has(c)) byCollection.set(c, []);
  }
  for (const [collection, items] of byCollection) {
    items.sort((a, b) => String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")));
    setRaw(buildKey(tenantId, collection), items);
  }

  const newest = newestOf(rows, undefined);
  lastSync.set(tenantId, newest && newest < startedAt ? newest : startedAt);
  lastFullAt = Date.now();
  notifyDataChanged();
  emit({ type: "pulled" });
}

/**
 * Bajada liviana: solo lo que cambió (y lo que se borró) desde la última vez.
 * Si nunca se bajó todo, o pasó mucho tiempo, hace una bajada completa.
 */
export async function pullChanges(): Promise<void> {
  if (!ctx || !isBrowser()) return;
  const { tenantId } = ctx;
  const since = lastSync.get(tenantId);
  if (!since || Date.now() - lastFullAt > FULL_EVERY_MS) return pullTenant();

  const sinceWithOverlap = new Date(new Date(since).getTime() - OVERLAP_MS).toISOString();
  const [rows, deleted] = await Promise.all([
    fetchRows(tenantId, sinceWithOverlap),
    sb()
      .from("deleted_records")
      .select("collection,id,deleted_at")
      .eq("tenant_id", tenantId)
      .gt("deleted_at", sinceWithOverlap)
      .then(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as { collection: string; id: string; deleted_at: string }[];
      }),
    pullTenantRow(tenantId),
  ]);
  if (!ctx || ctx.tenantId !== tenantId) return;

  const changed = new Map<string, { upserts: Map<string, Row>; deletes: Set<string> }>();
  const entry = (c: string) => {
    let e = changed.get(c);
    if (!e) changed.set(c, (e = { upserts: new Map(), deletes: new Set() }));
    return e;
  };
  for (const r of rows) entry(r.collection).upserts.set(r.id, { ...r.data, id: r.id } as Row);
  for (const d of deleted) {
    // Si se borró y se volvió a crear con el mismo id, gana el dato nuevo.
    if (!entry(d.collection).upserts.has(d.id)) entry(d.collection).deletes.add(d.id);
  }

  let touched = false;
  for (const [collection, { upserts, deletes }] of changed) {
    if (LOCAL_ONLY.has(collection)) continue;
    // Los socios reciben la lista de personas por kf_directory (en la bajada completa).
    if (collection === "users" && ctx.role === "member") {
      for (const id of [...upserts.keys()]) if (id !== ctx.appUserId) upserts.delete(id);
    }
    const local = readLocalFor(tenantId, collection);
    let dirty = false;
    const next: Row[] = [];
    for (const row of local) {
      if (deletes.has(row.id)) {
        dirty = true;
        continue;
      }
      const up = upserts.get(row.id);
      if (up) {
        upserts.delete(row.id);
        if (JSON.stringify(up) !== JSON.stringify(row)) dirty = true;
        next.push(up);
      } else next.push(row);
    }
    for (const up of upserts.values()) {
      next.push(up);
      dirty = true;
    }
    if (dirty) {
      setRaw(buildKey(tenantId, collection), next);
      touched = true;
    }
  }

  lastSync.set(tenantId, newestOf(rows, since) ?? since);
  if (touched) notifyDataChanged();
  emit({ type: "pulled" });
}

/** Borra la copia local de un box de la nube (al cerrar sesión, por privacidad). */
export function clearLocalTenant(tenantId: string): void {
  if (!isBrowser()) return;
  const prefix = `fitbox:${tenantId}:`;
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(prefix)) keys.push(k);
  }
  keys.forEach((k) => window.localStorage.removeItem(k));
  try {
    const list = JSON.parse(window.localStorage.getItem(TENANTS_KEY) ?? "[]") as Row[];
    setRaw(TENANTS_KEY, list.filter((t) => t.id !== tenantId));
  } catch {
    /* nada */
  }
}

// ---------- Actualización periódica ----------

let poll: ReturnType<typeof setInterval> | null = null;
function onVisible() {
  if (document.visibilityState === "visible") void flush().then(() => pullChanges()).catch(() => {});
}

/** Mientras la app está abierta, trae los cambios de otras personas cada 30 segundos y al volver a la pestaña. */
export function startCloudRefresh(): void {
  stopCloudRefresh();
  if (!isBrowser()) return;
  poll = setInterval(() => {
    if (document.visibilityState === "visible") void flush().then(() => pullChanges()).catch(() => {});
  }, 30_000);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("beforeunload", () => void flush());
}

export function stopCloudRefresh(): void {
  if (poll) clearInterval(poll);
  poll = null;
  if (isBrowser()) document.removeEventListener("visibilitychange", onVisible);
}
