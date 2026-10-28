import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { renderAppIcon, type AppIconStyle } from "@/lib/boxBrand";
import { cn } from "@/lib/utils";

interface Props {
  logo: string;
  style: AppIconStyle;
  onChange: (style: AppIconStyle) => void;
  boxName: string;
  brandColor: string;
}

/**
 * Vista previa del ícono de la app (como se ve en la pantalla de inicio del móvil),
 * con dos ajustes: tamaño del logo y color de fondo.
 */
export function AppIconEditor({ logo, style, onChange, boxName, brandColor }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const scale = style.scale ?? 1;
  const bg = style.bg ?? "auto";

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    const t = setTimeout(() => {
      renderAppIcon(logo, 180, style)
        .then((u) => {
          if (cancelled) URL.revokeObjectURL(u);
          else {
            url = u;
            setPreview(u);
          }
        })
        .catch(() => !cancelled && setPreview(null));
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logo, scale, bg]);

  const options: { id: string; label: string; color?: string }[] = [
    { id: "auto", label: "Automático" },
    { id: "#FFFFFF", label: "Blanco", color: "#FFFFFF" },
    { id: brandColor.toUpperCase(), label: "Color del box", color: brandColor },
    { id: "#000000", label: "Negro", color: "#000000" },
  ];
  const isCustom = bg !== "auto" && !options.some((o) => o.id === bg.toUpperCase());

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <Label className="text-sm font-medium">Ícono de la app</Label>
        <p className="text-xs text-muted-foreground">Así lo verán tus socios en la pantalla de inicio del móvil.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className="flex h-36 w-36 shrink-0 flex-col items-center justify-center gap-1.5 self-center rounded-2xl sm:self-start"
          style={{ background: "linear-gradient(160deg, #3a4f6b, #c9825b)" }}
        >
          {preview ? (
            <img src={preview} alt="Vista previa del ícono" className="h-16 w-16 rounded-[22%] shadow-md" />
          ) : (
            <div className="h-16 w-16 rounded-[22%] bg-white/30" />
          )}
          <span className="max-w-[8.5rem] truncate text-[11px] font-medium text-white drop-shadow">{boxName}</span>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="icon-scale" className="text-xs text-muted-foreground">
                Tamaño del logo
              </Label>
              <span className="text-xs text-muted-foreground">{Math.round(scale * 100)} %</span>
            </div>
            <input
              id="icon-scale"
              type="range"
              min={60}
              max={115}
              step={5}
              value={Math.round(scale * 100)}
              onChange={(e) => onChange({ ...style, scale: Number(e.target.value) / 100 })}
              className="w-full accent-[var(--brand)]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Fondo</Label>
            <div className="flex flex-wrap gap-2">
              {options.map((o) => {
                const selected = o.id === "auto" ? bg === "auto" : bg.toUpperCase() === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => onChange({ ...style, bg: o.id })}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                      selected ? "border-foreground ring-2 ring-foreground/20" : "border-border hover:border-foreground/40",
                    )}
                  >
                    {o.color && (
                      <span className="h-3.5 w-3.5 rounded-full border border-border" style={{ backgroundColor: o.color }} />
                    )}
                    {o.label}
                  </button>
                );
              })}
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                  isCustom ? "border-foreground ring-2 ring-foreground/20" : "border-border hover:border-foreground/40",
                )}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border border-border"
                  style={{
                    background: isCustom ? bg : "conic-gradient(#f43f5e, #f59e0b, #22c55e, #3b82f6, #a855f7, #f43f5e)",
                  }}
                />
                <input
                  type="color"
                  aria-label="Otro color de fondo"
                  value={isCustom ? bg : "#888888"}
                  onChange={(e) => onChange({ ...style, bg: e.target.value.toUpperCase() })}
                  className="sr-only"
                />
                Otro
              </label>
            </div>
          </div>

          {(scale !== 1 || bg !== "auto") && (
            <button
              type="button"
              onClick={() => onChange({})}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Volver al ajuste automático
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
