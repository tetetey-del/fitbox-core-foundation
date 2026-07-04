import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/socios")({ component: () => (
  <AppLayout>
    <PageHeader title="Socios" description="Próximamente en la Fase 2." />
  </AppLayout>
) });
