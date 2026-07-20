-- Helper CTE-style admin role list reused in policies
-- We avoid security definer functions inside RLS policies by using direct subqueries.

-- ============== PROFILES ==============
DROP POLICY IF EXISTS "Head or super admin manage profiles" ON public.profiles;

CREATE POLICY "Head or super admin can update profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','head')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','head')));

-- ============== ROLE_PAGE_ACCESS ==============
DROP POLICY IF EXISTS "Head or super_admin can insert role access" ON public.role_page_access;
DROP POLICY IF EXISTS "Head or super_admin can delete role access" ON public.role_page_access;

CREATE POLICY "Head or super_admin can insert role access"
  ON public.role_page_access FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','head')));

CREATE POLICY "Head or super_admin can delete role access"
  ON public.role_page_access FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','head')));

-- ============== USER_ROLES ==============
DROP POLICY IF EXISTS "Super admin manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Head can manage non-super_admin roles" ON public.user_roles;

CREATE POLICY "Super admin can manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Head can manage non-super_admin roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'head') AND role <> 'super_admin')
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'head') AND role <> 'super_admin');

-- ============== BANK_ACCOUNTS ==============
DROP POLICY IF EXISTS "Admin roles can read bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admin roles can insert bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admin roles can update bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admin roles can delete bank_accounts" ON public.bank_accounts;

CREATE POLICY "Admin roles can read bank_accounts"
  ON public.bank_accounts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can insert bank_accounts"
  ON public.bank_accounts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can update bank_accounts"
  ON public.bank_accounts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can delete bank_accounts"
  ON public.bank_accounts FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

-- ============== DEPOSITS ==============
DROP POLICY IF EXISTS "Admin roles can view deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admin roles can insert deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admin roles can update deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admin roles can delete deposits" ON public.deposits;

CREATE POLICY "Admin roles can view deposits"
  ON public.deposits FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can insert deposits"
  ON public.deposits FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can update deposits"
  ON public.deposits FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can delete deposits"
  ON public.deposits FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

-- ============== GEBYAR_TURNOVER_ENTRIES ==============
DROP POLICY IF EXISTS "Admin roles can read gebyar" ON public.gebyar_turnover_entries;
DROP POLICY IF EXISTS "Admin roles can insert gebyar" ON public.gebyar_turnover_entries;
DROP POLICY IF EXISTS "Admin roles can update gebyar" ON public.gebyar_turnover_entries;
DROP POLICY IF EXISTS "Admin roles can delete gebyar" ON public.gebyar_turnover_entries;

CREATE POLICY "Admin roles can read gebyar"
  ON public.gebyar_turnover_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can insert gebyar"
  ON public.gebyar_turnover_entries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can update gebyar"
  ON public.gebyar_turnover_entries FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can delete gebyar"
  ON public.gebyar_turnover_entries FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

-- ============== KAMIS_CERIA_CLAIMS ==============
DROP POLICY IF EXISTS "Admins can read kamis ceria claims" ON public.kamis_ceria_claims;
DROP POLICY IF EXISTS "Admins can insert kamis ceria claims" ON public.kamis_ceria_claims;
DROP POLICY IF EXISTS "Admins can update kamis ceria claims" ON public.kamis_ceria_claims;
DROP POLICY IF EXISTS "Admins can delete kamis ceria claims" ON public.kamis_ceria_claims;

CREATE POLICY "Admin roles can read kamis ceria claims"
  ON public.kamis_ceria_claims FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can insert kamis ceria claims"
  ON public.kamis_ceria_claims FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can update kamis ceria claims"
  ON public.kamis_ceria_claims FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can delete kamis ceria claims"
  ON public.kamis_ceria_claims FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

-- ============== LUCKY_SPIN_ENTRIES ==============
DROP POLICY IF EXISTS "Admins can read lucky spin entries" ON public.lucky_spin_entries;
DROP POLICY IF EXISTS "Admins can insert lucky spin entries" ON public.lucky_spin_entries;
DROP POLICY IF EXISTS "Admins can update lucky spin entries" ON public.lucky_spin_entries;
DROP POLICY IF EXISTS "Admins can delete lucky spin entries" ON public.lucky_spin_entries;

CREATE POLICY "Admin roles can read lucky spin entries"
  ON public.lucky_spin_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can insert lucky spin entries"
  ON public.lucky_spin_entries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can update lucky spin entries"
  ON public.lucky_spin_entries FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

CREATE POLICY "Admin roles can delete lucky spin entries"
  ON public.lucky_spin_entries FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin','cs','finance','head','supervisor','ast_spv','staff')));

-- ============== TIGHTEN EXECUTE ON SECURITY DEFINER FUNCTIONS ==============
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin_role(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.is_admin_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_role(uuid) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Keep service_role able to use role helpers in server functions; owner remains implicitly executable.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_role(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;