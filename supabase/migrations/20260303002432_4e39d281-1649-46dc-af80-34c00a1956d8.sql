
-- Add order_index and active columns to carousel_slides (if not exist)
ALTER TABLE public.carousel_slides ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;
ALTER TABLE public.carousel_slides ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Backfill order_index from existing position column
UPDATE public.carousel_slides SET order_index = position WHERE order_index = 0;
