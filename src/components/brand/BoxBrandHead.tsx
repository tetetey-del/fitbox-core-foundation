import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { applyBoxBrand, readBoxBrand, saveBoxBrand } from "@/lib/boxBrand";

/**
 * Mantiene en la página el nombre y el ícono del box (para instalar la app con su marca).
 * Con sesión de un box real usa ese box; si no, el último box por el que se entró (link o invitación).
 */
export function BoxBrandHead() {
  const { session, currentTenant } = useAuth();
  const slug = currentTenant?.slug;
  const name = currentTenant?.name;
  const color = currentTenant?.brandColor;
  const icon = currentTenant?.appIcon?.["180"];

  useEffect(() => {
    if (session?.cloud && currentTenant && slug && name) {
      saveBoxBrand({ slug, name, brandColor: color, appIcon: currentTenant.appIcon });
    } else {
      applyBoxBrand(readBoxBrand());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.cloud, slug, name, color, icon]);

  return null;
}
