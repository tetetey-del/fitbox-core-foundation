import type { User } from "@/types";

/** Edad en años a partir de una fecha YYYY-MM-DD. */
export function ageFrom(birthDate?: string): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return age >= 0 && age < 120 ? age : null;
}

/** Fecha de nacimiento en formato corto: 14/03/1992. */
export function formatBirthDate(birthDate?: string): string {
  if (!birthDate) return "";
  const [y, m, d] = birthDate.split("-");
  return `${d}/${m}/${y}`;
}

/** Al socio le falta algún dato obligatorio (hoy, la fecha de nacimiento). */
export function needsProfileData(user: User | null | undefined): boolean {
  return !!user && user.role === "member" && !user.profile?.birthDate;
}

/** Datos opcionales que el socio todavía no completó. */
export function missingOptionalData(user: User): string[] {
  const p = user.profile ?? {};
  const out: string[] = [];
  if (!p.phone) out.push("teléfono");
  if (!p.dni) out.push("DNI");
  if (!p.address) out.push("dirección");
  if (!p.emergencyName || !p.emergencyPhone) out.push("contacto de emergencia");
  return out;
}

/** Hoy en formato YYYY-MM-DD (para el máximo del selector de fecha). */
export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
