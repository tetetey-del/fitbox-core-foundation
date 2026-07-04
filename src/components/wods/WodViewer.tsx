import { ChevronDown, Dumbbell } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Wod } from "@/types";
import { WOD_BLOCK_LABEL } from "@/types";

export function WodViewer({ wod, defaultOpen = false }: { wod: Wod; defaultOpen?: boolean }) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="rounded-md border border-border bg-card">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted/40 transition-colors group">
        <span className="flex items-center gap-2 min-w-0">
          <Dumbbell className="h-4 w-4 text-foreground/70 shrink-0" strokeWidth={1.5} />
          <span className="font-medium truncate">WOD · {wod.title}</span>
        </span>
        <ChevronDown
          className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-data-[state=open]:rotate-180"
          strokeWidth={1.5}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 space-y-3">
        {wod.blocks.map((b, i) => (
          <div key={i} className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {WOD_BLOCK_LABEL[b.type]}
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{b.content}</div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
