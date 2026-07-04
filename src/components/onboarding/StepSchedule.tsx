import { Checkbox } from "@/components/ui/checkbox";

export interface Slot { day: number; time: string; label: string }

export const DEFAULT_SLOTS: Slot[] = [
  { day: 1, time: "07:00", label: "L-V mañana" },
  { day: 1, time: "13:30", label: "L-V mediodía" },
  { day: 1, time: "17:30", label: "L-V tarde" },
  { day: 1, time: "19:00", label: "L-V noche" },
  { day: 6, time: "10:00", label: "Sábado mañana" },
];

interface Props {
  selectedSlots: Set<string>;
  onToggleSlot: (key: string) => void;
}

/** Paso 2: elección de franjas horarias que se generarán como plantillas y sesiones. */
export function StepSchedule({ selectedSlots, onToggleSlot }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Selecciona las franjas que impartirás:</p>
      {DEFAULT_SLOTS.map((s) => {
        const k = `${s.day}-${s.time}`;
        const checked = selectedSlots.has(k);
        return (
          <label
            key={k}
            className="flex items-center gap-3 rounded-md border border-border p-3 cursor-pointer"
          >
            <Checkbox checked={checked} onCheckedChange={() => onToggleSlot(k)} />
            <div className="text-sm">
              <div className="font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.time}</div>
            </div>
          </label>
        );
      })}
      <p className="text-xs text-muted-foreground pt-1">
        Se crearán plantillas y las primeras 2 semanas de sesiones automáticamente.
      </p>
    </div>
  );
}
