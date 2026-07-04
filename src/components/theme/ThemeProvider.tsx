import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { applyTheme, DEFAULT_THEME_ID } from "@/lib/themes";
import { useDataVersion } from "@/lib/data-bus";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentTenant } = useAuth();
  useDataVersion();

  useEffect(() => {
    applyTheme(
      currentTenant?.themeId ?? DEFAULT_THEME_ID,
      currentTenant?.brandColor,
    );
  }, [currentTenant?.themeId, currentTenant?.brandColor]);

  return <>{children}</>;
}
