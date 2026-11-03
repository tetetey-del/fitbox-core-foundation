import { createFileRoute } from "@tanstack/react-router";
import { DemoChooser } from "./demo";

/** Demo personalizada para BORA (General Pico): su nombre, color, clases, horarios y planes. */
export const Route = createFileRoute("/demo_/bora")({
  head: () => ({ meta: [{ title: "BORA en Kinflow" }, { name: "robots", content: "noindex" }] }),
  component: () => <DemoChooser country="bora" />,
});
