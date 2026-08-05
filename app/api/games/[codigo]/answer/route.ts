import { aplicarBonusDeAcerto, aplicarPerdaDeFichas, proximoTime, resolverRodada } from "@/lib/game/rules";
import type { Game, Player, Team } from "@/lib/game/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server/api";
import { answerSchema, parseJson } from "@/lib/validation/schemas";

function gamePosition(game: Game, team: Team) {
  return team === "a" ? game.team_a_position : game.team_b_position;
}

function nextRoundPlayers(players: Player[], team: Team) {
  const teamPlayers = players.filter((player) => player.team === team);
  return [teamPlayers[0], teamPlayers[1]];
}

async function createNextQuestion(supabase: ReturnType<typeof createServerSupabaseClient>, roomId: string, moveCount: number) {
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const body = await request.json().catch(() => null);
  const { data, error } = parseJson(answerSchema, body);
  if (error || !data) return jsonError("Resposta ou aposta invalida.");

  const supabase = createServerSupabaseClient();
  const { data: room } = await supabase.from("rooms").select("*").eq("code", codigo.toUpperCase()).maybeSingle();
  if (!room) return jsonError("Sala nao encontrada.", 404);

  const { data: game } = await supabase.from("games").select("*").eq("room_id", room.id).maybeSingle<Game>();
  if (!game) return jsonError("Partida nao iniciada.", 404);
  if (game.status !== "aguardando_respostas") return jsonError("A rodada nao esta recebendo respostas.", 409);

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", data.playerId)
    .eq("room_id", room.id)
    .maybeSingle<Player>();
  if (!player) return jsonError("Jogador nao encontrado.", 404);
  if (player.team !== game.current_team) return jsonError("Nao e a vez da sua equipe.", 403);
  if (data.bet > player.chips) return jsonError("Aposta maior que suas fichas atuais.", 400);

  const slot =
    player.id === game.player_1_id ? 1 : player.id === game.player_2_id ? 2 : null;
  if (!slot) return jsonError("Voce nao participa desta rodada.", 403);
  if ((slot === 1 && game.answer_1_at) || (slot === 2 && game.answer_2_at)) {
    return jsonError("Voce ja respondeu esta rodada.", 409);
  }

  const partialUpdate =
    slot === 1
      ? { answer_1: data.answer, bet_1: data.bet, answer_1_at: new Date().toISOString() }
      : { answer_2: data.answer, bet_2: data.bet, answer_2_at: new Date().toISOString() };

  const { data: updatedGame, error: updateError } = await supabase
    .from("games")
    .update({ ...partialUpdate, version: game.version + 1, updated_at: new Date().toISOString() })
    .eq("id", game.id)
    .eq("version", game.version)
    .select("*")
    .single<Game>();

  if (updateError || !updatedGame) return jsonError("Conflito de rodada. Sincronize e tente de novo.", 409);

  if (!updatedGame.answer_1 || !updatedGame.answer_2 || updatedGame.bet_1 === null || updatedGame.bet_2 === null) {
    return Response.json({ status: "aguardando_parceiro" });
  }

  const { data: players } = await supabase.from("players").select("*").eq("room_id", room.id).returns<Player[]>();
  const player1 = players?.find((p) => p.id === updatedGame.player_1_id);
  const player2 = players?.find((p) => p.id === updatedGame.player_2_id);
  if (!players || !player1 || !player2) return jsonError("Jogadores da rodada nao encontrados.", 500);

  const result = resolverRodada({
    answer1: updatedGame.answer_1,
    answer2: updatedGame.answer_2,
    bet1: updatedGame.bet_1,
    bet2: updatedGame.bet_2,
    currentPosition: gamePosition(updatedGame, updatedGame.current_team),
    boardSize: updatedGame.board_size,
  });

  let penaltySkipTeam: Team | null = null;

  if (!result.correct) {
    const player1Loss = aplicarPerdaDeFichas(player1.chips, updatedGame.bet_1);
    const player2Loss = aplicarPerdaDeFichas(player2.chips, updatedGame.bet_2);
    penaltySkipTeam = player1Loss.zerou || player2Loss.zerou ? updatedGame.current_team : null;

    await Promise.all([
      supabase
        .from("players")
        .update({ chips: player1Loss.chips })
        .eq("id", player1.id),
      supabase
        .from("players")
        .update({ chips: player2Loss.chips })
        .eq("id", player2.id),
    ]);
  }
  if (result.correct) {
    await Promise.all([
      supabase
        .from("players")
        .update({ chips: aplicarBonusDeAcerto(player1.chips, updatedGame.bet_1) })
        .eq("id", player1.id),
      supabase
        .from("players")
        .update({ chips: aplicarBonusDeAcerto(player2.chips, updatedGame.bet_2) })
        .eq("id", player2.id),
    ]);
  }
  if (result.correct && result.special?.restoreChips) {
    await Promise.all([
      supabase.from("players").update({ chips: 10 }).eq("id", player1.id),
      supabase.from("players").update({ chips: 10 }).eq("id", player2.id),
    ]);
  }

  const skipTeam =
    penaltySkipTeam ??
    (result.special && "skipTurn" in result.special ? updatedGame.current_team : game.skip_team);

  await supabase.from("moves").insert({
    game_id: updatedGame.id,
    team: updatedGame.current_team,
    question_id: updatedGame.current_question_id,
    player_1_id: player1.id,
    player_2_id: player2.id,
    bet_1: updatedGame.bet_1,
    bet_2: updatedGame.bet_2,
    answer_1: updatedGame.answer_1,
    answer_2: updatedGame.answer_2,
    correct: result.correct,
    spaces_moved: result.spacesMoved,
    special_effect: penaltySkipTeam
      ? "penalty_skip:zerou fichas"
      : result.special
        ? `${result.special.kind}:${result.special.label}`
        : null,
  });

  const finalStatus = result.winner ? "finalizado" : "revelada";
  const positionUpdate =
    updatedGame.current_team === "a"
      ? { team_a_position: result.nextPosition }
      : { team_b_position: result.nextPosition };

  await supabase
    .from("games")
    .update({
      ...positionUpdate,
      status: finalStatus,
      winner_team: result.winner ? updatedGame.current_team : null,
      skip_team: skipTeam,
      version: updatedGame.version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", updatedGame.id)
    .eq("version", updatedGame.version);

  if (result.winner) {
    await supabase.from("rooms").update({ status: "finalizado" }).eq("id", room.id);
  } else {
    const candidateTeam = proximoTime(updatedGame.current_team);
    const nextTeam = skipTeam === candidateTeam ? proximoTime(candidateTeam) : candidateTeam;
    const [nextPlayer1, nextPlayer2] = nextRoundPlayers(players, nextTeam);
    const { count } = await supabase.from("moves").select("id", { count: "exact", head: true }).eq("game_id", game.id);
    const nextQuestion = await createNextQuestion(supabase, room.id, count ?? 0);

    setTimeout(async () => {
      await supabase
        .from("games")
        .update({
          status: "aguardando_respostas",
          current_team: nextTeam,
          skip_team: skipTeam === candidateTeam ? null : skipTeam,
          current_question_id: nextQuestion.id,
          player_1_id: nextPlayer1.id,
          player_2_id: nextPlayer2.id,
          bet_1: null,
          bet_2: null,
          answer_1: null,
          answer_2: null,
          answer_1_at: null,
          answer_2_at: null,
          version: updatedGame.version + 2,
          updated_at: new Date().toISOString(),
        })
        .eq("id", updatedGame.id)
        .eq("version", updatedGame.version + 1);
    }, 2500);
  }

  return Response.json({ status: finalStatus, result });
}
