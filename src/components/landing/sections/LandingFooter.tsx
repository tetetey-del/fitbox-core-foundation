import { Link } from "@tanstack/react-router";
import { KinflowMark } from "@/components/brand/KinflowLogo";
import { credits } from "@/config/company";
import { useT } from "../i18n";

interface FooterItem { label: string; href?: string; to?: string }

/** Footer con columnas de producto, cuenta y legal + créditos. */
export function LandingFooter() {
  const t = useT().footer;
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center gap-2">
            <KinflowMark className="h-6 w-6" />
            <span className="font-semibold tracking-tight">Kinflow</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t.tagline}
          </p>
        </div>
        <FooterCol
          title={t.product}
          items={[
            { label: t.features, href: "#features" },
            { label: t.pricing, href: "#pricing" },
            { label: t.faq, href: "#faq" },
          ]}
        />
        <FooterCol
          title={t.account}
          items={[
            { label: t.signup, to: "/registro" },
            { label: t.login, to: "/login" },
            { label: t.recover, to: "/recuperar" },
          ]}
        />
        <FooterCol
          title={t.legal}
          items={[
            { label: t.privacy, to: "/legal/privacidad" },
            { label: t.cookies, to: "/legal/cookies" },
            { label: t.terms, to: "/legal/terminos" },
            { label: t.notice, to: "/legal/aviso-legal" },
          ]}
        />
      </div>
      <div className="border-t border-border/60 py-4 text-center text-[11px] text-muted-foreground space-y-1">
        <div>{t.madeBy} {credits.madeBy}</div>
        <div>© {new Date().getFullYear()} Kinflow · {t.demo}</div>
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
