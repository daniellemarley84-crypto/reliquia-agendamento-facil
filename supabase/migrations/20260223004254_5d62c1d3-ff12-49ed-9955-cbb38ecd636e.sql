
-- Add columns to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS duracao_minutos integer DEFAULT 30;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS descricao text DEFAULT '';

-- Add columns to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmado';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS combo boolean NOT NULL DEFAULT false;

-- Users can update own appointments (for cancellation via status)
CREATE POLICY "Users can update own appointments"
ON public.appointments FOR UPDATE
USING (auth.uid() = user_id);

-- Admin can delete appointments
CREATE POLICY "Admins can delete appointments"
ON public.appointments FOR DELETE
USING (public.is_admin(auth.uid()));

-- Admin can manage services (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can insert services"
ON public.services FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update services"
ON public.services FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete services"
ON public.services FOR DELETE
USING (public.is_admin(auth.uid()));

-- Drop notifications system
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP FUNCTION IF EXISTS public.notify_new_appointment() CASCADE;
