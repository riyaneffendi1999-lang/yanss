import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UserCircle } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Admin Console" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) return null;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      return { user: u.user, profile, roles: roles?.map((r) => r.role) ?? [] };
    },
  });

  return (
    <div>
      <PageHeader title="Profile" description="Detail akun admin Anda" />
      <div className="glass-panel soft-shadow max-w-2xl rounded-xl p-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <UserCircle className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold">
                {data?.profile?.full_name ?? "—"}
              </h2>
              <p className="truncate text-sm text-muted-foreground">{data?.user?.email}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data?.roles.length ? (
                  data.roles.map((r) => (
                    <span key={r} className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Belum ada role</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
