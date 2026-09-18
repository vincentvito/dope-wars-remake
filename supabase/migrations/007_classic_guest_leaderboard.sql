BEGIN;

-- Guest Classic scores have a private browser identity, never an auth account.
-- Existing authenticated sessions, scores and Pro access keep their policies.
ALTER TABLE public.game_sessions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.game_sessions ADD COLUMN guest_id uuid;
ALTER TABLE public.game_sessions ADD CONSTRAINT game_session_score_owner CHECK (
  (user_id IS NOT NULL AND guest_id IS NULL) OR
  (user_id IS NULL AND guest_id IS NOT NULL AND game_mode = '30' AND status = 'completed')
);
CREATE INDEX idx_game_sessions_guest_recent ON public.game_sessions(guest_id, completed_at)
  WHERE guest_id IS NOT NULL;
CREATE UNIQUE INDEX idx_game_sessions_guest_run ON public.game_sessions(guest_id, seed, game_mode)
  WHERE guest_id IS NOT NULL;

ALTER TABLE public.leaderboard ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.leaderboard ADD COLUMN is_guest boolean GENERATED ALWAYS AS (user_id IS NULL) STORED;
ALTER TABLE public.leaderboard ADD CONSTRAINT guest_leaderboard_classic CHECK (user_id IS NOT NULL OR game_mode = '30');

-- RLS still denies direct guest writes and all guest-session reads.
-- Only the server's replay-validated action can call this transaction.
CREATE OR REPLACE FUNCTION public.record_game_score(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  session_id uuid;
  player_id uuid := (payload->>'user_id')::uuid;
  guest_player_id uuid := (payload->>'guest_id')::uuid;
BEGIN
  IF (player_id IS NULL) = (guest_player_id IS NULL) THEN
    RAISE EXCEPTION 'invalid_score_identity';
  END IF;
  IF guest_player_id IS NOT NULL AND (payload->>'game_mode' IS DISTINCT FROM '30'
    OR payload->>'username' IS NULL OR payload->>'username' !~ '^[a-zA-Z0-9_-]{3,20}$') THEN
    RAISE EXCEPTION 'invalid_guest_score';
  END IF;
  -- Serialize all submissions by this guest so the hourly limit is atomic.
  PERFORM pg_advisory_xact_lock(hashtextextended(
    CASE WHEN guest_player_id IS NOT NULL THEN 'guest:' || guest_player_id::text
    ELSE player_id::text || ':' || (payload->>'seed') || ':' || (payload->>'game_mode') END, 0));
  SELECT id INTO session_id FROM public.game_sessions
    WHERE user_id IS NOT DISTINCT FROM player_id AND guest_id IS NOT DISTINCT FROM guest_player_id AND seed = payload->>'seed' AND game_mode = payload->>'game_mode' AND status = 'completed'
    ORDER BY started_at LIMIT 1;
  IF session_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.leaderboard WHERE game_session_id = session_id AND validated) THEN
    RETURN session_id;
  END IF;
  -- Retrying a saved result above does not consume another submission.
  IF guest_player_id IS NOT NULL AND (SELECT count(*) FROM public.game_sessions
    WHERE guest_id = guest_player_id AND completed_at > now() - interval '1 hour') >= 10 THEN
    RAISE EXCEPTION 'guest_score_limit';
  END IF;
  -- Repair pre-migration partial submissions using freshly replayed server results.
  IF session_id IS NULL THEN
    INSERT INTO public.game_sessions(user_id, guest_id, seed, game_mode, status)
      VALUES(player_id, guest_player_id, payload->>'seed', payload->>'game_mode', 'completed') RETURNING id INTO session_id;
  END IF;
  UPDATE public.game_sessions SET
    action_log = payload->'action_log', final_cash = (payload->>'final_cash')::bigint,
    final_bank = (payload->>'final_bank')::bigint, final_debt = (payload->>'final_debt')::bigint,
    final_inventory_value = (payload->>'final_inventory_value')::bigint,
    final_net_worth = (payload->>'final_net_worth')::bigint, final_day = (payload->>'final_day')::integer,
    completed_at = now(), best_trade_profit = (payload->>'best_trade_profit')::bigint,
    best_trade_drug = payload->>'best_trade_drug', worst_trade_loss = (payload->>'worst_trade_loss')::bigint,
    worst_trade_drug = payload->>'worst_trade_drug', drug_trade_counts = payload->'drug_trade_counts',
    biggest_mugging = (payload->>'biggest_mugging')::bigint
    WHERE id = session_id;
  INSERT INTO public.leaderboard(user_id, game_session_id, username, display_name, net_worth, final_cash, final_bank, final_debt, final_day, game_mode, validated)
    VALUES(player_id, session_id, payload->>'username', payload->>'display_name', (payload->>'final_net_worth')::bigint,
      (payload->>'final_cash')::bigint, (payload->>'final_bank')::bigint, (payload->>'final_debt')::bigint,
      (payload->>'final_day')::integer, payload->>'game_mode', true);
  RETURN session_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_game_score(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_game_score(jsonb) TO service_role;
COMMIT;
