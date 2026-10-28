import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { bootstrapDemoIfNeeded } from "@/lib/seed";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { BoxBrandHead } from "@/components/brand/BoxBrandHead";
import { brandManifestUrl } from "@/lib/boxBrand";
import { getHeadBrand } from "@/lib/boxBrandHead";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-semibold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o ha sido movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página no cargó
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo ha ido mal. Prueba a recargar o vuelve al inicio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Marca del box (si se entró por su link, invitación o sesión) para instalar la app con su nombre.
  loader: () => getHeadBrand(),
  head: ({ loaderData }) => {
    const brand = loaderData?.brand ?? null;
    const appName = brand?.name ?? "Kinflow";
    return {
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: brand ? brand.name : "Kinflow — Gestión para boxes y gimnasios" },
      {
        name: "description",
        content:
          "Kinflow es el software todo-en-uno para boxes de CrossFit, Hyrox y gimnasios: reservas, socios, clases y PRs.",
      },
      { property: "og:title", content: "Kinflow — Gestión para boxes y gimnasios" },
      {
        property: "og:description",
        content: "Reservas, socios, clases y PRs en un solo sitio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0E2A3A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
      { name: "apple-mobile-web-app-title", content: appName },
      { name: "application-name", content: appName },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "twitter:title", content: "Kinflow — Gestión para boxes y gimnasios" },
      { name: "description", content: "Kinflow es el software todo-en-uno para boxes de CrossFit, Hyrox y gimnasios: reservas, socios, clases y PRs." },
      { property: "og:description", content: "Kinflow es el software todo-en-uno para boxes de CrossFit, Hyrox y gimnasios: reservas, socios, clases y PRs." },
      { name: "twitter:description", content: "Kinflow es el software todo-en-uno para boxes de CrossFit, Hyrox y gimnasios: reservas, socios, clases y PRs." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/47f3dded-7e62-4194-8c97-12c55a5f2e7b/id-preview-a17b69e1--8a43a2be-09b4-4706-bf2f-6bdd77dd3d83.lovable.app-1783161887024.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/47f3dded-7e62-4194-8c97-12c55a5f2e7b/id-preview-a17b69e1--8a43a2be-09b4-4706-bf2f-6bdd77dd3d83.lovable.app-1783161887024.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { rel: "icon", href: "/icon-512.png", type: "image/png", sizes: "512x512" },
      { rel: "apple-touch-icon", href: brand?.appIcon?.["180"] ?? "/apple-touch-icon.png", sizes: "180x180" },
      brand
        ? { rel: "manifest", href: brandManifestUrl(brand.slug, loaderData?.origin ?? ""), crossOrigin: "anonymous" }
        : { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    bootstrapDemoIfNeeded();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BoxBrandHead />
          <Outlet />
          <Toaster position="top-right" richColors />
          <CookieBanner />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
