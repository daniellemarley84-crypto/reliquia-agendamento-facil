
-- 1. Recreate the trigger on auth.users for handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Fix ALL RLS policies from RESTRICTIVE to PERMISSIVE

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

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

-- services
DROP POLICY IF EXISTS "Anyone authenticated can read services" ON public.services;
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;

CREATE POLICY "Anyone authenticated can read services" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update services" ON public.services FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete services" ON public.services FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- 3. Create carousel_slides table
CREATE TABLE IF NOT EXISTS public.carousel_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position int NOT NULL DEFAULT 0,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view slides" ON public.carousel_slides FOR SELECT USING (true);
CREATE POLICY "Admins can insert slides" ON public.carousel_slides FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update slides" ON public.carousel_slides FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete slides" ON public.carousel_slides FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- 4. Create storage bucket for carousel images
INSERT INTO storage.buckets (id, name, public) VALUES ('carousel', 'carousel', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view carousel images" ON storage.objects FOR SELECT USING (bucket_id = 'carousel');
CREATE POLICY "Admins can upload carousel images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'carousel' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can update carousel images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'carousel' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete carousel images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'carousel' AND public.is_admin(auth.uid()));

-- 5. Seed default slides
INSERT INTO public.carousel_slides (position, title, subtitle, image_url) VALUES
  (0, 'Slide 1', 'Subtítulo', '/photos/foto1.jpg'),
  (1, 'Slide 2', 'Subtítulo', '/photos/foto2.jpg'),
  (2, 'Slide 3', 'Subtítulo', '/photos/foto3.jpg');
