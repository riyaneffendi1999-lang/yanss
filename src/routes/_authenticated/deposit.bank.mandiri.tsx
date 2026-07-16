import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/deposit/bank/mandiri")({
  head: () => ({ meta: [{ title: "Deposit MANDIRI — Admin Console" }] }),
  component: () => <PlaceholderPage title="Deposit MANDIRI" description="Kelola deposit via bank MANDIRI" />,
});
