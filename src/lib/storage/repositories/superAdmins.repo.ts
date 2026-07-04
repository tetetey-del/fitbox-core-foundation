import type { SuperAdmin } from "@/types";
import { BaseRepo } from "./base.repo";

/** Simple repo global de super admins, con auth por email + password. */
interface SuperAdminEntity extends SuperAdmin {
  passwordHash?: string;
  updatedAt: string;
}

export const superAdminsRepo = new BaseRepo<SuperAdminEntity>(
  "superadmins_v2",
  { scoped: false },
);
