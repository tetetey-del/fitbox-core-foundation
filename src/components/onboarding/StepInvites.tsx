import { Field } from "@/routes/login";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

/** Paso 4: emails a invitar como socios iniciales. */
export function StepInvites({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <Field
        label="Emails de tus primeros socios (opcional)"
        hint="Separa por comas o líneas. Se crearán invitaciones que puedes compartir después."
      >
        <textarea
          className="w-full min-h-24 rounded-md border border-border bg-background p-2 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ana@ejemplo.com&#10;diego@ejemplo.com"
        />
      </Field>
    </div>
  );
}
