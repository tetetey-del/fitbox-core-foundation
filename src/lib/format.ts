import type { CurrencyCode, ExerciseUnit } from "@/types";

/** Formatea segundos como mm:ss (o hh:mm:ss si ≥ 1h). */
export function formatSeconds(total: number): string {
  if (!Number.isFinite(total) || total < 0) return "—";
  const s = Math.round(total);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}:${p(mm)}:${p(ss)}` : `${p(mm)}:${p(ss)}`;
}

/** Convierte "mm:ss" o "hh:mm:ss" o segundos sueltos a segundos. */
export function parseSeconds(input: string): number | null {
  const raw = input.trim();
  if (!raw) return null;
  if (!raw.includes(":")) {
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  const parts = raw.split(":").map((p) => Number(p));
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  let total = 0;
  for (const n of parts) total = total * 60 + n;
  return total;
}

export function formatPrValue(value: number, unit: ExerciseUnit): string {
  switch (unit) {
    case "tiempo":
      return formatSeconds(value);
    case "kg":
      return `${value} kg`;
    case "reps":
      return `${value} reps`;
    case "metros":
      return `${value} m`;
  }
}

const CURRENCY_LOCALE: Record<CurrencyCode, string> = { EUR: "es-ES", ARS: "es-AR", USD: "en-US" };

/** Moneda del box con sesión activa. La actualiza AuthContext al cambiar de box. */
let activeCurrency: CurrencyCode = "EUR";

export function setActiveCurrency(currency: CurrencyCode | undefined): void {
  activeCurrency = currency ?? "EUR";
}

export function getActiveCurrency(): CurrencyCode {
  return activeCurrency;
}

/** Formatea un importe en la moneda del box activo (o en la que se indique). */
export function formatMoney(amount: number, currency: CurrencyCode = activeCurrency): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "ARS" ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Símbolo de la moneda, para etiquetas como "Precio ($)". */
export function currencySymbol(currency: CurrencyCode = activeCurrency): string {
  return currency === "EUR" ? "€" : currency === "USD" ? "US$" : "$";
}

export function formatMonthShort(iso: string): string {
  // iso: YYYY-MM
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d
    .toLocaleDateString("es-ES", { month: "short", year: "2-digit" })
    .replace(".", "");
}

/** Para tiempo: mejor = menor. Para el resto: mejor = mayor. */
export function isBetter(a: number, b: number, unit: ExerciseUnit): boolean {
  return unit === "tiempo" ? a < b : a > b;
}
