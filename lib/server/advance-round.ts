import { proximoTime } from "@/lib/game/rules";
import type { Game, Player, Team } from "@/lib/game/types";
import type { createServerSupabaseClient } from "@/lib/supabase/server";

type SupabaseServerClient = ReturnType<typeof createServerSupabaseClient>;

function nextRoundPlayers(players: Player[], team: Team) {
  const teamPlayers = players.filter((player) => player.team === team);
  return [teamPlayers[0], teamPlayers[1]];
}

async function createNextQuestion(supabase: SupabaseServerClient, roomId: string, moveCount: number) {
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
  const { data: bankQuestions } = selectedIds.length > 0 ? await query.in("id", selectedIds) : await query;
  const picked = bankQuestions?.[(moveCount + 1) % Math.max(1, bankQuestions.length)];

  const { data, error } = await supabase
    .from("questions")
    .insert({
      room_id: roomId,
      question: picked?.question ?? "Qual cidade combina mais com a nossa proxima viagem?",
      mode: "comparativa",
      category: picked?.category ?? "base",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function advanceRound(supabase: SupabaseServerClient, game: Game) {
  if (game.status !== "revelada") return game;

  const { data: players } = await supabase.from("players").select("*").eq("room_id", game.room_id).returns<Player[]>();
  if (!players) return game;

  const candidateTeam = proximoTime(game.current_team);
  const nextTeam = game.skip_team === candidateTeam ? proximoTime(candidateTeam) : candidateTeam;
  const [nextPlayer1, nextPlayer2] = nextRoundPlayers(players, nextTeam);
  if (!nextPlayer1 || !nextPlayer2) return game;

  const { count } = await supabase.from("moves").select("id", { count: "exact", head: true }).eq("game_id", game.id);
  const nextQuestion = await createNextQuestion(supabase, game.room_id, count ?? 0);

  const { data: advancedGame } = await supabase
    .from("games")
    .update({
      status: "aguardando_respostas",
      current_team: nextTeam,
      skip_team: game.skip_team === candidateTeam ? null : game.skip_team,
      current_question_id: nextQuestion.id,
      player_1_id: nextPlayer1.id,
      player_2_id: nextPlayer2.id,
      bet_1: null,
      bet_2: null,
      answer_1: null,
      answer_2: null,
      answer_1_at: null,
      answer_2_at: null,
      validation_1: null,
      validation_2: null,
      validation_1_at: null,
      validation_2_at: null,
      version: game.version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", game.id)
    .eq("version", game.version)
    .select("*")
    .maybeSingle<Game>();

  return advancedGame ?? game;
}
