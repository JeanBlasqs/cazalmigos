import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server/api";
import type { Player, Team } from "@/lib/game/types";

function pickTeamPlayers(players: Player[], team: Team) {
  return players.filter((player) => player.team === team).slice(0, 2);
}

async function pickQuestion(supabase: ReturnType<typeof createServerSupabaseClient>, roomId: string) {
  const { data: selections } = await supabase
    .from("room_question_selections")
    .select("question_bank_id")
    .eq("room_id", roomId);
  const selectedIds = selections?.map((selection) => selection.question_bank_id) ?? [];

  const query = supabase
    .from("question_bank")
    .select("question, category")
    .eq("active", true)
    .order("created_at", { ascending: true });
  const { data: questions } = selectedIds.length > 0 ? await query.in("id", selectedIds) : await query;
  const first = questions?.[0];

  return {
    question: first?.question ?? "Qual cidade combina mais com a nossa proxima viagem?",
    category: first?.category ?? "base",
  };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const supabase = createServerSupabaseClient();
  const { data: room } = await supabase.from("rooms").select("*").eq("code", codigo.toUpperCase()).maybeSingle();
  if (!room) return jsonError("Sala nao encontrada.", 404);

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", room.id)
    .order("created_at", { ascending: true })
    .returns<Player[]>();
  if (!players) return jsonError("Jogadores nao encontrados.");

  if (pickTeamPlayers(players, "a").length !== 2 || pickTeamPlayers(players, "b").length !== 2) {
    return jsonError("Cada lado precisa ter exatamente 2 jogadores.", 409);
  }
  if (players.some((player) => !player.ready)) {
    return jsonError("Todos os jogadores precisam marcar pronto.", 409);
  }

  const { data: existingGame } = await supabase.from("games").select("*").eq("room_id", room.id).maybeSingle();
  if (existingGame) return Response.json({ game: existingGame });

  const pickedQuestion = await pickQuestion(supabase, room.id);
  const { data: question, error: questionError } = await supabase
    .from("questions")
    .insert({
      room_id: room.id,
      question: pickedQuestion.question,
      mode: "comparativa",
      category: pickedQuestion.category,
    })
    .select("*")
    .single();
  if (questionError) return jsonError(questionError.message, 500);

  const redTeam = pickTeamPlayers(players, "a");
  const { data: game, error: gameError } = await supabase
    .from("games")
    .insert({
      room_id: room.id,
      status: "aguardando_respostas",
      current_team: "a",
      team_a_position: 0,
      team_b_position: 0,
      board_size: 50,
      current_question_id: question.id,
      player_1_id: redTeam[0].id,
      player_2_id: redTeam[1].id,
      version: 0,
    })
    .select("*")
    .single();
  if (gameError) return jsonError(gameError.message, 500);

  await supabase.from("rooms").update({ status: "em_andamento" }).eq("id", room.id);
  await supabase.from("players").update({ chips: 10 }).eq("room_id", room.id);

  return Response.json({ game, question });
}
