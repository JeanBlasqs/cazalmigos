"use client";

import { useEffect, useState } from "react";
import type { Game, Move, Player, Question } from "@/lib/game/types";

export function RevealAnswers({
  game,
  lastMove,
  players,
  question,
  currentPlayerId,
  roomCode,
  onValidated,
}: {
  game: Game;
  lastMove: Move | null;
  players: Player[];
  question: Question | null;
  currentPlayerId?: string;
  roomCode?: string;
  onValidated?: () => void;
}) {
  const [dismissedMoveId, setDismissedMoveId] = useState<string | null>(null);
  const [validationChoice, setValidationChoice] = useState<boolean | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setDismissedMoveId(null);
  }, [lastMove?.id]);

  if (game.status === "validando_respostas") {
    const player1 = players.find((player) => player.id === game.player_1_id);
    const player2 = players.find((player) => player.id === game.player_2_id);
    const currentPlayer = players.find((player) => player.id === currentPlayerId);
    const isPlayer1 = currentPlayerId === game.player_1_id;
    const isPlayer2 = currentPlayerId === game.player_2_id;
    const partner = isPlayer1 ? player2 : isPlayer2 ? player1 : null;
    const partnerAnswer = isPlayer1 ? game.answer_2 : isPlayer2 ? game.answer_1 : null;
    const alreadyValidated = Boolean((isPlayer1 && game.validation_1_at) || (isPlayer2 && game.validation_2_at));

    async function submitValidation() {
      if (!roomCode || !currentPlayerId || validationChoice === null) return;
      setValidating(true);
      setValidationError(null);
      const response = await fetch(`/api/games/${roomCode}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: currentPlayerId, approved: validationChoice }),
      });
      const payload = await response.json().catch(() => ({}));
      setValidating(false);
      if (!response.ok) {
        setValidationError(payload.error ?? "Nao foi possivel validar.");
        return;
      }
      onValidated?.();
    }

    return (
      <div className="fixed inset-0 z-40 grid place-items-center bg-black/45 p-4">
        <section className="reveal-pop relative w-full max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 p-5 text-zinc-950 shadow-2xl">
          <p className="text-sm font-black uppercase text-amber-700">Validacao da dupla</p>
          <h2 className="mt-1 text-xl font-black">{question?.question ?? "Pergunta da rodada"}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/80 p-3">
              <p className="text-sm font-bold text-zinc-600">{player1?.name ?? "Jogador 1"}</p>
              <p className="mt-1 text-lg font-black">{game.answer_1}</p>
              <p className="text-sm text-zinc-500">
                {game.validation_2_at ? "Resposta ja avaliada pelo parceiro" : "Aguardando avaliacao do parceiro"}
              </p>
            </div>
            <div className="rounded-xl bg-white/80 p-3">
              <p className="text-sm font-bold text-zinc-600">{player2?.name ?? "Jogador 2"}</p>
              <p className="mt-1 text-lg font-black">{game.answer_2}</p>
              <p className="text-sm text-zinc-500">
                {game.validation_1_at ? "Resposta ja avaliada pelo parceiro" : "Aguardando avaliacao do parceiro"}
              </p>
            </div>
          </div>
          {partner ? (
            <div className="mt-4 rounded-xl bg-white p-4">
              <p className="text-sm font-bold text-zinc-600">
                {currentPlayer?.name}, avalie a resposta de {partner.name}
              </p>
              <p className="mt-1 text-lg font-black">{partnerAnswer}</p>
              {alreadyValidated ? (
                <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                  Voce ja validou. Aguardando o parceiro, se ainda faltar.
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setValidationChoice(true)}
                    className={`rounded-full px-5 py-3 text-lg font-black ${validationChoice === true ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-800"}`}
                  >
                    Check
                  </button>
                  <button
                    onClick={() => setValidationChoice(false)}
                    className={`rounded-full px-5 py-3 text-lg font-black ${validationChoice === false ? "bg-red-600 text-white" : "bg-red-100 text-red-800"}`}
                  >
                    X
                  </button>
                  <button
                    onClick={submitValidation}
                    disabled={validationChoice === null || validating}
                    className="rounded-full bg-zinc-950 px-5 py-3 text-lg font-black text-white disabled:bg-zinc-300"
                  >
                    {validating ? "Confirmando..." : "Confirmar"}
                  </button>
                </div>
              )}
              {validationError && <p className="mt-3 text-sm font-bold text-red-600">{validationError}</p>}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-white p-4 text-sm font-bold text-zinc-600">
              Aguardando a dupla da vez validar as respostas.
            </p>
          )}
        </section>
      </div>
    );
  }

  if (game.status === "finalizado") {
    const winnerName = game.winner_team === "a" ? "vermelho" : "azul";

    return (
      <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-black/55 p-4 backdrop-blur-sm">
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 42 }, (_, index) => (
            <span
              key={index}
              className="confetti-piece"
              style={{
                left: `${(index * 37) % 100}%`,
                animationDelay: `${(index % 9) * 0.12}s`,
                backgroundColor: ["#fb7185", "#38bdf8", "#facc15", "#34d399", "#f472b6", "#ffffff"][index % 6],
              }}
            />
          ))}
        </div>
        <section className="reveal-pop relative w-full max-w-xl rounded-3xl border border-amber-200 bg-white p-6 text-center text-zinc-950 shadow-2xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-600">Fim de jogo</p>
          <h2 className="mt-2 text-4xl font-black text-rose-600">Parabens, equipe {winnerName}!</h2>
          <p className="mt-3 text-lg font-bold text-zinc-700">
            Voces chegaram ao final do tabuleiro. Sala {roomCode}
          </p>
          {lastMove && (
            <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">
              Ultima rodada: {lastMove.correct ? `avancou ${lastMove.spaces_moved} casas` : "sem avanco"}.
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="/"
              className="rounded-full bg-zinc-950 px-5 py-3 font-black text-white shadow-lg transition hover:bg-zinc-800"
            >
              Voltar para tela inicial
            </a>
            {roomCode && (
              <a
                href={`/sala/${roomCode}`}
                className="rounded-full border-2 border-rose-300 bg-rose-50 px-5 py-3 font-black text-rose-700 shadow-lg transition hover:bg-rose-100"
              >
                Voltar ao menu da sala {roomCode}
              </a>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (game.status !== "revelada" || !lastMove || dismissedMoveId === lastMove.id) {
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
            Casa especial ativada: {lastMove.special_effect.split("|").map((effect) => effect.replace("penalty_skip", "pular rodada").replace("heart", "coracao").replace("bomb", "volta ao inicio").replace("chips", "fichas").replace("skip", "gelo")).join(" + ")}
          </p>
        )}
      </section>
    </div>
  );
}
