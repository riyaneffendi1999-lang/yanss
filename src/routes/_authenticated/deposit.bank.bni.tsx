import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/deposit/bank/bni")({
  head: () => ({ meta: [{ title: "Deposit BNI — Admin Console" }] }),
  component: () => <PlaceholderPage title="Deposit BNI" description="Kelola deposit via bank BNI" />,
});
