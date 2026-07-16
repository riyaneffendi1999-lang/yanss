import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/deposit/bank/bri")({
  head: () => ({ meta: [{ title: "Deposit BRI — Admin Console" }] }),
  component: () => <PlaceholderPage title="Deposit BRI" description="Kelola deposit via bank BRI" />,
});
