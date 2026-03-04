-- Ensure profiles has banned column used by admin Cadastros screen
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false;

-- Ensure signup trigger safely creates profile rows with optional metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, birth_date, phone, banned)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'birth_date', '') ~ '^\d{4}-\d{2}-\d{2}$'
        THEN (NEW.raw_user_meta_data->>'birth_date')::date
      ELSE NULL
    END,
    NULLIF(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'phone', ''), '\D', '', 'g'), ''),
    false
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow auth system role to insert profile rows when creating users
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT, SELECT, UPDATE ON public.profiles TO supabase_auth_admin;

DROP POLICY IF EXISTS "Auth admin can insert profiles" ON public.profiles;
CREATE POLICY "Auth admin can insert profiles"
ON public.profiles
AS PERMISSIVE
FOR INSERT
TO supabase_auth_admin
WITH CHECK (true);

-- Remove duplicate confirmed appointments in the same slot (keep oldest)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY appointment_date, appointment_time
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM public.appointments
  WHERE status = 'confirmado'
)
DELETE FROM public.appointments a
USING ranked r
WHERE a.id = r.id
  AND r.rn > 1;

-- Enforce one confirmed appointment per date/time slot
CREATE UNIQUE INDEX IF NOT EXISTS appointments_unique_confirmed_slot
ON public.appointments (appointment_date, appointment_time)
WHERE status = 'confirmado';

NOTIFY pgrst, 'reload schema';