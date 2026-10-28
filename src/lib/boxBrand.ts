/**
 * @file Marca de cada box en la app instalada (marca blanca).
 *
 * Cada box tiene su link (`/b/<slug>`). Quien entra por ahí, por una invitación o con su
 * sesión, ve la app con el nombre y el ícono de su box: al agregarla a la pantalla de inicio
 * queda con su logo, y las notificaciones salen con su nombre.
 * - iPhone usa `apple-touch-icon` y `apple-mobile-web-app-title` (se cambian acá).
 * - Android usa el manifest, que arma la función de Supabase `kf-manifest` para cada box.
 */

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

/**
 * Cookie con lo mínimo de la marca, para que el servidor mande la página ya con el nombre y
 * el ícono del box. Safari arma "Agregar a inicio" con lo que vino del servidor al cargar.
 */
export const BRAND_COOKIE = "kf_box";

export interface BrandCookie {
  s: string;
  n: string;
  i?: string;
}

export function encodeBrandCookie(brand: BoxBrand): string {
  const c: BrandCookie = { s: brand.slug, n: brand.name, i: brand.appIcon?.["180"] };
  return encodeURIComponent(JSON.stringify(c));
}

export function decodeBrandCookie(raw: string | undefined): BoxBrand | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(decodeURIComponent(raw)) as BrandCookie;
    if (!c?.s || !c?.n) return null;
    return { slug: c.s, name: c.n, appIcon: c.i ? { "180": c.i } : undefined };
  } catch {
    return null;
  }
}

function writeBrandCookie(brand: BoxBrand | null) {
  try {
    document.cookie = brand
      ? `${BRAND_COOKIE}=${encodeBrandCookie(brand)}; path=/; max-age=31536000; samesite=lax`
      : `${BRAND_COOKIE}=; path=/; max-age=0; samesite=lax`;
  } catch {
    /* nada */
  }
}

/** Manifest del box, servido desde el mismo dominio de la app (ruta /app-manifest/<slug>). */
export function brandManifestUrl(slug: string): string {
  return `/app-manifest/${encodeURIComponent(slug)}`;
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
  writeBrandCookie(brand);
  if (!brand) {
    setLink("manifest", "/manifest.webmanifest");
    setLink("apple-touch-icon", "/apple-touch-icon.png");
    setMeta("apple-mobile-web-app-title", "Kinflow");
    return;
  }
  const manifest = brandManifestUrl(brand.slug);
  const current = document.head.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  current?.removeAttribute("crossorigin");
  setLink("manifest", manifest);
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

/** Color de fondo del logo (esquinas) y recuadro donde está el dibujo, sin márgenes. */
interface LogoInfo {
  bg: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Logo ya recortado; si el fondo era claro, con el fondo pasado a blanco puro. */
  source: CanvasImageSource;
}

function analyzeLogo(img: HTMLImageElement): LogoInfo {
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const full: LogoInfo = { bg: "#FFFFFF", x: 0, y: 0, w: W, h: H, source: img };
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return full;
  ctx.drawImage(img, 0, 0);
  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, W, H);
  } catch {
    return full;
  }
  const px = imageData.data;
  const at = (x: number, y: number) => (y * W + x) * 4;
  // Fondo: promedio de las 4 esquinas (si son transparentes, blanco).
  const corners = [at(0, 0), at(W - 1, 0), at(0, H - 1), at(W - 1, H - 1)];
  const transparent = corners.every((i) => px[i + 3] < 20);
  const avg = (k: number) => Math.round(corners.reduce((a, i) => a + px[i + k], 0) / 4);
  const [r, g, b] = transparent ? [255, 255, 255] : [avg(0), avg(1), avg(2)];
  const isContent = (i: number) =>
    transparent ? px[i + 3] > 40 : Math.abs(px[i] - r) + Math.abs(px[i + 1] - g) + Math.abs(px[i + 2] - b) > 60;
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (isContent(at(x, y))) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return full;
  // Fondo casi blanco → blanco puro (queda más limpio en la pantalla de inicio).
  const light = r > 225 && g > 225 && b > 225;
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  if (light && !transparent) {
    // Se "blanquea" el fondo: el gris claro pasa a blanco y los colores se ajustan igual.
    for (let i = 0; i < px.length; i += 4) {
      px[i] = Math.min(255, (px[i] * 255) / r);
      px[i + 1] = Math.min(255, (px[i + 1] * 255) / g);
      px[i + 2] = Math.min(255, (px[i + 2] * 255) / b);
    }
    ctx.putImageData(imageData, 0, 0);
  }
  return {
    bg: light ? "#FFFFFF" : `#${hex(r)}${hex(g)}${hex(b)}`,
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
    source: light && !transparent ? c : img,
  };
}

/**
 * Ícono cuadrado: se recortan los márgenes del logo, el fondo se pinta del color del fondo
 * del logo y el dibujo ocupa la mayor parte. El de 512 deja más margen porque Android
 * puede recortarlo en círculo.
 */
async function iconPng(img: HTMLImageElement, size: number, fill: number): Promise<Blob> {
  const info = analyzeLogo(img);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo generar el ícono");
  ctx.fillStyle = info.bg;
  ctx.fillRect(0, 0, size, size);
  const box = size * fill;
  const scale = Math.min(box / info.w, box / info.h);
  const w = info.w * scale;
  const h = info.h * scale;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(info.source, info.x, info.y, info.w, info.h, (size - w) / 2, (size - h) / 2, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo generar el ícono"))), "image/png"),
  );
}

/** Versión del diseño de los íconos: si cambia, se vuelven a generar al guardar la apariencia. */
export const APP_ICON_VERSION = "2";

/** Ícono de prueba (para ver cómo queda sin subirlo). */
export async function renderAppIcon(logoDataUrl: string, size: number): Promise<string> {
  const blob = await iconPng(await loadImage(logoDataUrl), size, size === 512 ? 0.7 : 0.84);
  return URL.createObjectURL(blob);
}

/** Genera los íconos de la app desde el logo y los sube a Supabase. Devuelve sus URLs. */
export async function uploadAppIcons(tenantId: string, logoDataUrl: string): Promise<Record<string, string>> {
  const { sb } = await import("@/lib/cloud/client");
  const img = await loadImage(logoDataUrl);
  const version = Date.now();
  const out: Record<string, string> = {};
  for (const size of [180, 192, 512]) {
    const blob = await iconPng(img, size, size === 512 ? 0.7 : 0.84);
    const path = `${tenantId}/icon-${size}.png`;
    const { error } = await sb().storage.from("box-icons").upload(path, blob, {
      upsert: true,
      contentType: "image/png",
      cacheControl: "3600",
    });
    if (error) throw new Error("No se pudieron guardar los íconos de la app");
    out[String(size)] = `${sb().storage.from("box-icons").getPublicUrl(path).data.publicUrl}?v=${version}`;
  }
  out.v = APP_ICON_VERSION;
  return out;
}
