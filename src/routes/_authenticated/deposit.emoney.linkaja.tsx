import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/deposit/emoney/linkaja")({
  head: () => ({ meta: [{ title: "Deposit LINKAJA — Admin Console" }] }),
  component: () => <PlaceholderPage title="Deposit LINKAJA" description="Kelola deposit via LINKAJA" />,
});
