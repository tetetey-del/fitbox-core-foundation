import type { Tenant } from "@/types";
import { BaseRepo } from "./base.repo";

export const tenantsRepo = new BaseRepo<Tenant>("tenants", { scoped: false });
