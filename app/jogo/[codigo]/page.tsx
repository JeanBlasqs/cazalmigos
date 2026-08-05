"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { GameState } from "@/lib/game/types";
import { AnswerBetForm } from "@/components/AnswerBetForm";
import { Board } from "@/components/Board";
import { PlayerList } from "@/components/PlayerList";
import { RevealAnswers } from "@/components/RevealAnswers";
import { GameLoader } from "@/components/GameLoader";
import { useGameRealtime } from "@/hooks/useGameRealtime";
import { useRoomPresence } from "@/hooks/useRoomPresence";

const emptyState: GameState = { room: null as never, players: [], game: null, question: null, moves: [] };

export default function GamePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params);
  const router = useRouter();
  const [initial, setInitial] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>();
  const { state, refresh } = useGameRealtime(initial ?? emptyState, codigo);
  const currentState = initial ? state : null;
  const onlineIds = useRoomPresence(codigo, playerId);
  const game = currentState?.game;
  const me = currentState?.players.find((player) => player.id === playerId);
  const lastMove = currentState?.moves[0] ?? null;
  const isRoundPlayer = Boolean(me && game && (me.id === game.player_1_id || me.id === game.player_2_id));
  const alreadyAnswered = Boolean(
    me &&
      game &&
      ((me.id === game.player_1_id && game.answer_1_at) || (me.id === game.player_2_id && game.answer_2_at)),
  );

  function switchTestPlayer(nextPlayerId: string) {
    localStorage.setItem(`room:${codigo}:playerId`, nextPlayerId);
    setPlayerId(nextPlayerId);
  }

  useEffect(() => {
    setPlayerId(localStorage.getItem(`room:${codigo}:playerId`) ?? undefined);
    fetch(`/api/games/${codigo}/state`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setInitial(payload));
  }, [codigo]);

  useEffect(() => {
    if (game?.status === "finalizado") router.push(`/jogo/${codigo}/resultado`);
  }, [codigo, game?.status, router]);

  if (!currentState || !game) {
    return <GameLoader label="Montando tabuleiro..." />;
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-5 py-6 text-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_340px]">
        <section className="space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase text-emerald-700">Sala {codigo}</p>
              <h1 className="text-3xl font-black">Equipe {game.current_team.toUpperCase()} joga agora</h1>
            </div>
            <div className="text-right text-sm font-semibold text-zinc-600">
              <p>A: casa {game.team_a_position}</p>
              <p>B: casa {game.team_b_position}</p>
            </div>
          </header>
          <Board teamAPosition={game.team_a_position} teamBPosition={game.team_b_position} />
          <RevealAnswers game={game} lastMove={lastMove} players={currentState.players} question={currentState.question} />
        </section>
        <aside className="space-y-4">
          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold uppercase text-zinc-500">Pergunta</p>
            <h2 className="mt-2 text-xl font-bold">{currentState.question?.question ?? "Aguardando pergunta..."}</h2>
            {alreadyAnswered && <p className="mt-3 text-sm font-semibold text-emerald-700">Sua resposta foi enviada.</p>}
            {!isRoundPlayer && <p className="mt-3 text-sm text-zinc-500">Aguarde a equipe da vez responder.</p>}
          </section>
          <section className="rounded-lg border border-sky-200 bg-sky-50 p-4 shadow-sm">
            <label className="block text-sm font-bold uppercase text-sky-900">
              Testar como
              <select
                value={playerId ?? ""}
                onChange={(event) => switchTestPlayer(event.target.value)}
                className="mt-2 w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-base font-semibold normal-case text-zinc-950"
              >
                {currentState.players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} - Equipe {player.team?.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
          </section>
          {me && isRoundPlayer && game.status === "aguardando_respostas" && (
            <AnswerBetForm
              playerId={me.id}
              chips={me.chips}
              roomCode={codigo}
              disabled={alreadyAnswered}
              onSubmitted={refresh}
            />
          )}
          <PlayerList players={currentState.players} onlineIds={onlineIds} />
        </aside>
      </div>
    </main>
  );
}
