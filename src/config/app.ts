/**
 * Dirección pública de Kinflow. Los links que se comparten (el del box, las
 * invitaciones) salen siempre con esta dirección, aunque se copien desde
 * kinflowapp.vercel.app. En desarrollo y en las vistas previas se usa la dirección actual.
 */
export const APP_URL: string = (import.meta.env.VITE_APP_URL as string | undefined) ?? "https://kinflow.es";

const PRODUCTION_HOSTS = new Set(["kinflow.es", "www.kinflow.es", "kinflowapp.vercel.app"]);

/** Origen para links que se comparten fuera de la app. */
export function publicOrigin(): string {
  if (typeof window === "undefined") return APP_URL;
  return PRODUCTION_HOSTS.has(window.location.hostname) ? APP_URL : window.location.origin;
}
