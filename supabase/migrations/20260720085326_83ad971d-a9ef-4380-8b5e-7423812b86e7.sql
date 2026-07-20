-- 1. Restrict kamis_ceria_claims to admin roles only
DROP POLICY IF EXISTS "auth read kamis" ON public.kamis_ceria_claims;
DROP POLICY IF EXISTS "auth insert kamis" ON public.kamis_ceria_claims;
DROP POLICY IF EXISTS "auth update kamis" ON public.kamis_ceria_claims;
DROP POLICY IF EXISTS "auth delete kamis" ON public.kamis_ceria_claims;

CREATE POLICY "Admins can read kamis ceria claims"
  ON public.kamis_ceria_claims FOR SELECT TO authenticated
  USING (public.is_admin_role(auth.uid()));

CREATE POLICY "Admins can insert kamis ceria claims"
  ON public.kamis_ceria_claims FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_role(auth.uid()));

CREATE POLICY "Admins can update kamis ceria claims"
  ON public.kamis_ceria_claims FOR UPDATE TO authenticated
  USING (public.is_admin_role(auth.uid()))
  WITH CHECK (public.is_admin_role(auth.uid()));

CREATE POLICY "Admins can delete kamis ceria claims"
  ON public.kamis_ceria_claims FOR DELETE TO authenticated
  USING (public.is_admin_role(auth.uid()));

-- 2. Restrict lucky_spin_entries to admin roles only
DROP POLICY IF EXISTS "auth read lucky" ON public.lucky_spin_entries;
DROP POLICY IF EXISTS "auth insert lucky" ON public.lucky_spin_entries;
DROP POLICY IF EXISTS "auth update lucky" ON public.lucky_spin_entries;
DROP POLICY IF EXISTS "auth delete lucky" ON public.lucky_spin_entries;

CREATE POLICY "Admins can read lucky spin entries"
  ON public.lucky_spin_entries FOR SELECT TO authenticated
  USING (public.is_admin_role(auth.uid()));

CREATE POLICY "Admins can insert lucky spin entries"
  ON public.lucky_spin_entries FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_role(auth.uid()));

CREATE POLICY "Admins can update lucky spin entries"
  ON public.lucky_spin_entries FOR UPDATE TO authenticated
  USING (public.is_admin_role(auth.uid()))
  WITH CHECK (public.is_admin_role(auth.uid()));

CREATE POLICY "Admins can delete lucky spin entries"
  ON public.lucky_spin_entries FOR DELETE TO authenticated
  USING (public.is_admin_role(auth.uid()));

-- 3. Prevent head role from granting super_admin privileges
DROP POLICY IF EXISTS "Head or super admin manage roles" ON public.user_roles;

CREATE POLICY "Head can manage non-super_admin roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'head'::app_role) AND role <> 'super_admin'::app_role)
  WITH CHECK (public.has_role(auth.uid(), 'head'::app_role) AND role <> 'super_admin'::app_role);