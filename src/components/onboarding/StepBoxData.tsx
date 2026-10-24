import { Input } from "@/components/ui/input";
import { Field } from "@/routes/login";
import { THEMES } from "@/lib/themes";
import type { ThemeId } from "@/types";

interface Props {
  boxName: string;
  onBoxNameChange: (v: string) => void;
  color: string;
  onColorChange: (v: string) => void;
  themeId: ThemeId;
  onThemeChange: (v: ThemeId) => void;
  logo: string;
  onLogoChange: (v: string) => void;
}

/** Paso 1 del onboarding del owner: identidad visual del box. */
export function StepBoxData({
  boxName, onBoxNameChange, color, onColorChange, themeId, onThemeChange, logo, onLogoChange,
}: Props) {
  return (
    <div className="space-y-4">
      <Field label="Nombre del box">
        <Input value={boxName} onChange={(e) => onBoxNameChange(e.target.value)} />
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
