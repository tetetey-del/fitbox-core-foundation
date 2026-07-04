/**
 * SHA-256 hashing helper (hex encoded).
 * Uso: nunca guardar contraseñas en claro, incluso en modo demo.
 * Nota: hashing sin salt — es demo local, no producción.
 */

const PEPPER = "fitbox_demo_pepper_v1";

export async function hashPassword(password: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    // Fallback muy débil, no debería llegar aquí en navegador moderno.
    let h = 0;
    const s = PEPPER + password;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return `fallback_${h.toString(16)}`;
  }
  const data = new TextEncoder().encode(PEPPER + password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(
  password: string,
  hash: string | undefined,
): Promise<boolean> {
  if (!hash) return false;
  const h = await hashPassword(password);
  return h === hash;
}

/** Genera un código legible de N caracteres (excluye O/0/I/1 para evitar confusiones). */
export function generateReadableCode(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    for (let i = 0; i < length; i++) out += alphabet[arr[i] % alphabet.length];
  } else {
    for (let i = 0; i < length; i++)
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** Genera un código numérico de 6 dígitos. */
export function generateOtpCode(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return String(arr[0] % 1_000_000).padStart(6, "0");
  }
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}
