import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/settings/roles")({
  head: () => ({ meta: [{ title: "Role & Akses — Admin Console" }] }),
  component: () => <PlaceholderPage title="Role & Akses" description="Kelola role dan hak akses admin" />,
});
