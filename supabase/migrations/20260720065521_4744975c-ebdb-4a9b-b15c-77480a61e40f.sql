
-- Kamis Ceria claims (shared across admins)
CREATE TABLE public.kamis_ceria_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  bonus BIGINT NOT NULL DEFAULT 50000,
  iso_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')::date,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kamis_ceria_claims TO authenticated;
GRANT ALL ON public.kamis_ceria_claims TO service_role;
ALTER TABLE public.kamis_ceria_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read kamis" ON public.kamis_ceria_claims FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert kamis" ON public.kamis_ceria_claims FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update kamis" ON public.kamis_ceria_claims FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete kamis" ON public.kamis_ceria_claims FOR DELETE TO authenticated USING (true);

-- Gebyar Turnover inputs (pending) and claims (completed)
CREATE TABLE public.gebyar_turnover_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  turnover NUMERIC NOT NULL DEFAULT 0,
  prize_text TEXT NOT NULL DEFAULT '',
  prize_amount BIGINT NOT NULL DEFAULT 0,
  period_month SMALLINT NOT NULL,
  period_year INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'input', -- 'input' | 'claimed'
  claimed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gebyar_turnover_entries TO authenticated;
GRANT ALL ON public.gebyar_turnover_entries TO service_role;
ALTER TABLE public.gebyar_turnover_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read gebyar" ON public.gebyar_turnover_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert gebyar" ON public.gebyar_turnover_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update gebyar" ON public.gebyar_turnover_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete gebyar" ON public.gebyar_turnover_entries FOR DELETE TO authenticated USING (true);
