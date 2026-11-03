import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { applyTheme, DEFAULT_THEME_ID } from "@/lib/themes";
import { useDataVersion } from "@/lib/data-bus";
import { planAllows } from "@/lib/plans";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentTenant } = useAuth();
  useDataVersion();

  useEffect(() => {
    // Starter: colores de Kinflow (los colores propios son del plan Pro).
    const own = planAllows(currentTenant, "themes");
    applyTheme(
      own ? currentTenant?.themeId ?? DEFAULT_THEME_ID : DEFAULT_THEME_ID,
      own ? currentTenant?.brandColor : undefined,
    );
  }, [currentTenant?.themeId, currentTenant?.brandColor, currentTenant?.subscription?.plan]);

  return <>{children}</>;
}
