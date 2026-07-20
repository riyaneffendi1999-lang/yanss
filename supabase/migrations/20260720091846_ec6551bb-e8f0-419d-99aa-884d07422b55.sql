
-- Fix infinite recursion on user_roles by using SECURITY DEFINER functions in policies

-- Drop recursive policies on user_roles
DROP POLICY IF EXISTS "Head can manage non-super_admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage all roles" ON public.user_roles;

-- Recreate using has_role() SECURITY DEFINER (bypasses RLS, no recursion)
CREATE POLICY "Super admin can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Head can manage non-super_admin roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'head') AND role <> 'super_admin')
  WITH CHECK (public.has_role(auth.uid(), 'head') AND role <> 'super_admin');

-- Rewrite policies that EXISTS-query user_roles to use is_admin_role() instead
-- bank_accounts
DROP POLICY IF EXISTS "Admin roles can read bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admin roles can insert bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admin roles can update bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admin roles can delete bank_accounts" ON public.bank_accounts;
CREATE POLICY "Admin roles can read bank_accounts" ON public.bank_accounts FOR SELECT USING (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can insert bank_accounts" ON public.bank_accounts FOR INSERT WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can update bank_accounts" ON public.bank_accounts FOR UPDATE USING (public.is_admin_role(auth.uid())) WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can delete bank_accounts" ON public.bank_accounts FOR DELETE USING (public.is_admin_role(auth.uid()));

-- deposits
DROP POLICY IF EXISTS "Admin roles can view deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admin roles can insert deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admin roles can update deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admin roles can delete deposits" ON public.deposits;
CREATE POLICY "Admin roles can view deposits" ON public.deposits FOR SELECT USING (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can insert deposits" ON public.deposits FOR INSERT WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can update deposits" ON public.deposits FOR UPDATE USING (public.is_admin_role(auth.uid())) WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can delete deposits" ON public.deposits FOR DELETE USING (public.is_admin_role(auth.uid()));

-- gebyar_turnover_entries
DROP POLICY IF EXISTS "Admin roles can read gebyar" ON public.gebyar_turnover_entries;
DROP POLICY IF EXISTS "Admin roles can insert gebyar" ON public.gebyar_turnover_entries;
DROP POLICY IF EXISTS "Admin roles can update gebyar" ON public.gebyar_turnover_entries;
DROP POLICY IF EXISTS "Admin roles can delete gebyar" ON public.gebyar_turnover_entries;
CREATE POLICY "Admin roles can read gebyar" ON public.gebyar_turnover_entries FOR SELECT USING (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can insert gebyar" ON public.gebyar_turnover_entries FOR INSERT WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can update gebyar" ON public.gebyar_turnover_entries FOR UPDATE USING (public.is_admin_role(auth.uid())) WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can delete gebyar" ON public.gebyar_turnover_entries FOR DELETE USING (public.is_admin_role(auth.uid()));

-- kamis_ceria_claims
DROP POLICY IF EXISTS "Admin roles can read kamis ceria claims" ON public.kamis_ceria_claims;
DROP POLICY IF EXISTS "Admin roles can insert kamis ceria claims" ON public.kamis_ceria_claims;
DROP POLICY IF EXISTS "Admin roles can update kamis ceria claims" ON public.kamis_ceria_claims;
DROP POLICY IF EXISTS "Admin roles can delete kamis ceria claims" ON public.kamis_ceria_claims;
CREATE POLICY "Admin roles can read kamis ceria claims" ON public.kamis_ceria_claims FOR SELECT USING (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can insert kamis ceria claims" ON public.kamis_ceria_claims FOR INSERT WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can update kamis ceria claims" ON public.kamis_ceria_claims FOR UPDATE USING (public.is_admin_role(auth.uid())) WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can delete kamis ceria claims" ON public.kamis_ceria_claims FOR DELETE USING (public.is_admin_role(auth.uid()));

-- lucky_spin_entries
DROP POLICY IF EXISTS "Admin roles can read lucky spin entries" ON public.lucky_spin_entries;
DROP POLICY IF EXISTS "Admin roles can insert lucky spin entries" ON public.lucky_spin_entries;
DROP POLICY IF EXISTS "Admin roles can update lucky spin entries" ON public.lucky_spin_entries;
DROP POLICY IF EXISTS "Admin roles can delete lucky spin entries" ON public.lucky_spin_entries;
CREATE POLICY "Admin roles can read lucky spin entries" ON public.lucky_spin_entries FOR SELECT USING (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can insert lucky spin entries" ON public.lucky_spin_entries FOR INSERT WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can update lucky spin entries" ON public.lucky_spin_entries FOR UPDATE USING (public.is_admin_role(auth.uid())) WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can delete lucky spin entries" ON public.lucky_spin_entries FOR DELETE USING (public.is_admin_role(auth.uid()));

-- profiles
DROP POLICY IF EXISTS "Head or super admin can update profiles" ON public.profiles;
CREATE POLICY "Head or super admin can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'head'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'head'));

-- role_page_access
DROP POLICY IF EXISTS "Head or super_admin can insert role access" ON public.role_page_access;
DROP POLICY IF EXISTS "Head or super_admin can delete role access" ON public.role_page_access;
CREATE POLICY "Head or super_admin can insert role access"
  ON public.role_page_access FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'head'));
CREATE POLICY "Head or super_admin can delete role access"
  ON public.role_page_access FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'head'));

-- activity_logs: add missing actor_name column referenced by the client
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS actor_name text;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS meta jsonb;
