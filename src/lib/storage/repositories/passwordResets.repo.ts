import type { PasswordResetCode } from "@/types";
import { BaseRepo } from "./base.repo";

/** Global (no scoped) — el reset se hace por email, sin sesión activa. */
export const passwordResetsRepo = new BaseRepo<PasswordResetCode>(
  "password_resets",
  { scoped: false },
);
