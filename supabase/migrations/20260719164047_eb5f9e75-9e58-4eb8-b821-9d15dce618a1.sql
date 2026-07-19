
-- Table to store which sidebar pages each role can access
CREATE TABLE IF NOT EXISTS public.role_page_access (
  role app_role NOT NULL,
  page_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role, page_key)
);

GRANT SELECT ON public.role_page_access TO authenticated;
GRANT ALL ON public.role_page_access TO service_role;

ALTER TABLE public.role_page_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read role access"
  ON public.role_page_access FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Head or super_admin can insert role access"
  ON public.role_page_access FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'head') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Head or super_admin can delete role access"
  ON public.role_page_access FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'head') OR public.has_role(auth.uid(), 'super_admin'));

-- Seed default access
DELETE FROM public.role_page_access;

-- Head & super_admin: full access
INSERT INTO public.role_page_access (role, page_key)
SELECT r.role, p.page_key
FROM (VALUES ('head'::app_role), ('super_admin'::app_role), ('admin'::app_role)) AS r(role)
CROSS JOIN (VALUES
  ('/dashboard'),
  ('/deposit/bank/bca'), ('/deposit/bank/bni'), ('/deposit/bank/bri'), ('/deposit/bank/mandiri'),
  ('/deposit/emoney/dana'), ('/deposit/emoney/ovo'), ('/deposit/emoney/gopay'), ('/deposit/emoney/linkaja'),
  ('/deposit/pulsa/telkomsel'), ('/deposit/pulsa/xl'),
  ('/bonus/lucky-spin'), ('/bonus/kamis-ceria'), ('/bonus/gebyar-turnover'),
  ('/settings/admin'), ('/settings/bank'), ('/settings/roles'),
  ('/profile')
) AS p(page_key);

-- Supervisor: everything except manage admin & roles
INSERT INTO public.role_page_access (role, page_key) VALUES
  ('supervisor', '/dashboard'),
  ('supervisor', '/deposit/bank/bca'), ('supervisor', '/deposit/bank/bni'),
  ('supervisor', '/deposit/bank/bri'), ('supervisor', '/deposit/bank/mandiri'),
  ('supervisor', '/deposit/emoney/dana'), ('supervisor', '/deposit/emoney/ovo'),
  ('supervisor', '/deposit/emoney/gopay'), ('supervisor', '/deposit/emoney/linkaja'),
  ('supervisor', '/deposit/pulsa/telkomsel'), ('supervisor', '/deposit/pulsa/xl'),
  ('supervisor', '/bonus/lucky-spin'), ('supervisor', '/bonus/kamis-ceria'), ('supervisor', '/bonus/gebyar-turnover'),
  ('supervisor', '/settings/bank'),
  ('supervisor', '/profile');

-- Ast. Spv
INSERT INTO public.role_page_access (role, page_key) VALUES
  ('ast_spv', '/dashboard'),
  ('ast_spv', '/deposit/bank/bca'), ('ast_spv', '/deposit/bank/bni'),
  ('ast_spv', '/deposit/bank/bri'), ('ast_spv', '/deposit/bank/mandiri'),
  ('ast_spv', '/deposit/emoney/dana'), ('ast_spv', '/deposit/emoney/ovo'),
  ('ast_spv', '/deposit/emoney/gopay'), ('ast_spv', '/deposit/emoney/linkaja'),
  ('ast_spv', '/deposit/pulsa/telkomsel'), ('ast_spv', '/deposit/pulsa/xl'),
  ('ast_spv', '/bonus/lucky-spin'), ('ast_spv', '/bonus/kamis-ceria'), ('ast_spv', '/bonus/gebyar-turnover'),
  ('ast_spv', '/settings/bank'),
  ('ast_spv', '/profile');

-- Staff: dashboard + deposit + bonus + profile
INSERT INTO public.role_page_access (role, page_key) VALUES
  ('staff', '/dashboard'),
  ('staff', '/deposit/bank/bca'), ('staff', '/deposit/bank/bni'),
  ('staff', '/deposit/bank/bri'), ('staff', '/deposit/bank/mandiri'),
  ('staff', '/deposit/emoney/dana'), ('staff', '/deposit/emoney/ovo'),
  ('staff', '/deposit/emoney/gopay'), ('staff', '/deposit/emoney/linkaja'),
  ('staff', '/deposit/pulsa/telkomsel'), ('staff', '/deposit/pulsa/xl'),
  ('staff', '/bonus/lucky-spin'), ('staff', '/bonus/kamis-ceria'), ('staff', '/bonus/gebyar-turnover'),
  ('staff', '/profile');
