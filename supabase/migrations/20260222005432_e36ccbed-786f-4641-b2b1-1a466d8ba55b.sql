
-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND is_admin = true
  )
$$;

-- Drop recursive policies
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON public.notifications;

-- Recreate with security definer function
CREATE POLICY "Admins can view all appointments"
ON public.appointments FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can read notifications"
ON public.notifications FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update notifications"
ON public.notifications FOR UPDATE
USING (public.is_admin(auth.uid()));
