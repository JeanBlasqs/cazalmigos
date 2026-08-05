"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GameState } from "@/lib/game/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function useGameRealtime(initialState: GameState, roomCode: string) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [state, setState] = useState(initialState);

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/games/${roomCode}/state`, { cache: "no-store" });
    if (!response.ok) return;
    const nextState = (await response.json()) as GameState;
    setState(nextState);
  }, [roomCode]);

  useEffect(() => {
    const channel = supabase
      .channel(`game:${roomCode}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "games" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "moves" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, roomCode, supabase]);

  useEffect(() => {
    if (state.game?.status !== "revelada") return;
    const timer = window.setTimeout(refresh, 2800);
    return () => window.clearTimeout(timer);
  }, [refresh, state.game?.status, state.game?.updated_at]);

  return { state, refresh };
}
