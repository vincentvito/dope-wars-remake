-- ============================================================
-- GAME_SESSIONS (active and completed games)
-- ============================================================
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Game configuration
  seed TEXT NOT NULL,
  game_mode TEXT NOT NULL DEFAULT '30'
    CHECK (game_mode IN ('30', '45', '60')),

  -- Game state (encrypted JSON blob for save/resume)
  state_blob JSONB,
  action_log JSONB,

  -- Results (populated on completion)
  final_cash BIGINT,
  final_bank BIGINT,
  final_debt BIGINT,
  final_inventory_value BIGINT,
  final_net_worth BIGINT,
  final_day INTEGER,

  -- Metadata
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Tier 2: Room association (nullable for now)
  room_id UUID
);

CREATE INDEX idx_game_sessions_user ON public.game_sessions(user_id);
CREATE INDEX idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX idx_game_sessions_user_active ON public.game_sessions(user_id)
  WHERE status = 'active';

-- RLS: users can only access their own sessions
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.game_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.game_sessions FOR UPDATE
  USING (auth.uid() = user_id);
