import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/RoleGate";
import { SessionCard } from "@/components/classes/SessionCard";
import type { ClassSession, ClassTemplate, User } from "@/types";

interface Props {
  sessions: ClassSession[];
  templateById: Map<string, ClassTemplate>;
  userById: Map<string, User>;
  onOpenAgenda: () => void;
}

/**
 * Vista compacta de sesiones del día para admin y coach en el dashboard.
 */
export function CoachOrOwnerToday({ sessions, templateById, userById, onOpenAgenda }: Props) {
  return (
    <RoleGate allowed={["admin", "coach"]}>
      <section className="mt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Clases de hoy</h2>
          <Button variant="ghost" size="sm" onClick={onOpenAgenda}>
            Ver calendario
            <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
          </Button>
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin clases programadas hoy.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                template={templateById.get(s.templateId)}
                coach={s.coachId ? userById.get(s.coachId) : undefined}
                onClick={onOpenAgenda}
              />
            ))}
          </div>
        )}
      </section>
    </RoleGate>
  );
}
