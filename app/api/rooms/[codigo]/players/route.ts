import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server/api";
import { parseJson, updatePlayerSchema } from "@/lib/validation/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const body = await request.json().catch(() => null);
  const { data, error } = parseJson(updatePlayerSchema, body);
  if (error || !data) return jsonError("Dados invalidos.");

  const supabase = createServerSupabaseClient();
  const { data: room } = await supabase.from("rooms").select("*").eq("code", codigo.toUpperCase()).maybeSingle();
  if (!room) return jsonError("Sala nao encontrada.", 404);

  const updates: Record<string, string | boolean> = {};
  if (data.team) updates.team = data.team;
  if (data.avatar !== undefined) updates.avatar = data.avatar;
  if (data.ready !== undefined) updates.ready = data.ready;

  const { data: player, error: updateError } = await supabase
    .from("players")
    .update(updates)
    .eq("id", data.playerId)
    .eq("room_id", room.id)
    .select("*")
    .single();
  if (updateError) return jsonError(updateError.message, 500);

  return Response.json({ player });
}
