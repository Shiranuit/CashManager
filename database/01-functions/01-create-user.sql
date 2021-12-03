CREATE OR REPLACE FUNCTION public.create_user(username TEXT, password TEXT, email TEXT, role TEXT)
    RETURNS table (id INTEGER, username TEXT, email TEXT, role TEXT)
    LANGUAGE SQL
AS $FUNCTION$
    SELECT array_agg(distinct elem)
    FROM unnest(arr) AS arr(elem)
$FUNCTION$;