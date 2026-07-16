import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/deposit/emoney/ovo")({
  head: () => ({ meta: [{ title: "Deposit OVO — Admin Console" }] }),
  component: () => <PlaceholderPage title="Deposit OVO" description="Kelola deposit via OVO" />,
});
