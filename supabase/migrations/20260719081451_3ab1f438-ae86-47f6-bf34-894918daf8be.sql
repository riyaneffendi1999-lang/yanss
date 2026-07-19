
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_kind text NOT NULL,
  channel_name text NOT NULL,
  code text,
  account_name text NOT NULL,
  account_number text NOT NULL,
  opening_balance numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  daily_limit numeric NOT NULL DEFAULT 0,
  online boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_accounts TO authenticated;
GRANT ALL ON public.bank_accounts TO service_role;

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read bank_accounts"
  ON public.bank_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage bank_accounts"
  ON public.bank_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS notes text;
