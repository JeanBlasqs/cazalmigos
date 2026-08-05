import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server/api";
import { joinRoomSchema, parseJson } from "@/lib/validation/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const body = await request.json().catch(() => null);
  const { data, error } = parseJson(joinRoomSchema, body);
  if (error || !data) return jsonError("Dados invalidos.");

  const supabase = createServerSupabaseClient();
  const { data: room } = await supabase.from("rooms").select("*").eq("code", codigo.toUpperCase()).maybeSingle();
  if (!room) return jsonError("Sala nao encontrada.", 404);

  if (data.reconnectToken) {
    const { data: player } = await supabase
      .from("players")
      .update({ connected: true })
      .eq("room_id", room.id)
      .eq("reconnect_token", data.reconnectToken)
      .select("*")
      .maybeSingle();

    if (player) return Response.json({ room, player });
  }

  if (!data.playerName) return jsonError("Informe seu nome.");

  const { count } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("room_id", room.id);
  if ((count ?? 0) >= room.max_players) return jsonError("Sala cheia.", 409);

  const team = (count ?? 0) % 2 === 0 ? "a" : "b";
  const { data: player, error: playerError } = await supabase
    .from("players")
    .insert({
      room_id: room.id,
      name: data.playerName,
      team,
      is_host: false,
      connected: true,
      chips: 10,
      avatar: data.avatar ?? "avatar-2",
      ready: false,
      reconnect_token: crypto.randomUUID(),
    })
    .select("*")
    .single();
  if (playerError) return jsonError(playerError.message, 500);

  return Response.json({ room, player });
}
