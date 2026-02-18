-- ============================================================
-- LEADERBOARD (denormalized for fast reads)
-- ============================================================
CREATE TABLE public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,

  -- Denormalized fields for fast display
  username TEXT NOT NULL,
  display_name TEXT,

  -- Score data
  net_worth BIGINT NOT NULL,
  final_cash BIGINT NOT NULL,
  final_bank BIGINT NOT NULL,
  final_debt BIGINT NOT NULL,
  final_day INTEGER NOT NULL,
  game_mode TEXT NOT NULL DEFAULT '30',

  -- Server validation flag
  validated BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Primary leaderboard query: ranked by net worth within a game mode
CREATE INDEX idx_leaderboard_ranking
  ON public.leaderboard(game_mode, net_worth DESC, created_at ASC)
  WHERE validated = true;

-- Search by username
CREATE INDEX idx_leaderboard_username
  ON public.leaderboard USING gin (username gin_trgm_ops);

-- User's best scores
CREATE INDEX idx_leaderboard_user
  ON public.leaderboard(user_id, game_mode, net_worth DESC);

-- RLS: public read for validated entries, server-only write
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Validated leaderboard entries are viewable by everyone"
  ON public.leaderboard FOR SELECT
  USING (validated = true);

-- INSERT/UPDATE restricted to service_role (Server Actions use service_role key)
-- No INSERT/UPDATE policies for anon/authenticated = they can't write directly
