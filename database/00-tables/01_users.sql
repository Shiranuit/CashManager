CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role TEXT NOT NULL DEFAULT 'user',

  CONSTRAINT unique_username UNIQUE (username),
  CONSTRAINT unique_email UNIQUE (email)
);