import { tenantsRepo } from "./storage/repositories/tenants.repo";
import { createUserInTenant } from "./storage/repositories/users.repo";
import type { Tenant, User } from "@/types";

export interface SeedResult {
  tenant: Tenant;
  owner: User;
  users: User[];
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createTenantWithSeed(input: {
  name: string;
  ownerName: string;
  ownerEmail: string;
  brandColor: string;
  extras?: boolean;
}): SeedResult {
  const tenant = tenantsRepo.create({
    name: input.name,
    slug: slugify(input.name),
    brandColor: input.brandColor,
  });

  const owner = createUserInTenant(tenant.id, {
    name: input.ownerName,
    email: input.ownerEmail,
    role: "owner",
  });

  const extras: User[] = [];
  if (input.extras !== false) {
    extras.push(
      createUserInTenant(tenant.id, {
        name: "Laura Coach",
        email: "laura@" + tenant.slug + ".com",
        role: "coach",
      }),
      createUserInTenant(tenant.id, {
        name: "Marcos Coach",
        email: "marcos@" + tenant.slug + ".com",
        role: "coach",
      }),
      createUserInTenant(tenant.id, {
        name: "Ana Socia",
        email: "ana@" + tenant.slug + ".com",
        role: "member",
      }),
      createUserInTenant(tenant.id, {
        name: "Diego Socio",
        email: "diego@" + tenant.slug + ".com",
        role: "member",
      }),
    );
  }

  return { tenant, owner, users: [owner, ...extras] };
}

/** Seed completo de demostración: "CrossFit Norte". */
export function loadDemoData(): SeedResult {
  return createTenantWithSeed({
    name: "CrossFit Norte",
    ownerName: "Sergio Torres",
    ownerEmail: "sergio@crossfitnorte.com",
    brandColor: "#F97316",
  });
}
