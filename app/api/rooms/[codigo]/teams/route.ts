import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server/api";
import { parseJson, teamsSchema } from "@/lib/validation/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const body = await request.json().catch(() => ({}));
  const { data, error } = parseJson(teamsSchema, body);
  if (error || !data) return jsonError("Dados invalidos.");

  const supabase = createServerSupabaseClient();
  const { data: room } = await supabase.from("rooms").select("*").eq("code", codigo.toUpperCase()).maybeSingle();
  if (!room) return jsonError("Sala nao encontrada.", 404);

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", room.id)
    .order("created_at", { ascending: true });
  if (!players?.length) return jsonError("Nenhum jogador na sala.");

  if (data.mode === "manual" && data.teams) {
    await Promise.all(
      players.map((player) =>
        data.teams?.[player.id]
          ? supabase.from("players").update({ team: data.teams[player.id] }).eq("id", player.id)
          : Promise.resolve(),
      ),
    );
  } else {
    await Promise.all(
      players.map((player, index) =>
        supabase.from("players").update({ team: index % 2 === 0 ? "a" : "b" }).eq("id", player.id),
      ),
    );
  }

  const { data: updated } = await supabase.from("players").select("*").eq("room_id", room.id);
  return Response.json({ players: updated ?? [] });
}
