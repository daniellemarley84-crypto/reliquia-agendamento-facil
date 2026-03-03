
-- 1. Drop ALL existing RESTRICTIVE policies and recreate as PERMISSIVE

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- appointments
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;

CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all appointments" ON public.appointments FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can create own appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own appointments" ON public.appointments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- carousel_slides
DROP POLICY IF EXISTS "Anyone can view slides" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can insert slides" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can update slides" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can delete slides" ON public.carousel_slides;

CREATE POLICY "Anyone can view slides" ON public.carousel_slides FOR SELECT USING (true);
CREATE POLICY "Admins can insert slides" ON public.carousel_slides FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update slides" ON public.carousel_slides FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete slides" ON public.carousel_slides FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- services
DROP POLICY IF EXISTS "Anyone authenticated can read services" ON public.services;
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;

CREATE POLICY "Anyone authenticated can read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Admins can insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update services" ON public.services FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete services" ON public.services FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- 2. Recreate handle_new_user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Add banned column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
