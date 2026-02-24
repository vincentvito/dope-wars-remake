-- ============================================================
-- PRO TIER: Add pro status to profiles + purchases audit table
-- ============================================================

-- Add pro status columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN is_pro BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN pro_purchased_at TIMESTAMPTZ;

-- Fix game_sessions game_mode constraint to include pro modes
ALTER TABLE public.game_sessions
  DROP CONSTRAINT game_sessions_game_mode_check;
ALTER TABLE public.game_sessions
  ADD CONSTRAINT game_sessions_game_mode_check
  CHECK (game_mode IN ('30', 'pro_30', 'pro_45', 'pro_60'));

-- ============================================================
-- PURCHASES (Stripe payment audit trail)
-- ============================================================
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference (NULLABLE: user may not exist yet at payment time)
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Email used during Stripe Checkout (always available)
  email TEXT NOT NULL,

  -- Stripe references
  stripe_checkout_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,

  -- Payment details
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_purchases_user ON public.purchases(user_id);
CREATE INDEX idx_purchases_email ON public.purchases(email);
CREATE INDEX idx_purchases_stripe_session ON public.purchases(stripe_checkout_session_id);

-- RLS: users can view own purchases, all writes via service_role
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);
