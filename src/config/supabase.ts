/**
 * Conexión con Supabase (base de datos y logins reales de Kinflow).
 * La clave "publishable" es pública por diseño: la seguridad la ponen las
 * políticas RLS de la base (ver supabase/migrations).
 * Se pueden sobreescribir con VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.
 */
export const SUPABASE_URL: string =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "https://zkbdwngmttgfstquzuek.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY: string =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "sb_publishable_YHdE17HMa0Tzr--XMXDoAA_5Gmn6Mrb";
