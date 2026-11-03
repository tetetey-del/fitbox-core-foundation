import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listLocations } from "@/lib/services/locations.service";

/** Elegir sede (solo se muestra cuando el box tiene más de una). */
export function LocationSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const locations = listLocations();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Elige sede" /></SelectTrigger>
      <SelectContent>
        {locations.map((l) => (
          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
