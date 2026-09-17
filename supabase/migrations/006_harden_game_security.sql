BEGIN;

-- RLS limits rows, not columns. Only the server can grant Pro or create profiles.
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (username, display_name, avatar_url) ON public.profiles TO authenticated;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Client saves cannot forge completed sessions or overwrite validated results.
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.game_sessions;
CREATE POLICY "Users can insert active saves" ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'active' AND final_net_worth IS NULL AND completed_at IS NULL);
CREATE POLICY "Users can update active saves" ON public.game_sessions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'active')
  WITH CHECK (auth.uid() = user_id AND status = 'active' AND final_net_worth IS NULL AND completed_at IS NULL);

-- Atomic and idempotent: a retry cannot leave an orphan session or duplicate score.
CREATE OR REPLACE FUNCTION public.record_game_score(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  session_id uuid;
  player_id uuid := (payload->>'user_id')::uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(player_id::text || ':' || (payload->>'seed') || ':' || (payload->>'game_mode'), 0));
  SELECT id INTO session_id FROM public.game_sessions
    WHERE user_id = player_id AND seed = payload->>'seed' AND game_mode = payload->>'game_mode' AND status = 'completed'
    ORDER BY started_at LIMIT 1;
  IF session_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.leaderboard WHERE game_session_id = session_id AND validated) THEN
    RETURN session_id;
  END IF;
  -- Repair pre-migration partial submissions using freshly replayed server results.
  IF session_id IS NULL THEN
    INSERT INTO public.game_sessions(user_id, seed, game_mode, status)
      VALUES(player_id, payload->>'seed', payload->>'game_mode', 'completed') RETURNING id INTO session_id;
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
