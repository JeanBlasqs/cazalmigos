import { aplicarBonusDeAcerto, aplicarPerdaDeFichas, resolverRodada } from "@/lib/game/rules";
import type { Game, Player, Team } from "@/lib/game/types";
import { jsonError } from "@/lib/server/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseJson, validateAnswerSchema } from "@/lib/validation/schemas";

function gamePosition(game: Game, team: Team) {
  return team === "a" ? game.team_a_position : game.team_b_position;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const body = await request.json().catch(() => null);
  const { data, error } = parseJson(validateAnswerSchema, body);
  if (error || !data) return jsonError("Validacao invalida.");

  const supabase = createServerSupabaseClient();
  const { data: room } = await supabase.from("rooms").select("*").eq("code", codigo.toUpperCase()).maybeSingle();
  if (!room) return jsonError("Sala nao encontrada.", 404);

  const { data: game } = await supabase.from("games").select("*").eq("room_id", room.id).maybeSingle<Game>();
  if (!game) return jsonError("Partida nao iniciada.", 404);
  if (game.status !== "validando_respostas") return jsonError("A rodada nao esta em validacao.", 409);

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", data.playerId)
    .eq("room_id", room.id)
    .maybeSingle<Player>();
  if (!player) return jsonError("Jogador nao encontrado.", 404);
  if (player.team !== game.current_team) return jsonError("Somente a dupla da vez valida as respostas.", 403);

  const slot = player.id === game.player_1_id ? 1 : player.id === game.player_2_id ? 2 : null;
  if (!slot) return jsonError("Voce nao participa desta rodada.", 403);
  if ((slot === 1 && game.validation_1_at) || (slot === 2 && game.validation_2_at)) {
    return jsonError("Voce ja validou esta rodada.", 409);
  }

  const validationUpdate =
    slot === 1
      ? { validation_1: data.approved, validation_1_at: new Date().toISOString() }
      : { validation_2: data.approved, validation_2_at: new Date().toISOString() };

  const { data: updatedGame, error: updateError } = await supabase
    .from("games")
    .update({ ...validationUpdate, version: game.version + 1, updated_at: new Date().toISOString() })
    .eq("id", game.id)
    .eq("version", game.version)
    .select("*")
    .single<Game>();
  if (updateError || !updatedGame) return jsonError("Conflito de validacao. Sincronize e tente de novo.", 409);

  if (updatedGame.validation_1 === null || updatedGame.validation_2 === null) {
    return Response.json({ status: "aguardando_validacao_parceiro" });
  }

  const { data: players } = await supabase.from("players").select("*").eq("room_id", room.id).returns<Player[]>();
  const player1 = players?.find((p) => p.id === updatedGame.player_1_id);
  const player2 = players?.find((p) => p.id === updatedGame.player_2_id);
  if (!players || !player1 || !player2) return jsonError("Jogadores da rodada nao encontrados.", 500);
  if (!updatedGame.answer_1 || !updatedGame.answer_2 || updatedGame.bet_1 === null || updatedGame.bet_2 === null) {
    return jsonError("Respostas da rodada incompletas.", 409);
  }

  const manuallyApproved = updatedGame.validation_1 && updatedGame.validation_2;
  const result = resolverRodada({
    answer1: updatedGame.answer_1,
    answer2: updatedGame.answer_2,
    bet1: updatedGame.bet_1,
    bet2: updatedGame.bet_2,
    currentPosition: gamePosition(updatedGame, updatedGame.current_team),
    boardSize: updatedGame.board_size,
    correctOverride: manuallyApproved,
  });

  let penaltySkipTeam: Team | null = null;

  if (!result.correct) {
    const player1Loss = aplicarPerdaDeFichas(player1.chips, updatedGame.bet_1);
    const player2Loss = aplicarPerdaDeFichas(player2.chips, updatedGame.bet_2);
    penaltySkipTeam = player1Loss.zerou || player2Loss.zerou ? updatedGame.current_team : null;

    await Promise.all([
      supabase.from("players").update({ chips: player1Loss.chips }).eq("id", player1.id),
      supabase.from("players").update({ chips: player2Loss.chips }).eq("id", player2.id),
    ]);
  }

  if (result.correct) {
    await Promise.all([
      supabase.from("players").update({ chips: aplicarBonusDeAcerto(player1.chips, updatedGame.bet_1) }).eq("id", player1.id),
      supabase.from("players").update({ chips: aplicarBonusDeAcerto(player2.chips, updatedGame.bet_2) }).eq("id", player2.id),
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
  }

  return Response.json({ status: finalStatus, result });
}
