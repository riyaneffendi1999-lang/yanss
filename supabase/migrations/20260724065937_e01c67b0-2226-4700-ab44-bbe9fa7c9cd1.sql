
-- Tighten SELECT policies on profiles
DROP POLICY IF EXISTS "Profiles readable by authenticated" ON public.profiles;
CREATE POLICY "Users read own profile, admins read all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR app_private.has_role(auth.uid(), 'super_admin'::app_role)
    OR app_private.has_role(auth.uid(), 'head'::app_role)
    OR app_private.has_role(auth.uid(), 'admin'::app_role)
  );

-- Tighten SELECT on role_page_access: users can read only rows for roles they hold; admins/head/super_admin read all
DROP POLICY IF EXISTS "Authenticated can read role access" ON public.role_page_access;
CREATE POLICY "Users read own role access, admins read all"
  ON public.role_page_access FOR SELECT
  TO authenticated
  USING (
    app_private.has_role(auth.uid(), 'super_admin'::app_role)
    OR app_private.has_role(auth.uid(), 'head'::app_role)
    OR app_private.has_role(auth.uid(), 'admin'::app_role)
    OR app_private.has_role(auth.uid(), role)
  );
