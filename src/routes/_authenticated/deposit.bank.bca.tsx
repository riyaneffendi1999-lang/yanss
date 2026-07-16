import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/deposit/bank/bca")({
  head: () => ({ meta: [{ title: "Deposit BCA — Admin Console" }] }),
  component: () => <PlaceholderPage title="Deposit BCA" description="Kelola deposit via bank BCA" />,
});
