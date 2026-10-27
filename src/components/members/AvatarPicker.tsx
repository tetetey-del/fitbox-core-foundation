import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import { photoToAvatarDataUrl } from "@/lib/image";

/** Foto de perfil con botón para subir/cambiar (desde la galería o la cámara del celu) y quitar. */
export function AvatarPicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    setLoading(true);
    try {
      onChange(await photoToAvatarDataUrl(file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar la foto");
    } finally {
      setLoading(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={value ? "Cambiar foto" : "Subir foto"}
      >
        <UserAvatar name={name || "?"} src={value} className="h-20 w-20 text-xl" />
        <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-[#14B8A6] text-white">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" strokeWidth={2} />}
        </span>
      </button>
      <div className="flex flex-col items-start gap-1">
        <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()} disabled={loading}>
          {value ? "Cambiar foto" : "Subir foto"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onChange(undefined)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} /> Quitar
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}
