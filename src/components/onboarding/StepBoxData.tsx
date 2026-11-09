import { Input } from "@/components/ui/input";
import { Field } from "@/routes/login";
import { THEMES } from "@/lib/themes";
import type { ThemeId } from "@/types";
import { PLACE_WORDS, type PlaceWord } from "@/lib/placeTerms";

interface Props {
  boxName: string;
  onBoxNameChange: (v: string) => void;
  color: string;
  onColorChange: (v: string) => void;
  themeId: ThemeId;
  onThemeChange: (v: ThemeId) => void;
  logo: string;
  onLogoChange: (v: string) => void;
  placeWord: PlaceWord;
  onPlaceWordChange: (v: PlaceWord) => void;
}

/** Paso 1 del onboarding del owner: identidad visual del box. */
export function StepBoxData({
  boxName, onBoxNameChange, color, onColorChange, themeId, onThemeChange, logo, onLogoChange, placeWord, onPlaceWordChange,
}: Props) {
  return (
    <div className="space-y-4">
      <Field label="Nombre">
        <Input value={boxName} onChange={(e) => onBoxNameChange(e.target.value)} />
      </Field>
      <Field label="¿Cómo lo llamas?">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PLACE_WORDS.map((w) => (
            <button
              key={w.id}
              type="button"
              aria-pressed={placeWord === w.id}
              onClick={() => onPlaceWordChange(w.id)}
              className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                placeWord === w.id ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          La app usa esta palabra en todos lados ({PLACE_WORDS.find((w) => w.id === placeWord)?.example}).
        </p>
      </Field>
      <Field label="Color de marca">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="h-10 w-14 rounded-md border border-border bg-background cursor-pointer"
            aria-label="Color de marca"
          />
          <Input value={color} onChange={(e) => onColorChange(e.target.value)} />
        </div>
      </Field>
      <Field label="Tema">
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={`rounded-md border p-2 text-left text-xs transition-colors ${
                themeId === t.id ? "border-[#14B8A6] bg-[#14B8A6]/5" : "border-border"
              }`}
            >
              <div className="font-medium">{t.name}</div>
              <div className="text-muted-foreground mt-0.5">{t.description}</div>
            </button>
          ))}
        </div>
      </Field>
      <Field label="Logo (URL opcional)">
        <Input value={logo} onChange={(e) => onLogoChange(e.target.value)} placeholder="https://…" />
      </Field>
    </div>
  );
}
