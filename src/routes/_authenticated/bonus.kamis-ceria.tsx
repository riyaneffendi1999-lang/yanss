import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/bonus/kamis-ceria")({
  head: () => ({ meta: [{ title: "Kamis Ceria — Admin Console" }] }),
  component: () => <PlaceholderPage title="Kamis Ceria" description="Bonus adjustment Kamis Ceria" />,
});
