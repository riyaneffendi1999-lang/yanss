import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    let session = data.session;

    if (!session) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }

    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at <= now + 60) {
      const refreshed = await supabase.auth.refreshSession();
      session = refreshed.data.session;
    }

    if (!session?.access_token) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }

    const { data: userData, error } = await supabase.auth.getUser(session.access_token);
    if (error || !userData.user) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }

    return { user: userData.user };
  },
  component: () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  ),
});
