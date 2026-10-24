import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Barra de navegación superior de la landing. */
export function TopNav({ onEnter, onCreate }: { onEnter: () => void; onCreate: () => void }) {
  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-5 w-5 text-[#14B8A6]" strokeWidth={1.5} />
        <span className="font-semibold tracking-tight">FitBox</span>
      </div>
      <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
        <a href="#features" className="hover:text-foreground transition-colors">Producto</a>
        <a href="#pricing" className="hover:text-foreground transition-colors">Precios</a>
        <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
      </nav>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onEnter}>Iniciar sesión</Button>
        <Button size="sm" className="hidden sm:inline-flex" onClick={onCreate}>
          Crear mi box
        </Button>
      </div>
    </header>
  );
}
