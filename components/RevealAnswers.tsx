"use client";

import { useEffect, useState } from "react";
import type { Game, Move, Player, Question } from "@/lib/game/types";

export function RevealAnswers({
  game,
  lastMove,
  players,
  question,
}: {
  game: Game;
  lastMove: Move | null;
  players: Player[];
  question: Question | null;
}) {
  const [dismissedMoveId, setDismissedMoveId] = useState<string | null>(null);

  useEffect(() => {
    setDismissedMoveId(null);
  }, [lastMove?.id]);

  if ((game.status !== "revelada" && game.status !== "finalizado") || !lastMove || dismissedMoveId === lastMove.id) {
    return null;
  }

  const player1 = players.find((player) => player.id === game.player_1_id);
  const player2 = players.find((player) => player.id === game.player_2_id);
  const correct = lastMove.correct;
  const isPenaltySkip = lastMove.special_effect?.startsWith("penalty_skip");

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/45 p-4">
      <section className={`reveal-pop relative w-full max-w-2xl rounded-2xl border p-5 text-zinc-950 shadow-2xl ${correct ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
        <button
          onClick={() => setDismissedMoveId(lastMove.id)}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-black text-zinc-900 shadow"
          aria-label="Fechar revelacao"
        >
          X
        </button>
        <p className="text-sm font-black uppercase text-zinc-500">Revelacao</p>
        <h2 className="mt-1 pr-10 text-xl font-black">{question?.question ?? "Pergunta da rodada"}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white/75 p-3">
            <p className="text-sm font-bold text-zinc-600">{player1?.name ?? "Jogador 1"}</p>
            <p className="mt-1 text-lg font-black">{game.answer_1}</p>
            <p className="text-sm text-zinc-500">Aposta: {game.bet_1}</p>
          </div>
          <div className="rounded-xl bg-white/75 p-3">
            <p className="text-sm font-bold text-zinc-600">{player2?.name ?? "Jogador 2"}</p>
            <p className="mt-1 text-lg font-black">{game.answer_2}</p>
            <p className="text-sm text-zinc-500">Aposta: {game.bet_2}</p>
          </div>
        </div>
        <p className={`mt-4 text-lg font-black ${correct ? "text-emerald-700" : "text-red-600"}`}>
          {correct
            ? `Respostas bateram. A equipe andou ${lastMove.spaces_moved} casas e ganhou metade da aposta em fichas.`
            : "Respostas diferentes. Cada jogador perdeu a propria aposta."}
        </p>
        {isPenaltySkip && (
          <p className="mt-2 rounded-md bg-red-100 px-3 py-2 text-sm font-bold text-red-800">
            Alguem zerou as fichas. A equipe passa a proxima vez, e apenas quem zerou volta para 10 fichas.
          </p>
        )}
        {lastMove.special_effect && (
          <p className="mt-2 rounded-md bg-white/80 px-3 py-2 text-sm font-bold text-zinc-700">
            Casa especial ativada: {lastMove.special_effect.replace("penalty_skip", "pular rodada").replace("heart", "coracao").replace("bomb", "drama").replace("chips", "fichas").replace("skip", "gelo")}
          </p>
        )}
      </section>
    </div>
  );
}
