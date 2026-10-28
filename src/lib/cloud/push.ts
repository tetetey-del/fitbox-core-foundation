/**
 * @file Notificaciones push al celular (boxes reales).
 * El socio acepta una vez; su suscripción se guarda en public.push_subscriptions y el servidor
 * (función kf-push) le manda los avisos importantes aunque la app esté cerrada.
 * En iPhone solo funciona con Kinflow agregado a la pantalla de inicio (iOS 16.4 o más).
 */
import { sb } from "./client";
import { getCloudContext } from "./sync";

export type PushState = "unsupported" | "ios-needs-install" | "denied" | "off" | "on";

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

/** Registra el service worker al abrir la app (no hace nada si el navegador no lo soporta). */
export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
}

export async function getPushState(): Promise<PushState> {
  if (typeof window === "undefined") return "unsupported";
  if (isIOS() && !isStandalone()) return "ios-needs-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "on" : "off";
}

/** Pide permiso y guarda la suscripción. Hay que llamarla desde un toque del usuario. */
export async function enablePush(): Promise<PushState> {
  const ctx = getCloudContext();
  if (!ctx) return "unsupported";
  const state = await getPushState();
  if (state === "unsupported" || state === "ios-needs-install" || state === "denied") return state;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  const { data: key, error } = await sb().rpc("kf_vapid_public_key");
  if (error || !key) throw new Error("No se pudo activar");
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key as string) }));
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const { data: who } = await sb().auth.getUser();
  if (!who.user) throw new Error("Sin sesión");
  const { error: e2 } = await sb().from("push_subscriptions").upsert({
    endpoint: json.endpoint,
    user_id: who.user.id,
    tenant_id: ctx.tenantId,
    app_user_id: ctx.appUserId,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  });
  if (e2) throw new Error("No se pudo guardar");
  return "on";
}

export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await sb().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}
