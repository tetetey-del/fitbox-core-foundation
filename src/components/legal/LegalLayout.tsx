import { Link } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import type { ReactNode } from "react";

export interface LegalSection {
  id: string;
  title: string;
}

const LEGAL_LINKS = [
  { to: "/legal/privacidad", label: "Privacidad" },
  { to: "/legal/cookies", label: "Cookies" },
  { to: "/legal/terminos", label: "Términos" },
  { to: "/legal/aviso-legal", label: "Aviso legal" },
] as const;

export function LegalLayout({
  title,
  sections,
  updatedAt,
  children,
}: {
  title: string;
  sections: LegalSection[];
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border/60">
        <Link to="/" className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-[#F97316]" strokeWidth={1.5} />
          <span className="font-semibold tracking-tight">FitBox</span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <header className="mb-8">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Legal</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-2">{title}</h1>
          <p className="mt-2 text-xs text-muted-foreground">Última actualización: {updatedAt}</p>
          <div className="mt-4 rounded-md border border-[#F97316]/30 bg-[#F97316]/10 px-4 py-3 text-xs">
            Estos textos son una <strong>plantilla base</strong>. Antes de operar en producción,
            revísalos con un profesional jurídico y confirma que los datos del titular
            configurados en <code>src/config/company.ts</code> son los correctos.
          </div>
        </header>

        <div className="grid gap-10 md:grid-cols-[220px_1fr]">
          <aside className="hidden md:block">
            <nav className="sticky top-6 space-y-1 text-sm">
              <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Índice</div>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block py-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>
          <article className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
            {children}
          </article>
        </div>

        <footer className="mt-16 pt-6 border-t border-border/60 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
          <Link to="/" className="ml-auto hover:text-foreground transition-colors">← Volver al inicio</Link>
        </footer>
      </main>
    </div>
  );
}

export function LegalSectionBlock({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-semibold tracking-tight mb-3">{title}</h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}
