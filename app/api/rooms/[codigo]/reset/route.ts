import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const body = await request.json().catch(() => ({}));
  const playerId = typeof body?.playerId === "string" ? body.playerId : null;
  const supabase = createServerSupabaseClient();

  const { data: room } = await supabase.from("rooms").select("*").eq("code", codigo.toUpperCase()).maybeSingle();
  if (!room) return jsonError("Sala nao encontrada.", 404);

  if (playerId) {
    const { data: player } = await supabase
      .from("players")
      .select("id")
      .eq("id", playerId)
      .eq("room_id", room.id)
      .maybeSingle();
    if (!player) return jsonError("Jogador nao pertence a esta sala.", 403);
  }

  const { data: game } = await supabase.from("games").select("id,status").eq("room_id", room.id).maybeSingle();
  if (game && game.status !== "finalizado") {
    return jsonError("A partida ainda nao terminou.", 409);
  }

  if (game) {
    const { error: deleteError } = await supabase.from("games").delete().eq("id", game.id);
    if (deleteError) return jsonError(deleteError.message, 500);
  }

  await Promise.all([
    supabase.from("rooms").update({ status: "aguardando" }).eq("id", room.id),
    supabase.from("players").update({ ready: false, chips: 10, connected: true }).eq("room_id", room.id),
  ]);

  return Response.json({ status: "aguardando", room: { ...room, status: "aguardando" } });
}
