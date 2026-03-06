-- Fix services & carousel_slides RLS to PERMISSIVE
DROP POLICY IF EXISTS "Anyone authenticated can read services" ON public.services;
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;

CREATE POLICY "Anyone can read services" ON public.services AS PERMISSIVE FOR SELECT USING (true);
CREATE POLICY "Admins can insert services" ON public.services AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update services" ON public.services AS PERMISSIVE FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete services" ON public.services AS PERMISSIVE FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view slides" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can insert slides" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can update slides" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can delete slides" ON public.carousel_slides;

CREATE POLICY "Anyone can view slides" ON public.carousel_slides AS PERMISSIVE FOR SELECT USING (true);
CREATE POLICY "Admins can insert slides" ON public.carousel_slides AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update slides" ON public.carousel_slides AS PERMISSIVE FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete slides" ON public.carousel_slides AS PERMISSIVE FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

NOTIFY pgrst, 'reload schema';