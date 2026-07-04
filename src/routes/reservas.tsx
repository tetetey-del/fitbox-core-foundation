import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/reservas")({ component: () => (
  <AppLayout>
    <PageHeader title="Reservas" description="Próximamente en la Fase 2." />
  </AppLayout>
) });
