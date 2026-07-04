import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tenantsRepo } from "@/lib/storage/repositories/tenants.repo";
import { notifyDataChanged } from "@/lib/data-bus";
import { THEMES, DEFAULT_THEME_ID, applyTheme, getTheme } from "@/lib/themes";
import type { ThemeId } from "@/types";
import { cn } from "@/lib/utils";
import { MAX_LOGO_BYTES } from "@/lib/constants";
import { compressImage, dataUrlBytes } from "@/lib/image";

export function AppearanceSection() {
  const { currentTenant, refresh } = useAuth();
  const [themeId, setThemeId] = useState<ThemeId>(currentTenant?.themeId ?? DEFAULT_THEME_ID);
  const [brandColor, setBrandColor] = useState(currentTenant?.brandColor ?? "#F97316");
  const [logo, setLogo] = useState<string | undefined>(currentTenant?.logo);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setThemeId(currentTenant?.themeId ?? DEFAULT_THEME_ID);
    setBrandColor(currentTenant?.brandColor ?? "#F97316");
    setLogo(currentTenant?.logo);
  }, [currentTenant]);

  const onFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, { maxDimension: 512 });
      if (dataUrlBytes(dataUrl) > MAX_LOGO_BYTES) {
        toast.error("El logo pesa demasiado incluso tras comprimir");
        return;
      }
      setLogo(dataUrl);
    } catch {
      toast.error("No se pudo procesar la imagen");
    }
  };

  const save = () => {
    if (!currentTenant) return;
    tenantsRepo.update(currentTenant.id, { themeId, brandColor, logo });
    applyTheme(themeId, brandColor);
    toast.success("Apariencia actualizada");
    notifyDataChanged();
    refresh();
  };

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-6">
      <div>
        <h2 className="text-base font-semibold">Apariencia</h2>
        <p className="text-sm text-muted-foreground">
          Tema visual, color de acento y logo del box.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tema</Label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((t) => {
            const selected = t.id === themeId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeId(t.id)}
                aria-pressed={selected}
                className={cn(
                  "text-left rounded-lg border p-3 transition-colors",
                  selected ? "border-foreground ring-2 ring-foreground/20" : "border-border hover:border-foreground/40",
                )}
              >
                <div
                  className="h-16 rounded-md border flex items-center gap-1 p-2"
                  style={{
                    backgroundColor: t.vars.background,
                    borderColor: t.vars.border,
                  }}
                >
                  <div
                    className="h-full w-1/2 rounded"
                    style={{ backgroundColor: t.vars.card }}
                  />
                  <div
                    className="h-4 w-8 rounded"
                    style={{ backgroundColor: t.previewAccent }}
                  />
                </div>
                <div className="mt-2 text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Color de acento</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              aria-label="Color de acento"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="h-10 w-14 rounded-md border border-border bg-background cursor-pointer"
            />
            <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            Por defecto usa {getTheme(themeId).previewAccent} del tema.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Logo</Label>
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt="Logo actual" className="h-12 w-12 rounded-md border border-border object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-md border border-dashed border-border" />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Subir
            </Button>
            {logo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLogo(undefined)}
                aria-label="Quitar logo"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Máx. 300 KB. PNG o JPG.</p>
        </div>
      </div>

      <Button onClick={save}>Guardar apariencia</Button>
    </section>
  );
}
