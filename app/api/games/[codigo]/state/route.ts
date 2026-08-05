import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server/api";
import type { Game } from "@/lib/game/types";

function maskGame(game: Game | null): Game | null {
  if (!game || game.status === "revelada" || game.status === "finalizado") return game;
  return {
    ...game,
    bet_1: game.bet_1 === null ? null : 0,
    bet_2: game.bet_2 === null ? null : 0,
    answer_1: game.answer_1 === null ? null : "",
    answer_2: game.answer_2 === null ? null : "",
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const supabase = createServerSupabaseClient();

  const { data: room } = await supabase.from("rooms").select("*").eq("code", codigo.toUpperCase()).maybeSingle();
  if (!room) return jsonError("Sala nao encontrada.", 404);

  const [{ data: players }, { data: game }, { data: moves }] = await Promise.all([
    supabase.from("players").select("*").eq("room_id", room.id).order("created_at", { ascending: true }),
    supabase.from("games").select("*").eq("room_id", room.id).maybeSingle(),
    supabase
      .from("moves")
      .select("*")
      .in("game_id", (await supabase.from("games").select("id").eq("room_id", room.id)).data?.map((g) => g.id) ?? [])
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const question = game?.current_question_id
    ? (await supabase.from("questions").select("*").eq("id", game.current_question_id).maybeSingle()).data
    : null;

  return Response.json({
    room,
    players: players ?? [],
    game: maskGame(game),
    question,
    moves: moves ?? [],
  });
}
