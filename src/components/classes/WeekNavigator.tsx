import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRange } from "@/lib/date";

interface Props {
  monday: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function WeekNavigator({ monday, onPrev, onNext, onToday }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={onPrev} aria-label="Semana anterior">
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
      </Button>
      <Button variant="outline" size="icon" onClick={onNext} aria-label="Semana siguiente">
        <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
      </Button>
      <Button variant="ghost" onClick={onToday} className="h-9">
        Hoy
      </Button>
      <div className="ml-2 text-sm text-muted-foreground">{formatRange(monday)}</div>
    </div>
  );
}
