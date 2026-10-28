import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { notifyDataChanged } from "@/lib/data-bus";
import { boxLink, cleanSlug } from "@/lib/boxBrand";
import { isCloudSession } from "@/lib/cloud/bookings";
import { sb } from "@/lib/cloud/client";
import { BoxIcon } from "@/routes/login";

/** "La app de tus socios": link propio del box, su dirección y cómo se ve el ícono. Solo boxes reales. */
export function AppLinkSection() {
  const { currentTenant, refresh } = useAuth();
  const [slug, setSlug] = useState(currentTenant?.slug ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => setSlug(currentTenant?.slug ?? ""), [currentTenant?.slug]);

  if (!currentTenant || !isCloudSession() || !currentTenant.slug) return null;
  const link = boxLink(currentTenant.slug);
  const brand = { slug: currentTenant.slug, name: currentTenant.name, brandColor: currentTenant.brandColor, appIcon: currentTenant.appIcon };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar. Selecciónalo y cópialo a mano.");
    }
  };

  const saveSlug = async () => {
    const next = cleanSlug(slug);
    if (next.length < 3) return toast.error("La dirección tiene que tener al menos 3 letras o números.");
    if (next === currentTenant.slug) return;
    setSaving(true);
    const { data: free, error } = await sb().rpc("kf_slug_available", { p_slug: next, p_tenant: currentTenant.id });
    if (error || !free) {
      setSaving(false);
      return toast.error(error ? "No se pudo comprobar la dirección." : "Esa dirección ya la usa otro box. Prueba con otra.");
    }
    tenantsRepo.update(currentTenant.id, { slug: next });
    notifyDataChanged();
    refresh();
    setSaving(false);
    toast.success("Dirección actualizada", { description: "Comparte el link nuevo con tus socios." });
  };

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-6">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Smartphone className="h-4 w-4" strokeWidth={1.75} style={{ color: "var(--brand)" }} />
          La app de tus socios
        </h2>
        <p className="text-sm text-muted-foreground">
          Comparte este link con tus socios. Al instalar la app desde ahí, les queda con el logo y el nombre de tu box,
          y las notificaciones llegan con tu nombre.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
        <BoxIcon brand={brand} className="h-14 w-14 text-base" />
        <div className="min-w-0">
          <div className="text-sm font-medium">{currentTenant.name}</div>
          <div className="text-xs text-muted-foreground">
            {currentTenant.appIcon ? "Así se ve el ícono en el móvil." : "Sube tu logo en Apariencia para usarlo como ícono."}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Link para tus socios</Label>
        <div className="flex gap-2">
          <Input readOnly value={link} onFocus={(e) => e.target.select()} className="font-mono text-xs" />
          <Button type="button" variant="outline" onClick={copy}>
            <Copy className="mr-2 h-4 w-4" strokeWidth={1.5} /> Copiar
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Dirección</Label>
        <div className="flex gap-2">
          <div className="flex min-w-0 flex-1 items-center rounded-md border border-input bg-background pl-3 text-xs text-muted-foreground">
            <span className="shrink-0">…/b/</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              onBlur={() => setSlug(cleanSlug(slug))}
              className="h-9 min-w-0 flex-1 bg-transparent px-1 font-mono text-foreground outline-none"
            />
          </div>
          <Button type="button" variant="outline" disabled={saving || cleanSlug(slug) === currentTenant.slug} onClick={saveSlug}>
            Guardar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Solo minúsculas, números y guiones. Si la cambias, el link viejo deja de funcionar.
        </p>
      </div>
    </section>
  );
}
