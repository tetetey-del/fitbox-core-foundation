/** Errores de autenticación con mensajes listos para mostrar. */
export type AuthErrorCode =
  | "email_not_found"
  | "wrong_password"
  | "suspended"
  | "email_already_used"
  | "invalid_code"
  | "code_expired"
  | "weak_password"
  | "terms_required"
  | "wrong_credentials"
  | "email_not_confirmed"
  | "confirm_email"
  | "no_tenant"
  | "network";

export class AuthError extends Error {
  constructor(public code: AuthErrorCode, message: string) {
    super(message);
  }
}

export const MESSAGES: Record<AuthErrorCode, string> = {
  email_not_found: "No existe ninguna cuenta con ese email.",
  wrong_password: "Contraseña incorrecta.",
  suspended: "Esta cuenta está suspendida. Contacta con soporte.",
  email_already_used: "Ya existe una cuenta con ese email.",
  invalid_code: "El código no es válido.",
  code_expired: "El código ha caducado. Solicita uno nuevo.",
  weak_password: "La contraseña debe tener al menos 8 caracteres.",
  terms_required: "Debes aceptar los términos y la política de privacidad.",
  wrong_credentials: "Email o contraseña incorrectos.",
  email_not_confirmed: "Todavía no confirmaste tu email. Revisa tu bandeja de entrada (y la de spam) y toca el enlace que te enviamos.",
  confirm_email: "Te enviamos un email para confirmar tu cuenta. Toca el enlace y después inicia sesión.",
  no_tenant: "Tu cuenta no está asociada a ningún box. Pídele a tu box una invitación.",
  network: "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.",
};

