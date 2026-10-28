/**
 * @file Marca del box para el <head> de la página, también en el servidor.
 *
 * En el servidor: si se abre el link del box (/b/<dirección>) se busca ese box; si no, se usa
 * la cookie `kf_box`. En el navegador, lo guardado. Así el iPhone y Android ya reciben el
 * nombre y el ícono del box al cargar la página (que es cuando los leen para instalar la app).
 */
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie, getRequestUrl } from "@tanstack/react-start/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/config/supabase";
import { BRAND_COOKIE, decodeBrandCookie, readBoxBrand, type BoxBrand } from "@/lib/boxBrand";

export interface HeadBrand {
  brand: BoxBrand | null;
}

async function fetchBox(slug: string): Promise<BoxBrand | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/kf_box_public`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_slug: slug }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const b = (await res.json()) as (BoxBrand & { slug?: string }) | null;
    return b?.name && b.slug ? { slug: b.slug, name: b.name, brandColor: b.brandColor, appIcon: b.appIcon } : null;
  } catch {
    return null;
  }
}

export const getHeadBrand = createIsomorphicFn()
  .server(async (): Promise<HeadBrand> => {
    let fromCookie: BoxBrand | null = null;
    try {
      fromCookie = decodeBrandCookie(getCookie(BRAND_COOKIE));
    } catch {
      /* nada */
    }
    try {
      const m = getRequestUrl().pathname.match(/^\/b\/([^/?#]+)/);
      if (m) {
        const box = await fetchBox(decodeURIComponent(m[1]));
        if (box) return { brand: box };
      }
    } catch {
      /* nada */
    }
    return { brand: fromCookie };
  })
  .client(async (): Promise<HeadBrand> => ({ brand: readBoxBrand() }));
