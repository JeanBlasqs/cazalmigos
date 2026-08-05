import { createServerSupabaseClient } from "@/lib/supabase/server";
import { gerarCodigoSala, jsonError } from "@/lib/server/api";
import { createRoomSchema, parseJson } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { data, error } = parseJson(createRoomSchema, body);
  if (error || !data) return jsonError("Nome invalido.");

  const supabase = createServerSupabaseClient();
  let code = gerarCodigoSala();

  for (let tries = 0; tries < 5; tries++) {
    const { data: existing } = await supabase.from("rooms").select("id").eq("code", code).maybeSingle();
    if (!existing) break;
    code = gerarCodigoSala();
  }

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({ code, status: "aguardando", max_players: 4 })
    .select("*")
    .single();
  if (roomError) return jsonError(roomError.message, 500);

  const { data: player, error: playerError } = await supabase
    .from("players")
    .insert({
      room_id: room.id,
      name: data.playerName,
      team: "a",
      is_host: true,
      connected: true,
      chips: 10,
      avatar: data.avatar ?? "avatar-1",
      ready: false,
      reconnect_token: crypto.randomUUID(),
    })
    .select("*")
    .single();
  if (playerError) return jsonError(playerError.message, 500);

  await supabase.from("rooms").update({ host_player_id: player.id }).eq("id", room.id);

  return Response.json({ room: { ...room, host_player_id: player.id }, player });
}
