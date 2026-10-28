/**
 * @file Marca de cada box en la app instalada (marca blanca).
 *
 * Cada box tiene su link (`/b/<slug>`). Quien entra por ahí, por una invitación o con su
 * sesión, ve la app con el nombre y el ícono de su box: al agregarla a la pantalla de inicio
 * queda con su logo, y las notificaciones salen con su nombre.
 * - iPhone usa `apple-touch-icon` y `apple-mobile-web-app-title` (se cambian acá).
 * - Android usa el manifest, que arma la función de Supabase `kf-manifest` para cada box.
 */
import { SUPABASE_URL } from "@/config/supabase";

export interface BoxBrand {
  slug: string;
  name: string;
  brandColor?: string;
  /** URLs públicas de los íconos generados a partir del logo: "180", "192" y "512". */
  appIcon?: Record<string, string>;
}

const KEY = "kinflow:box";

export function readBoxBrand(): BoxBrand | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BoxBrand) : null;
  } catch {
    return null;
  }
}

export function saveBoxBrand(brand: BoxBrand | null): void {
  try {
    if (brand) localStorage.setItem(KEY, JSON.stringify(brand));
    else localStorage.removeItem(KEY);
  } catch {
    /* nada */
  }
  applyBoxBrand(brand);
}

function setLink(rel: string, href: string, extra?: Record<string, string>) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  if (extra) Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
}

function setMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

/** Pone en la página el nombre y el ícono del box (o los de Kinflow si no hay box). */
export function applyBoxBrand(brand: BoxBrand | null): void {
  if (typeof document === "undefined") return;
  if (!brand) {
    setLink("manifest", "/manifest.webmanifest");
    setLink("apple-touch-icon", "/apple-touch-icon.png");
    setMeta("apple-mobile-web-app-title", "Kinflow");
    return;
  }
  const manifest = `${SUPABASE_URL}/functions/v1/kf-manifest?box=${encodeURIComponent(brand.slug)}&o=${encodeURIComponent(window.location.origin)}`;
  setLink("manifest", manifest, { crossorigin: "anonymous" });
  setLink("apple-touch-icon", brand.appIcon?.["180"] ?? "/apple-touch-icon.png");
  setMeta("apple-mobile-web-app-title", brand.name);
}

/** Link que el box comparte con sus socios. */
export function boxLink(slug: string): string {
  const origin = typeof window === "undefined" ? "https://kinflowapp.vercel.app" : window.location.origin;
  return `${origin}/b/${slug}`;
}

/** Dirección válida: minúsculas, números y guiones (3 a 40 caracteres). */
export function cleanSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

// ---------- Íconos de la app a partir del logo ----------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer el logo"));
    img.src = src;
  });
}

/**
 * Ícono cuadrado con el logo centrado sobre fondo blanco (el móvil redondea las esquinas).
 * Deja margen para que Android pueda recortarlo en círculo sin cortar el logo.
 */
async function iconPng(img: HTMLImageElement, size: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo generar el ícono");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, size, size);
  const box = size * 0.72;
  const scale = Math.min(box / img.naturalWidth, box / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo generar el ícono"))), "image/png"),
  );
}

/** Genera los íconos de la app desde el logo y los sube a Supabase. Devuelve sus URLs. */
export async function uploadAppIcons(tenantId: string, logoDataUrl: string): Promise<Record<string, string>> {
  const { sb } = await import("@/lib/cloud/client");
  const img = await loadImage(logoDataUrl);
  const version = Date.now();
  const out: Record<string, string> = {};
  for (const size of [180, 192, 512]) {
    const blob = await iconPng(img, size);
    const path = `${tenantId}/icon-${size}.png`;
    const { error } = await sb().storage.from("box-icons").upload(path, blob, {
      upsert: true,
      contentType: "image/png",
      cacheControl: "3600",
    });
    if (error) throw new Error("No se pudieron guardar los íconos de la app");
    out[String(size)] = `${sb().storage.from("box-icons").getPublicUrl(path).data.publicUrl}?v=${version}`;
  }
  return out;
}
