/**
 * Manifest de la app instalable de cada box, servido desde el mismo dominio de la app
 * (Safari y Chrome lo leen mejor así). Los datos los arma la función `kf-manifest`.
 */
import { createFileRoute } from "@tanstack/react-router";
import { SUPABASE_URL } from "@/config/supabase";

export const Route = createFileRoute("/app-manifest/$slug")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const origin = new URL(request.url).origin;
        const url = `${SUPABASE_URL}/functions/v1/kf-manifest?box=${encodeURIComponent(params.slug)}&o=${encodeURIComponent(origin)}`;
        try {
          const res = await fetch(url);
          const body = await res.text();
          return new Response(body, {
            status: res.ok ? 200 : 502,
            headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=300" },
          });
        } catch {
          return Response.redirect(`${origin}/manifest.webmanifest`, 302);
        }
      },
    },
  },
});
