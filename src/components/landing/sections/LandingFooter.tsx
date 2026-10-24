import { Link } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import { credits } from "@/config/company";

interface FooterItem { label: string; href?: string; to?: string }

/** Footer con columnas de producto, cuenta y legal + créditos. */
export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-[#14B8A6]" strokeWidth={1.5} />
            <span className="font-semibold tracking-tight">FitBox</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Software todo-en-uno para boxes de CrossFit y gimnasios boutique.
          </p>
        </div>
        <FooterCol
          title="Producto"
          items={[
            { label: "Funciones", href: "#features" },
            { label: "Precios", href: "#pricing" },
            { label: "FAQ", href: "#faq" },
          ]}
        />
        <FooterCol
          title="Cuenta"
          items={[
            { label: "Crear cuenta", to: "/registro" },
            { label: "Iniciar sesión", to: "/login" },
            { label: "Recuperar contraseña", to: "/recuperar" },
          ]}
        />
        <FooterCol
          title="Legal"
          items={[
            { label: "Privacidad", to: "/legal/privacidad" },
            { label: "Cookies", to: "/legal/cookies" },
            { label: "Términos", to: "/legal/terminos" },
            { label: "Aviso legal", to: "/legal/aviso-legal" },
          ]}
        />
      </div>
      <div className="border-t border-border/60 py-4 text-center text-[11px] text-muted-foreground space-y-1">
        <div>
          Un producto de{" "}
          <a
            href={credits.productOf.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            {credits.productOf.name}
          </a>
          {" "}· Creado por{" "}
          <a
            href={credits.createdBy.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            {credits.createdBy.name}
          </a>
        </div>
        <div>© {new Date().getFullYear()} FitBox · Demo local, los datos se guardan en tu navegador</div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: FooterItem[] }) {
  return (
    <div>
      <div className="text-xs font-semibold mb-3">{title}</div>
      <ul className="space-y-2 text-xs text-muted-foreground">
        {items.map((i) => (
          <li key={i.label}>
            {i.to ? (
              <Link to={i.to} className="hover:text-foreground transition-colors">{i.label}</Link>
            ) : (
              <a href={i.href} className="hover:text-foreground transition-colors">{i.label}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
