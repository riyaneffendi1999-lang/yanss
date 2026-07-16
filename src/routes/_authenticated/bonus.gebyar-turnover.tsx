import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/bonus/gebyar-turnover")({
  head: () => ({ meta: [{ title: "Gebyar Turnover — Admin Console" }] }),
  component: () => <PlaceholderPage title="Gebyar Turnover" description="Bonus adjustment Gebyar Turnover" />,
});
