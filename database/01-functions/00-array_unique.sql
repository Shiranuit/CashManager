CREATE OR REPLACE FUNCTION public.array_unique(arr anyarray)
    RETURNS anyarray
    LANGUAGE SQL
AS $FUNCTION$
    SELECT array_agg(distinct elem)
    FROM unnest(arr) AS arr(elem)
$FUNCTION$;