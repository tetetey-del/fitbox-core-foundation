/**
 * @file Sedes del box.
 * Mientras el box tiene una sola sede (o ninguna cargada), la app no muestra nada de sedes.
 * Las clases sin sede y los socios sin sede principal cuentan como de la sede principal
 * (la primera que se creó).
 */
import type { ClassSession, Location, User } from "@/types";
import { locationsRepo } from "@/lib/storage/repositories/locations.repo";
import { classSessionsRepo } from "@/lib/storage/repositories/classSessions.repo";
import { usersRepo } from "@/lib/storage/repositories/users.repo";
import { sessionStore } from "@/lib/storage/session";

export function listLocations(): Location[] {
  return locationsRepo.list().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function hasMultipleLocations(): boolean {
  return locationsRepo.list().length > 1;
}

export function mainLocation(): Location | null {
  return listLocations()[0] ?? null;
}

/** Sede de una clase (las que no tienen, son de la principal). */
export function sessionLocationId(s: Pick<ClassSession, "locationId">): string | null {
  return s.locationId ?? mainLocation()?.id ?? null;
}

/** Sede principal de un socio. */
export function userLocationId(u: Pick<User, "profile">): string | null {
  const id = u.profile?.locationId;
  if (id && locationsRepo.getById(id)) return id;
  return mainLocation()?.id ?? null;
}

export function locationName(id: string | null | undefined): string {
  if (!id) return "";
  return locationsRepo.getById(id)?.name ?? "";
}

/**
 * Crea una sede. Si es la primera vez que se agrega una segunda sede y no había
 * ninguna cargada, antes se crea la principal con el nombre del box.
 */
export function createLocation(input: { name: string; address?: string }, boxName: string): Location {
  const tenantId = sessionStore.read()?.tenantId ?? "";
  if (locationsRepo.list().length === 0) {
    locationsRepo.create({ tenantId, name: boxName || "Sede principal" });
  }
  return locationsRepo.create({ tenantId, name: input.name.trim(), address: input.address?.trim() || undefined });
}

export function updateLocation(id: string, patch: { name?: string; address?: string }): void {
  locationsRepo.update(id, {
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.address !== undefined ? { address: patch.address.trim() || undefined } : {}),
  });
}

/** Borra una sede: sus clases y sus socios pasan a la sede principal. */
export function deleteLocation(id: string): { moved: number } {
  const main = mainLocation();
  if (!main || main.id === id) return { moved: 0 };
  let moved = 0;
  for (const s of classSessionsRepo.list()) {
    if (s.locationId === id) {
      classSessionsRepo.update(s.id, { locationId: undefined });
      moved++;
    }
  }
  for (const u of usersRepo.list()) {
    if (u.profile?.locationId === id) usersRepo.update(u.id, { profile: { ...u.profile, locationId: undefined } });
  }
  locationsRepo.remove(id);
  return { moved };
}

/** ¿La clase es de esa sede? (null = todas) */
export function inLocation(s: Pick<ClassSession, "locationId">, locationId: string | null): boolean {
  if (!locationId) return true;
  return sessionLocationId(s) === locationId;
}
