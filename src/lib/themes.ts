import type { ThemeId } from "@/types";

export interface ThemeVars {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveForeground: string;
}

export interface ThemeDef {
  id: ThemeId;
  name: string;
  description: string;
  /** "dark" o "light" — controla la clase en <html>. */
  mode: "dark" | "light";
  /** Color destacado del preview y por defecto de marca. */
  previewAccent: string;
  vars: ThemeVars;
}

const DARK_CARBON: ThemeDef = {
  id: "dark-carbon",
  name: "Dark Carbon",
  description: "Oscuro sobrio, alto contraste. El clásico de FitBox.",
  mode: "dark",
  previewAccent: "#F97316",
  vars: {
    background: "#0A0A0A",
    foreground: "#FAFAFA",
    card: "#111111",
    cardForeground: "#FAFAFA",
    popover: "#111111",
    popoverForeground: "#FAFAFA",
    primary: "#FAFAFA",
    primaryForeground: "#0A0A0A",
    secondary: "#1A1A1A",
    secondaryForeground: "#FAFAFA",
    muted: "#1A1A1A",
    mutedForeground: "#A1A1A1",
    accent: "#1A1A1A",
    accentForeground: "#FAFAFA",
    border: "#262626",
    input: "#262626",
    ring: "#404040",
    destructive: "#DC2626",
    destructiveForeground: "#FAFAFA",
  },
};

const LIGHT_CLEAN: ThemeDef = {
  id: "light-clean",
  name: "Light Clean",
  description: "Fondo blanco, limpio y minimal.",
  mode: "light",
  previewAccent: "#0EA5E9",
  vars: {
    background: "#FFFFFF",
    foreground: "#101010",
    card: "#FFFFFF",
    cardForeground: "#101010",
    popover: "#FFFFFF",
    popoverForeground: "#101010",
    primary: "#101010",
    primaryForeground: "#FFFFFF",
    secondary: "#F5F5F5",
    secondaryForeground: "#101010",
    muted: "#F5F5F5",
    mutedForeground: "#6B6B6B",
    accent: "#F5F5F5",
    accentForeground: "#101010",
    border: "#E5E5E5",
    input: "#E5E5E5",
    ring: "#A1A1A1",
    destructive: "#DC2626",
    destructiveForeground: "#FFFFFF",
  },
};

const NEON: ThemeDef = {
  id: "neon",
  name: "Neon",
  description: "Oscuro con acentos vibrantes tipo terminal moderna.",
  mode: "dark",
  previewAccent: "#22D3EE",
  vars: {
    background: "#08070E",
    foreground: "#F5F3FF",
    card: "#0F0E1A",
    cardForeground: "#F5F3FF",
    popover: "#0F0E1A",
    popoverForeground: "#F5F3FF",
    primary: "#22D3EE",
    primaryForeground: "#08070E",
    secondary: "#1B1930",
    secondaryForeground: "#F5F3FF",
    muted: "#161428",
    mutedForeground: "#A5A3C5",
    accent: "#1B1930",
    accentForeground: "#F5F3FF",
    border: "#2A2748",
    input: "#2A2748",
    ring: "#22D3EE",
    destructive: "#F43F5E",
    destructiveForeground: "#FFFFFF",
  },
};

const WARM_EARTH: ThemeDef = {
  id: "warm-earth",
  name: "Warm Earth",
  description: "Beige y marrón, tonos cálidos, modo claro.",
  mode: "light",
  previewAccent: "#B45309",
  vars: {
    background: "#FAF6F0",
    foreground: "#2A1B0E",
    card: "#FFFDF9",
    cardForeground: "#2A1B0E",
    popover: "#FFFDF9",
    popoverForeground: "#2A1B0E",
    primary: "#7C3A16",
    primaryForeground: "#FAF6F0",
    secondary: "#EDE3D3",
    secondaryForeground: "#2A1B0E",
    muted: "#EDE3D3",
    mutedForeground: "#7A6448",
    accent: "#EDE3D3",
    accentForeground: "#2A1B0E",
    border: "#DFD0B8",
    input: "#DFD0B8",
    ring: "#B08A5A",
    destructive: "#B91C1C",
    destructiveForeground: "#FFFFFF",
  },
};

const CORPORATE_BLUE: ThemeDef = {
  id: "corporate-blue",
  name: "Corporate Blue",
  description: "Azul profesional, tono corporativo, modo claro.",
  mode: "light",
  previewAccent: "#1D4ED8",
  vars: {
    background: "#F5F8FC",
    foreground: "#0B1E3A",
    card: "#FFFFFF",
    cardForeground: "#0B1E3A",
    popover: "#FFFFFF",
    popoverForeground: "#0B1E3A",
    primary: "#1D4ED8",
    primaryForeground: "#FFFFFF",
    secondary: "#E2EAF6",
    secondaryForeground: "#0B1E3A",
    muted: "#E2EAF6",
    mutedForeground: "#4A5A78",
    accent: "#E2EAF6",
    accentForeground: "#0B1E3A",
    border: "#CBD9EC",
    input: "#CBD9EC",
    ring: "#1D4ED8",
    destructive: "#DC2626",
    destructiveForeground: "#FFFFFF",
  },
};

export const THEMES: ThemeDef[] = [
  DARK_CARBON,
  LIGHT_CLEAN,
  NEON,
  WARM_EARTH,
  CORPORATE_BLUE,
];

export const DEFAULT_THEME_ID: ThemeId = "dark-carbon";

export function getTheme(id?: ThemeId | null): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? DARK_CARBON;
}

/** Aplica el tema al <html>: clase dark/light + variables CSS. */
export function applyTheme(themeId: ThemeId | undefined, brandColor?: string): void {
  if (typeof document === "undefined") return;
  const theme = getTheme(themeId);
  const html = document.documentElement;
  html.classList.toggle("dark", theme.mode === "dark");
  html.classList.toggle("light", theme.mode === "light");
  html.style.colorScheme = theme.mode;

  const set = (k: string, v: string) => html.style.setProperty(k, v);
  set("--background", theme.vars.background);
  set("--foreground", theme.vars.foreground);
  set("--card", theme.vars.card);
  set("--card-foreground", theme.vars.cardForeground);
  set("--popover", theme.vars.popover);
  set("--popover-foreground", theme.vars.popoverForeground);
  set("--primary", theme.vars.primary);
  set("--primary-foreground", theme.vars.primaryForeground);
  set("--secondary", theme.vars.secondary);
  set("--secondary-foreground", theme.vars.secondaryForeground);
  set("--muted", theme.vars.muted);
  set("--muted-foreground", theme.vars.mutedForeground);
  set("--accent", theme.vars.accent);
  set("--accent-foreground", theme.vars.accentForeground);
  set("--border", theme.vars.border);
  set("--input", theme.vars.input);
  set("--ring", theme.vars.ring);
  set("--destructive", theme.vars.destructive);
  set("--destructive-foreground", theme.vars.destructiveForeground);
  set("--brand", brandColor ?? theme.previewAccent);
}
