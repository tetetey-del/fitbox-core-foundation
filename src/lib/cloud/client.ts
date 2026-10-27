import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/config/supabase";

let client: SupabaseClient | null = null;

/** ¿Está configurado Supabase? Si no, la app funciona solo en modo demo (navegador). */
export function cloudEnabled(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_PUBLISHABLE_KEY;
}

/** Cliente de Supabase (solo en el navegador). */
export function sb(): SupabaseClient {
  if (typeof window === "undefined") throw new Error("Supabase solo se usa en el navegador");
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "kinflow-auth" },
    });
  }
  return client;
}
