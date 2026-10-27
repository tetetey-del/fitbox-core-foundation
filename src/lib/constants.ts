/**
 * Constantes de aplicación centralizadas.
 * Cualquier "número mágico" que aparezca en más de un sitio (o que un cliente
 * pudiera querer ajustar) vive aquí.
 */

// ---- Reservas ----
/** Ventana por defecto (horas) para que un socio pueda cancelar sin coste. */
export const DEFAULT_CANCELLATION_HOURS = 1;

// ---- Auth ----
/** Longitud mínima de contraseña. */
export const MIN_PASSWORD_LENGTH = 8;
/** Tiempo de vida del código OTP de reset de contraseña (minutos). */
export const RESET_OTP_TTL_MIN = 15;
/** Longitud de códigos de invitación. */
export const INVITATION_CODE_LENGTH = 8;
/** Vida útil de una invitación (días). */
export const INVITATION_TTL_DAYS = 7;

// ---- Membresías ----
/** Días antes de expirar para marcar la membresía como "por caducar". */
export const MEMBERSHIP_EXPIRING_SOON_DAYS = 7;

// ---- Imágenes ----
/** Tamaño máximo de logo del box (bytes). */
export const MAX_LOGO_BYTES = 300 * 1024;
/** Tamaño máximo de imagen de post/feed (bytes). */
export const MAX_POST_IMAGE_BYTES = 800 * 1024;
/** Lado máximo (px) al que se redimensiona una imagen subida. */
export const IMAGE_MAX_DIMENSION = 1600;
/** Calidad JPEG usada por el compresor (0-1). */
export const IMAGE_JPEG_QUALITY = 0.82;

// ---- Backup ----
export const BACKUP_SCHEMA_VERSION = 1;
export const APP_VERSION = "0.10.0";
