import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/bonus/lucky-spin")({
  head: () => ({ meta: [{ title: "Lucky Spin — Admin Console" }] }),
  component: () => <PlaceholderPage title="Lucky Spin" description="Bonus adjustment Lucky Spin" />,
});
