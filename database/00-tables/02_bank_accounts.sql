CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id TEXT PRIMARY KEY,
  vcc TEXT NOT NULL,
  balance DECIMAL NOT NULL DEFAULT 0
);