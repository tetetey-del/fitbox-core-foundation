import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/clases")({ component: () => (
  <AppLayout>
    <PageHeader title="Clases" description="Próximamente en la Fase 2." />
  </AppLayout>
) });
