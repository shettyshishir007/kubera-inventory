-- ============================================================
-- Low Stock Email Alerts for Kubera Inventory
-- ============================================================
-- Run this in your Supabase SQL editor to enable email alerts
-- when an item's quantity drops at or below its min_quantity.
--
-- Supabase's built-in email sender (auth.email) can be used via
-- the net extension to call the internal email function, OR you
-- can use the pg_net + Resend/SendGrid approach shown here.
--
-- The simplest free approach is a DAILY email digest sent via
-- pg_cron + pg_net hitting a mailto link. However the cleanest
-- method is a Postgres trigger that records alerts in a table,
-- then Supabase sends the digest via an Edge Function (or you
-- can poll the table from the app).
--
-- This file sets up:
--   1. An `low_stock_alerts` table to track which alerts fired
--   2. A trigger on `items` that inserts an alert row when an
--      item crosses below its minimum
--   3. A helper view `pending_low_stock_alerts` the app reads
--
-- The app (Profile page toggle) controls whether the user
-- actually wants to see these alerts.
-- ============================================================

-- 1. Alerts table
CREATE TABLE IF NOT EXISTS public.low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INT NOT NULL,
  min_quantity INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.low_stock_alerts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own alerts
DROP POLICY IF EXISTS "Users see own alerts" ON public.low_stock_alerts;
CREATE POLICY "Users see own alerts" ON public.low_stock_alerts
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own alerts" ON public.low_stock_alerts;
CREATE POLICY "Users delete own alerts" ON public.low_stock_alerts
  FOR DELETE USING (user_id = auth.uid());

-- 2. Trigger function: fires when an item drops at/below minimum
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when quantity dropped to or below min_quantity
  -- AND it wasn't already low before
  IF NEW.quantity <= NEW.min_quantity
     AND (TG_OP = 'INSERT' OR OLD.quantity > OLD.min_quantity) THEN
    INSERT INTO public.low_stock_alerts (user_id, item_id, item_name, quantity, min_quantity)
    VALUES (NEW.user_id, NEW.id, NEW.name, NEW.quantity, NEW.min_quantity);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger
DROP TRIGGER IF EXISTS trigger_low_stock ON public.items;
CREATE TRIGGER trigger_low_stock
  AFTER INSERT OR UPDATE OF quantity, min_quantity ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_low_stock();

-- 4. Pending alerts view (for the app to poll)
CREATE OR REPLACE VIEW public.pending_low_stock_alerts AS
SELECT * FROM public.low_stock_alerts
WHERE notified = FALSE
ORDER BY created_at DESC;

-- ============================================================
-- TO SEND ACTUAL EMAILS (optional):
-- ============================================================
-- Supabase's free tier includes the auth email system but cannot
-- easily send arbitrary transactional emails from SQL alone.
--
-- Recommended free options:
--   A) Use a Supabase Edge Function that polls pending_low_stock_alerts
--      every N minutes and emails via Resend (3,000 free/mo) or
--      SendGrid (100 free/day).
--   B) Use pg_cron + pg_net to POST to a webhook (e.g. Zapier/Make)
--      that sends the email.
--
-- Example scaffold for a daily digest via pg_cron (requires pg_cron
-- extension enabled in Supabase → Database → Extensions):
--
-- SELECT cron.schedule(
--   'low-stock-daily-digest',
--   '0 9 * * *',  -- 9am daily
--   $$
--   SELECT net.http_post(
--     url := 'https://your-edge-function-url/low-stock-email',
--     headers := jsonb_build_object('Content-Type', 'application/json'),
--     body := (SELECT jsonb_agg(to_jsonb(a)) FROM pending_low_stock_alerts a)::text
--   );
--   UPDATE public.low_stock_alerts SET notified = TRUE WHERE notified = FALSE;
--   $$
-- );
--
-- The app also reads pending_low_stock_alerts on the Dashboard to
-- display an in-app badge, which works without any external email
-- provider.
-- ============================================================
