import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/deposit/pulsa/telkomsel")({
  head: () => ({ meta: [{ title: "Deposit TELKOMSEL — Admin Console" }] }),
  component: () => <PlaceholderPage title="Deposit TELKOMSEL" description="Kelola deposit pulsa TELKOMSEL" />,
});
