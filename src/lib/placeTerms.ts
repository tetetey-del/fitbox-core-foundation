/**
 * @file Cómo llama cada lugar a sí mismo: gimnasio (por defecto), box, centro o estudio.
 * Toda la app usa estas palabras en vez de "box" fijo. Con "box" el entreno del día se llama WOD;
 * con el resto, "entreno del día". Las cuatro palabras son masculinas (el gimnasio, el box…).
 */
import { useAuth } from "@/contexts/AuthContext";
import { sessionStore } from "@/lib/storage/session";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { POST_TYPE_LABEL, type PostType, type Tenant } from "@/types";

export type PlaceWord = "gimnasio" | "box" | "centro" | "estudio";

export const PLACE_WORDS: Array<{ id: PlaceWord; label: string; example: string }> = [
  { id: "gimnasio", label: "Gimnasio", example: "tu gimnasio · entreno del día" },
  { id: "box", label: "Box", example: "tu box · WOD" },
  { id: "centro", label: "Centro", example: "tu centro · entreno del día" },
  { id: "estudio", label: "Estudio", example: "tu estudio · entreno del día" },
];

const PLURAL: Record<PlaceWord, string> = { gimnasio: "gimnasios", box: "boxes", centro: "centros", estudio: "estudios" };

export interface PlaceTerms {
  word: PlaceWord;
  /** gimnasio / box / centro / estudio */
  place: string;
  /** Gimnasio / Box / … */
  Place: string;
  places: string;
  /** "WOD" o "entreno del día" (en medio de una frase). */
  wod: string;
  /** "WOD del día" o "Entreno del día" (títulos). */
  Wod: string;
  /** "WODs" o "entrenos" */
  wods: string;
  /** "WOD" o "Entreno" (etiquetas cortas). */
  wodShort: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function placeTerms(tenant?: Pick<Tenant, "settings"> | null): PlaceTerms {
  const raw = tenant?.settings?.placeWord;
  const word: PlaceWord = raw && raw in PLURAL ? raw : "gimnasio";
  const box = word === "box";
  return {
    word,
    place: word,
    Place: cap(word),
    places: PLURAL[word],
    wod: box ? "WOD" : "entreno del día",
    Wod: box ? "WOD del día" : "Entreno del día",
    wods: box ? "WODs" : "entrenos",
    wodShort: box ? "WOD" : "Entreno",
  };
}

/** Palabras del lugar de la sesión actual (para servicios fuera de React). */
export function currentTerms(): PlaceTerms {
  const id = sessionStore.read()?.tenantId;
  return placeTerms(id ? tenantsRepo.getById(id) : null);
}

/** Palabras del lugar actual, dentro de componentes. */
export function useTerms(): PlaceTerms {
  const { currentTenant } = useAuth();
  return placeTerms(currentTenant);
}

/** Etiqueta del tipo de publicación ("WOD" pasa a "Entreno" fuera de los boxes). */
export function postTypeLabel(type: PostType): string {
  return type === "wod" ? currentTerms().wodShort : POST_TYPE_LABEL[type];
}
