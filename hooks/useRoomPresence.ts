"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function useRoomPresence(roomCode: string, playerId?: string) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);

  useEffect(() => {
    if (!playerId) return;

    const channel = supabase.channel(`room:${roomCode}`);
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ player_id: string }>();
        const ids = Object.values(state)
          .flat()
          .map((presence) => presence.player_id);
        setOnlineIds([...new Set(ids)]);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ player_id: playerId, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playerId, roomCode, supabase]);

  return onlineIds;
}
