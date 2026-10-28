import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Repeat } from "lucide-react";
import { useRequireModule } from "@/hooks/useRequireModule";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useDataVersion } from "@/lib/data-bus";
import { classTemplatesRepo } from "@/lib/storage/repositories/classTemplates.repo";
import type { ClassTemplate } from "@/types";
import { WodEditor } from "@/components/wods/WodEditor";
import { WodCycleManager } from "@/components/wods/WodCycleManager";
import { TemplatesTable } from "@/components/classes/manage/TemplatesTable";
import { TemplateFormDialog } from "@/components/classes/manage/TemplateFormDialog";
import { RecurringSessionsDialog } from "@/components/classes/manage/RecurringSessionsDialog";
import { UpcomingSessionsList } from "@/components/classes/manage/UpcomingSessionsList";

export const Route = createFileRoute("/clases")({ component: ClasesPage });

function ClasesPage() {
  useRequireModule("reservas");
  const { currentUser, tenantUsers } = useAuth();
  const navigate = useNavigate();
  useDataVersion();

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin" && currentUser.role !== "coach") {
      navigate({ to: "/dashboard" });
    }
  }, [currentUser, navigate]);

  const templates = classTemplatesRepo.list();
  const coaches = tenantUsers.filter((u) => u.role === "coach" || u.role === "admin");

  const [tab, setTab] = useState<string>("plantillas");
  const [editing, setEditing] = useState<ClassTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  return (
    <AppLayout>
      <PageHeader
        title="Clases"
        description="Gestiona las plantillas de clase y programa sesiones recurrentes."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
          <TabsTrigger value="sesiones">Sesiones próximas</TabsTrigger>
          <TabsTrigger value="wod">WOD del día</TabsTrigger>
        </TabsList>

        <TabsContent value="plantillas" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {templates.length} plantilla{templates.length === 1 ? "" : "s"} definida
              {templates.length === 1 ? "" : "s"}.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setGenerating(true)}>
                <Repeat className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Generar sesiones
              </Button>
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Nueva plantilla
              </Button>
            </div>
          </div>

          <TemplatesTable
            templates={templates}
            coaches={coaches}
            onEdit={(t) => setEditing(t)}
          />
        </TabsContent>

        <TabsContent value="sesiones">
          <UpcomingSessionsList templates={templates} coaches={coaches} />
        </TabsContent>

        <TabsContent value="wod">
          <WodTabs />
        </TabsContent>
      </Tabs>

      <TemplateFormDialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        initial={editing}
        coaches={coaches}
      />

      <RecurringSessionsDialog
        open={generating}
        onOpenChange={setGenerating}
        templates={templates}
        coaches={coaches}
      />
    </AppLayout>
  );
}


/** WOD: día por día o ciclo de programación que se repite. */
function WodTabs() {
  return (
    <Tabs defaultValue="dia" className="max-w-3xl space-y-4">
      <TabsList>
        <TabsTrigger value="dia">WOD por día</TabsTrigger>
        <TabsTrigger value="ciclo">Ciclo de programación</TabsTrigger>
      </TabsList>
      <TabsContent value="dia">
        <div className="rounded-lg border border-border bg-card p-5">
          <WodEditor />
        </div>
      </TabsContent>
      <TabsContent value="ciclo">
        <div className="rounded-lg border border-border bg-card p-5">
          <WodCycleManager />
        </div>
      </TabsContent>
    </Tabs>
  );
}
