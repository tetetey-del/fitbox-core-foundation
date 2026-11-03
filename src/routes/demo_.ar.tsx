import { createFileRoute } from "@tanstack/react-router";
import { DemoChooser } from "./demo";

/** Demo para Argentina: box de ejemplo en pesos, con nombres y textos de allá. */
export const Route = createFileRoute("/demo_/ar")({
  head: () => ({ meta: [{ title: "Demo — Kinflow" }] }),
  component: () => <DemoChooser country="ar" />,
});
