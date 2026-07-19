CREATE TABLE public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  account_id text,
  date_str text NOT NULL,
  iso_date date NOT NULL,
  time_str text NOT NULL,
  ticket text NOT NULL,
  username text NOT NULL,
  full_name text NOT NULL,
  sender_name text,
  sender_account text,
  group_tier text,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending',
  admin text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX deposits_channel_idx ON public.deposits(channel, iso_date DESC, time_str DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view deposits" ON public.deposits
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert deposits" ON public.deposits
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update deposits" ON public.deposits
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete deposits" ON public.deposits
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_deposits_updated_at
  BEFORE UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();