import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/deposit/pulsa/xl")({
  head: () => ({ meta: [{ title: "Deposit XL — Admin Console" }] }),
  component: () => <PlaceholderPage title="Deposit XL" description="Kelola deposit pulsa XL" />,
});
