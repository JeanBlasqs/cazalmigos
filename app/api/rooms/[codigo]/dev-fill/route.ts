import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server/api";
import type { Player, Team } from "@/lib/game/types";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  if (process.env.NODE_ENV === "production") {
    return jsonError("Rota de teste indisponivel em producao.", 403);
  }

  const { codigo } = await params;
  const supabase = createServerSupabaseClient();
  const { data: room } = await supabase.from("rooms").select("*").eq("code", codigo.toUpperCase()).maybeSingle();
  if (!room) return jsonError("Sala nao encontrada.", 404);

  const { data: existingPlayers } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", room.id)
    .order("created_at", { ascending: true })
    .returns<Player[]>();

  const players = existingPlayers ?? [];
  const teamCounts: Record<Team, number> = {
    a: players.filter((player) => player.team === "a").length,
    b: players.filter((player) => player.team === "b").length,
  };
  const neededPlayers: Array<{ name: string; team: Team }> = [];

  for (const team of ["a", "b"] as Team[]) {
    while (teamCounts[team] + neededPlayers.filter((player) => player.team === team).length < 2) {
      const number = teamCounts[team] + neededPlayers.filter((player) => player.team === team).length + 1;
      neededPlayers.push({ name: `Teste ${team.toUpperCase()}${number}`, team });
    }
  }

  const inserts = neededPlayers.map((testPlayer) => ({
      room_id: room.id,
      name: testPlayer.name,
      team: testPlayer.team,
      is_host: false,
      connected: true,
      chips: 10,
      avatar: `/avatars/${testPlayer.team}${testPlayer.name.endsWith("2") ? "2" : "1"}`,
      ready: true,
      reconnect_token: crypto.randomUUID(),
    }));

  if (inserts.length > 0) {
    const { error } = await supabase.from("players").insert(inserts);
    if (error) return jsonError(error.message, 500);
  }

  const { data: updatedPlayers } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", room.id)
    .order("created_at", { ascending: true });

  return Response.json({ players: updatedPlayers ?? [] });
}
