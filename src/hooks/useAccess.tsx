import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "super_admin"
  | "admin"
  | "cs"
  | "finance"
  | "head"
  | "supervisor"
  | "ast_spv"
  | "staff";

export const FULL_ACCESS_ROLES: AppRole[] = ["super_admin", "admin", "head"];

export function useMyRoles() {
  return useQuery<AppRole[]>({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
    staleTime: 5 * 60_000,
  });
}

export function useRoleAccess() {
  return useQuery<Record<string, string[]>>({
    queryKey: ["role-page-access"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_page_access" as never)
        .select("role,page_key");
      if (error) throw error;
      const map: Record<string, string[]> = {};
      ((data ?? []) as unknown as { role: string; page_key: string }[]).forEach((r) => {
        (map[r.role] ??= []).push(r.page_key);
      });
      return map;
    },
    staleTime: 60_000,
  });
}

export function useAllowedPages(): { allowed: Set<string>; loading: boolean; fullAccess: boolean } {
  const { data: roles = [], isLoading: rl } = useMyRoles();
  const { data: access = {}, isLoading: al } = useRoleAccess();
  const fullAccess = roles.some((r) => FULL_ACCESS_ROLES.includes(r));
  const allowed = new Set<string>();
  if (fullAccess) {
    // any page is allowed
  } else {
    roles.forEach((r) => (access[r] ?? []).forEach((p) => allowed.add(p)));
  }
  return { allowed, loading: rl || al, fullAccess };
}

export function isPageAllowed(
  path: string,
  allowed: Set<string>,
  fullAccess: boolean,
): boolean {
  if (fullAccess) return true;
  return allowed.has(path);
}
