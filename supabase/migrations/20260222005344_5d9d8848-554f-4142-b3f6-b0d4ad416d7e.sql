
-- Add is_admin column to profiles
ALTER TABLE public.profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false;

-- Create notifications table for admin
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message text NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can read notifications
CREATE POLICY "Admins can read notifications"
ON public.notifications
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
);

-- Only admins can update notifications (mark as read)
CREATE POLICY "Admins can update notifications"
ON public.notifications
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
);

-- Allow inserts from triggers/functions (service role)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create function to auto-create notification on new appointment
CREATE OR REPLACE FUNCTION public.notify_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  client_name text;
  service_name text;
BEGIN
  SELECT name INTO client_name FROM profiles WHERE user_id = NEW.user_id;
  SELECT name INTO service_name FROM services WHERE id = NEW.service_id;
  
  INSERT INTO notifications (message, appointment_id)
  VALUES (
    client_name || ' agendou ' || COALESCE(service_name, 'serviço') || ' para ' || NEW.appointment_date || ' às ' || NEW.appointment_time,
    NEW.id
  );
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_new_appointment
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_appointment();

-- Allow admins to read all appointments
CREATE POLICY "Admins can view all appointments"
ON public.appointments
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
);

-- Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true)
);
