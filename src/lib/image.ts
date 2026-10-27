/**
 * Utilidades para subida y compresión de imágenes en el navegador.
 * Todo se maneja como data-URL (base64) porque el almacenamiento vive en
 * localStorage. Antes de guardar se recomienda comprimir a JPEG.
 */

import {
  IMAGE_JPEG_QUALITY,
  IMAGE_MAX_DIMENSION,
} from "@/lib/constants";

export interface CompressOptions {
  /** Lado mayor máximo, en píxeles. */
  maxDimension?: number;
  /** Calidad JPEG (0-1). */
  quality?: number;
  /** Forzar tipo de salida. Por defecto usa image/jpeg salvo si la fuente es PNG con transparencia. */
  mimeType?: "image/jpeg" | "image/webp";
}

/**
 * Lee un File como data-URL cruda (sin comprimir). Úsalo solo cuando no
 * quieras aplicar compresión (por ejemplo, un JSON de backup).
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("No se pudo leer el archivo"));
    r.readAsDataURL(file);
  });
}

/**
 * Comprime una imagen del cliente a data-URL JPEG (o WebP) respetando un
 * lado máximo. Si el navegador no soporta canvas, cae al FileReader crudo.
 *
 * @throws Error si el archivo no es una imagen.
 */
export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen");
  }
  const maxDim = opts.maxDimension ?? IMAGE_MAX_DIMENSION;
  const quality = opts.quality ?? IMAGE_JPEG_QUALITY;
  const mime = opts.mimeType ?? "image/jpeg";

  const dataUrl = await fileToDataUrl(file);
  // SVG: no tiene sentido pasarlo por canvas
  if (file.type === "image/svg+xml") return dataUrl;

  try {
    const img = await loadImage(dataUrl);
    const { width, height } = fitInside(img.width, img.height, maxDim);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL(mime, quality);
  } catch {
    return dataUrl;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo decodificar la imagen"));
    img.src = src;
  });
}

function fitInside(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w > h ? max / w : max / h;
  return {
    width: Math.round(w * ratio),
    height: Math.round(h * ratio),
  };
}

/** Tamaño aproximado en bytes de una data-URL base64. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return dataUrl.length;
  const b64 = dataUrl.slice(comma + 1);
  return Math.floor((b64.length * 3) / 4);
}

/**
 * Convierte una foto elegida por el usuario en un JPEG cuadrado chiquito (data URL),
 * recortando el centro. Así ocupa unos 15-30 KB y entra en el almacenamiento del navegador.
 */
export async function photoToAvatarDataUrl(file: File, size = 256): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen");
  if (file.size > 15 * 1024 * 1024) throw new Error("La foto pesa demasiado (máximo 15 MB)");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("No se pudo leer la foto"));
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo procesar la foto");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}
