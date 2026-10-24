import { Dumbbell, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang, useT } from "../i18n";

/** Barra de navegación superior de la landing. */
export function TopNav({ onEnter, onCreate }: { onEnter: () => void; onCreate: () => void }) {
  const t = useT().nav;
  const { lang, setLang } = useLang();
  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-5 w-5 text-[#14B8A6]" strokeWidth={1.5} />
        <span className="font-semibold tracking-tight">Kinflow</span>
      </div>
      <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
        <a href="#features" className="hover:text-foreground transition-colors">{t.product}</a>
        <a href="#pricing" className="hover:text-foreground transition-colors">{t.pricing}</a>
        <a href="#faq" className="hover:text-foreground transition-colors">{t.faq}</a>
      </nav>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          aria-label={t.switchLabel}
          title={t.switchLabel}
          onClick={() => setLang(lang === "es" ? "en" : "es")}
        >
          <Languages className="h-4 w-4 mr-1" strokeWidth={1.5} />
          {t.switchTo}
        </Button>
        <Button variant="ghost" size="sm" onClick={onEnter}>{t.login}</Button>
        <Button size="sm" className="hidden sm:inline-flex" onClick={onCreate}>
          {t.create}
        </Button>
      </div>
    </header>
  );
}
