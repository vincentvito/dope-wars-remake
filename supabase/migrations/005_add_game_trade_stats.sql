-- ============================================================
-- Add per-game trade statistics columns to game_sessions
-- These are populated at submission time by the stats extractor
-- and aggregated at query time for the Statistics overlay.
-- ============================================================

ALTER TABLE public.game_sessions
  ADD COLUMN best_trade_profit BIGINT DEFAULT 0,
  ADD COLUMN best_trade_drug TEXT,
  ADD COLUMN worst_trade_loss BIGINT DEFAULT 0,
  ADD COLUMN worst_trade_drug TEXT,
  ADD COLUMN drug_trade_counts JSONB DEFAULT '{}',
  ADD COLUMN biggest_mugging BIGINT DEFAULT 0;
