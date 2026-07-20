DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'cs', 'finance', 'head', 'supervisor', 'ast_spv', 'staff');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin', 'cs', 'finance', 'head', 'supervisor', 'ast_spv', 'staff')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_page_access TO authenticated;
GRANT ALL ON public.role_page_access TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_accounts TO authenticated;
GRANT ALL ON public.bank_accounts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gebyar_turnover_entries TO authenticated;
GRANT ALL ON public.gebyar_turnover_entries TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kamis_ceria_claims TO authenticated;
GRANT ALL ON public.kamis_ceria_claims TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lucky_spin_entries TO authenticated;
GRANT ALL ON public.lucky_spin_entries TO service_role;

DROP POLICY IF EXISTS "Authenticated manage bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Authenticated read bank_accounts" ON public.bank_accounts;
CREATE POLICY "Admin roles can read bank_accounts"
ON public.bank_accounts
FOR SELECT
TO authenticated
USING (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can insert bank_accounts"
ON public.bank_accounts
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can update bank_accounts"
ON public.bank_accounts
FOR UPDATE
TO authenticated
USING (public.is_admin_role(auth.uid()))
WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can delete bank_accounts"
ON public.bank_accounts
FOR DELETE
TO authenticated
USING (public.is_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can view deposits" ON public.deposits;
DROP POLICY IF EXISTS "Authenticated can insert deposits" ON public.deposits;
DROP POLICY IF EXISTS "Authenticated can update deposits" ON public.deposits;
DROP POLICY IF EXISTS "Authenticated can delete deposits" ON public.deposits;
CREATE POLICY "Admin roles can view deposits"
ON public.deposits
FOR SELECT
TO authenticated
USING (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can insert deposits"
ON public.deposits
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can update deposits"
ON public.deposits
FOR UPDATE
TO authenticated
USING (public.is_admin_role(auth.uid()))
WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can delete deposits"
ON public.deposits
FOR DELETE
TO authenticated
USING (public.is_admin_role(auth.uid()));

DROP POLICY IF EXISTS "auth read gebyar" ON public.gebyar_turnover_entries;
DROP POLICY IF EXISTS "auth insert gebyar" ON public.gebyar_turnover_entries;
DROP POLICY IF EXISTS "auth update gebyar" ON public.gebyar_turnover_entries;
DROP POLICY IF EXISTS "auth delete gebyar" ON public.gebyar_turnover_entries;
CREATE POLICY "Admin roles can read gebyar"
ON public.gebyar_turnover_entries
FOR SELECT
TO authenticated
USING (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can insert gebyar"
ON public.gebyar_turnover_entries
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can update gebyar"
ON public.gebyar_turnover_entries
FOR UPDATE
TO authenticated
USING (public.is_admin_role(auth.uid()))
WITH CHECK (public.is_admin_role(auth.uid()));
CREATE POLICY "Admin roles can delete gebyar"
ON public.gebyar_turnover_entries
FOR DELETE
TO authenticated
USING (public.is_admin_role(auth.uid()));