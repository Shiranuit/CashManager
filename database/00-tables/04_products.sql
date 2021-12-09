CREATE TABLE IF NOT EXISTS public.products (
  code TEXT PRIMARY KEY,
  name TEXT,
  image TEXT,
  ingredients TEXT,
  price DECIMAL,
  brand TEXT,
  nutriScore VARCHAR(1),
  raw JSONB
);