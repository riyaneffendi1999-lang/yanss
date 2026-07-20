CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION app_private.is_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin', 'cs', 'finance', 'head', 'supervisor', 'ast_spv', 'staff')
  );
$$;

GRANT USAGE ON SCHEMA app_private TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_admin_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION app_private.is_admin_role(uuid) TO service_role;

DROP POLICY IF EXISTS "Users see own logs" ON public.activity_logs;
CREATE POLICY "Users see own logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR app_private.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Admin roles can read bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admin roles can insert bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admin roles can update bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admin roles can delete bank_accounts" ON public.bank_accounts;
CREATE POLICY "Admin roles can read bank_accounts"
ON public.bank_accounts FOR SELECT TO authenticated
USING (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can insert bank_accounts"
ON public.bank_accounts FOR INSERT TO authenticated
WITH CHECK (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can update bank_accounts"
ON public.bank_accounts FOR UPDATE TO authenticated
USING (app_private.is_admin_role(auth.uid()))
WITH CHECK (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can delete bank_accounts"
ON public.bank_accounts FOR DELETE TO authenticated
USING (app_private.is_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Admin roles can view deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admin roles can insert deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admin roles can update deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admin roles can delete deposits" ON public.deposits;
CREATE POLICY "Admin roles can view deposits"
ON public.deposits FOR SELECT TO authenticated
USING (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can insert deposits"
ON public.deposits FOR INSERT TO authenticated
WITH CHECK (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can update deposits"
ON public.deposits FOR UPDATE TO authenticated
USING (app_private.is_admin_role(auth.uid()))
WITH CHECK (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can delete deposits"
ON public.deposits FOR DELETE TO authenticated
USING (app_private.is_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Admin roles can read gebyar" ON public.gebyar_turnover_entries;
DROP POLICY IF EXISTS "Admin roles can insert gebyar" ON public.gebyar_turnover_entries;
DROP POLICY IF EXISTS "Admin roles can update gebyar" ON public.gebyar_turnover_entries;
DROP POLICY IF EXISTS "Admin roles can delete gebyar" ON public.gebyar_turnover_entries;
CREATE POLICY "Admin roles can read gebyar"
ON public.gebyar_turnover_entries FOR SELECT TO authenticated
USING (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can insert gebyar"
ON public.gebyar_turnover_entries FOR INSERT TO authenticated
WITH CHECK (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can update gebyar"
ON public.gebyar_turnover_entries FOR UPDATE TO authenticated
USING (app_private.is_admin_role(auth.uid()))
WITH CHECK (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can delete gebyar"
ON public.gebyar_turnover_entries FOR DELETE TO authenticated
USING (app_private.is_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Admin roles can read kamis ceria claims" ON public.kamis_ceria_claims;
DROP POLICY IF EXISTS "Admin roles can insert kamis ceria claims" ON public.kamis_ceria_claims;
DROP POLICY IF EXISTS "Admin roles can update kamis ceria claims" ON public.kamis_ceria_claims;
DROP POLICY IF EXISTS "Admin roles can delete kamis ceria claims" ON public.kamis_ceria_claims;
CREATE POLICY "Admin roles can read kamis ceria claims"
ON public.kamis_ceria_claims FOR SELECT TO authenticated
USING (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can insert kamis ceria claims"
ON public.kamis_ceria_claims FOR INSERT TO authenticated
WITH CHECK (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can update kamis ceria claims"
ON public.kamis_ceria_claims FOR UPDATE TO authenticated
USING (app_private.is_admin_role(auth.uid()))
WITH CHECK (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can delete kamis ceria claims"
ON public.kamis_ceria_claims FOR DELETE TO authenticated
USING (app_private.is_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Admin roles can read lucky spin entries" ON public.lucky_spin_entries;
DROP POLICY IF EXISTS "Admin roles can insert lucky spin entries" ON public.lucky_spin_entries;
DROP POLICY IF EXISTS "Admin roles can update lucky spin entries" ON public.lucky_spin_entries;
DROP POLICY IF EXISTS "Admin roles can delete lucky spin entries" ON public.lucky_spin_entries;
CREATE POLICY "Admin roles can read lucky spin entries"
ON public.lucky_spin_entries FOR SELECT TO authenticated
USING (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can insert lucky spin entries"
ON public.lucky_spin_entries FOR INSERT TO authenticated
WITH CHECK (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can update lucky spin entries"
ON public.lucky_spin_entries FOR UPDATE TO authenticated
USING (app_private.is_admin_role(auth.uid()))
WITH CHECK (app_private.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can delete lucky spin entries"
ON public.lucky_spin_entries FOR DELETE TO authenticated
USING (app_private.is_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Head or super admin can update profiles" ON public.profiles;
CREATE POLICY "Head or super admin can update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (app_private.has_role(auth.uid(), 'super_admin'::public.app_role) OR app_private.has_role(auth.uid(), 'head'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'super_admin'::public.app_role) OR app_private.has_role(auth.uid(), 'head'::public.app_role));

DROP POLICY IF EXISTS "Head or super_admin can delete role access" ON public.role_page_access;
DROP POLICY IF EXISTS "Head or super_admin can insert role access" ON public.role_page_access;
CREATE POLICY "Head or super_admin can insert role access"
ON public.role_page_access FOR INSERT TO authenticated
WITH CHECK (app_private.has_role(auth.uid(), 'super_admin'::public.app_role) OR app_private.has_role(auth.uid(), 'head'::public.app_role));
CREATE POLICY "Head or super_admin can delete role access"
ON public.role_page_access FOR DELETE TO authenticated
USING (app_private.has_role(auth.uid(), 'super_admin'::public.app_role) OR app_private.has_role(auth.uid(), 'head'::public.app_role));

DROP POLICY IF EXISTS "Head can manage non-super_admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR app_private.has_role(auth.uid(), 'super_admin'::public.app_role) OR app_private.has_role(auth.uid(), 'head'::public.app_role));
CREATE POLICY "Head can manage non-super_admin roles"
ON public.user_roles FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'head'::public.app_role) AND role <> 'super_admin'::public.app_role)
WITH CHECK (app_private.has_role(auth.uid(), 'head'::public.app_role) AND role <> 'super_admin'::public.app_role);
CREATE POLICY "Super admin can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (app_private.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (app_private.has_role(auth.uid(), 'super_admin'::public.app_role));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin_role(uuid) FROM authenticated, anon, public;