import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/settings/bank")({
  head: () => ({ meta: [{ title: "Manage Bank — Admin Console" }] }),
  component: () => <PlaceholderPage title="Manage Bank" description="CRUD bank, saldo, status online/offline" />,
});
