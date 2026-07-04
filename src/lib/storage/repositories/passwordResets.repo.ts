/**
 * @file Códigos OTP de 6 dígitos para recuperación de contraseña.
 *
 * Global (no scoped). Cada código lleva `email`, `expiresAt` y `used`; auth.service lo consume y lo marca.
 */
import type { PasswordResetCode } from "@/types";
import { BaseRepo } from "./base.repo";

/** Global (no scoped) — el reset se hace por email, sin sesión activa. */
export const passwordResetsRepo = new BaseRepo<PasswordResetCode>(
  "password_resets",
  { scoped: false },
);
