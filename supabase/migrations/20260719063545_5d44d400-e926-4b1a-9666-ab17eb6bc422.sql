-- Allow 'head' to manage user roles
DROP POLICY IF EXISTS "Head or super admin manage roles" ON public.user_roles;
CREATE POLICY "Head or super admin manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'head'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'head'));

-- Allow head/super_admin to update any profile (activation, name)
DROP POLICY IF EXISTS "Head or super admin manage profiles" ON public.profiles;
CREATE POLICY "Head or super admin manage profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'head'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'head'));