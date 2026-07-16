import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/deposit/emoney/gopay")({
  head: () => ({ meta: [{ title: "Deposit GOPAY — Admin Console" }] }),
  component: () => <PlaceholderPage title="Deposit GOPAY" description="Kelola deposit via GOPAY" />,
});
