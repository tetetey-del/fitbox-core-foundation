import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/prs")({ component: () => (
  <AppLayout>
    <PageHeader title="PRs" description="Registra tus records personales. Próximamente." />
  </AppLayout>
) });
