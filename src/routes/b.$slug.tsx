import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Share, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { KinflowMark } from "@/components/brand/KinflowLogo";
import { sb } from "@/lib/cloud/client";
import { saveBoxBrand, type BoxBrand } from "@/lib/boxBrand";
import { BoxIcon } from "./login";

export const Route = createFileRoute("/b/$slug")({
  head: () => ({ meta: [{ title: "Tu box — Kinflow" }] }),
  component: BoxLandingPage,
});

/**
 * Link propio de cada box: kinflow.es/b/<dirección>.
 * Quien entra por acá ve el logo y el nombre del box, y si instala la app queda con su marca.
 */
function BoxLandingPage() {
  const { slug } = Route.useParams();
  const { session } = useAuth();
  const [brand, setBrand] = useState<BoxBrand | null | undefined>(undefined);
  const [platform, setPlatform] = useState<"ios" | "android" | "installed" | "other">("other");

  useEffect(() => {
    const ua = navigator.userAgent;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    setPlatform(standalone ? "installed" : /iphone|ipad|ipod/i.test(ua) ? "ios" : /android/i.test(ua) ? "android" : "other");

    let cancelled = false;
    void sb()
      .rpc("kf_box_public", { p_slug: slug })
      .then(({ data }) => {
        if (cancelled) return;
        const b = data as (BoxBrand & { id: string }) | null;
        if (b?.name && b.slug) {
          const next: BoxBrand = { slug: b.slug, name: b.name, brandColor: b.brandColor, appIcon: b.appIcon };
          saveBoxBrand(next);
          document.title = b.name;
          setBrand(next);
        } else {
          setBrand(null);
        }
      }, () => !cancelled && setBrand(null));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (brand === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <p className="text-lg font-semibold">No encontramos ese box</p>
        <p className="text-sm text-muted-foreground">Revisa el link o pídeselo de nuevo a tu box.</p>
        <Button asChild variant="outline">
          <Link to="/login">Iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  const inside = session?.cloud;

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <BoxIcon brand={brand} className="h-24 w-24 text-2xl shadow-lg" />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">{brand.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reserva tus clases, mira el WOD y sigue tu progreso.</p>

        <div className="mt-8 w-full max-w-xs space-y-3">
          {inside ? (
            <Button asChild className="h-11 w-full" style={{ backgroundColor: brand.brandColor }}>
              <Link to={session?.role === "member" ? "/feed" : "/dashboard"}>Entrar a la app</Link>
            </Button>
          ) : (
            <>
              <Button asChild className="h-11 w-full" style={{ backgroundColor: brand.brandColor }}>
                <Link to="/login">Iniciar sesión</Link>
              </Button>
              <p className="text-xs text-muted-foreground">¿Todavía no tienes cuenta? Pide a tu box tu invitación.</p>
            </>
          )}
        </div>

        {platform !== "installed" && (
          <div className="mt-10 w-full max-w-sm rounded-xl border border-border bg-card p-4 text-left text-sm">
            <div className="font-medium">Instala la app de {brand.name}</div>
            {(platform === "android" ? ["android", "ios"] : ["ios", "android"]).map((os) =>
              os === "ios" ? (
                <p key={os} className="mt-2 text-muted-foreground">
                  <strong className="text-foreground">iPhone:</strong> abre este link en Safari, toca{" "}
                  <Share className="inline h-4 w-4 -mt-0.5" strokeWidth={1.75} /> <strong>Compartir</strong> →{" "}
                  <strong>Añadir a pantalla de inicio</strong>.
                </p>
              ) : (
                <p key={os} className="mt-2 text-muted-foreground">
                  <strong className="text-foreground">Android:</strong> abre este link en Chrome, toca el menú{" "}
                  <MoreVertical className="inline h-4 w-4 -mt-0.5" strokeWidth={1.75} /> →{" "}
                  <strong>Instalar aplicación</strong> (o <strong>Añadir a pantalla de inicio</strong>).
                </p>
              ),
            )}
            <p className="mt-2 text-xs text-muted-foreground">Te quedará con el logo de tu box y podrás recibir avisos.</p>
          </div>
        )}
      </main>
      <footer className="flex items-center justify-center gap-1 pb-6 text-[11px] text-muted-foreground">
        con tecnología de <KinflowMark className="h-3.5 w-3.5" /> Kinflow
      </footer>
    </div>
  );
}
