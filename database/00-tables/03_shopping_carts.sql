CREATE TYPE PRODUCT AS (
  code TEXT,
  quantity INTEGER
);

CREATE TABLE IF NOT EXISTS public.shopping_carts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  products PRODUCT NOT NULL,

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);