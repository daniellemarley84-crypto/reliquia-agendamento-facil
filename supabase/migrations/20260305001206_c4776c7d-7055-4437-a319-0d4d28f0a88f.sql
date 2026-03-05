CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _raw_birth text;
  _birth_date date;
  _raw_phone text;
BEGIN
  _raw_birth := COALESCE(NEW.raw_user_meta_data->>'birth_date', '');

  IF _raw_birth ~ '^\d{4}-\d{2}-\d{2}$' THEN
    BEGIN
      _birth_date := _raw_birth::date;
    EXCEPTION WHEN others THEN
      _birth_date := NULL;
    END;
  ELSE
    _birth_date := NULL;
  END IF;

  _raw_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');

  INSERT INTO public.profiles (user_id, name, birth_date, phone, banned)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'name', '')), ''), 'Usuário'),
    _birth_date,
    NULLIF(REGEXP_REPLACE(_raw_phone, '\D', '', 'g'), ''),
    false
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;