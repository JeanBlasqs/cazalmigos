import type { Game, Player } from "@/lib/game/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server/api";
import { answerSchema, parseJson } from "@/lib/validation/schemas";

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
      ? { answer_1: data.answer, bet_1: data.bet, answer_1_at: new Date().toISOString(), validation_1: null, validation_2: null, validation_1_at: null, validation_2_at: null }
      : { answer_2: data.answer, bet_2: data.bet, answer_2_at: new Date().toISOString(), validation_1: null, validation_2: null, validation_1_at: null, validation_2_at: null };

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

  const { error: validationStartError } = await supabase
    .from("games")
    .update({
      status: "validando_respostas",
      version: updatedGame.version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", updatedGame.id)
    .eq("version", updatedGame.version);

  if (validationStartError) return jsonError("Nao foi possivel abrir a validacao.", 409);

  return Response.json({ status: "validando_respostas" });
}
