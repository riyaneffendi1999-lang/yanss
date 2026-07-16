import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/_authenticated/settings/admin")({
  head: () => ({ meta: [{ title: "Manage Admin — Admin Console" }] }),
  component: () => <PlaceholderPage title="Manage Admin" description="Kelola daftar admin, role, dan aktivitas" />,
});
