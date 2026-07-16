import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/deposit/emoney/dana")({
  head: () => ({ meta: [{ title: "Deposit DANA — Admin Console" }] }),
  component: () => <PlaceholderPage title="Deposit DANA" description="Kelola deposit via DANA" />,
});
