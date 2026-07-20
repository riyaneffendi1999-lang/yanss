
CREATE TABLE public.lucky_spin_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL DEFAULT '',
  ticket TEXT NOT NULL,
  bonus BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'input',
  processed_at TIMESTAMPTZ,
  iso_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lucky_spin_entries TO authenticated;
GRANT ALL ON public.lucky_spin_entries TO service_role;
ALTER TABLE public.lucky_spin_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read lucky" ON public.lucky_spin_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert lucky" ON public.lucky_spin_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update lucky" ON public.lucky_spin_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete lucky" ON public.lucky_spin_entries FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_lucky_spin_entries_updated_at BEFORE UPDATE ON public.lucky_spin_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX lucky_spin_entries_status_idx ON public.lucky_spin_entries(status);
CREATE INDEX lucky_spin_entries_iso_date_idx ON public.lucky_spin_entries(iso_date);
