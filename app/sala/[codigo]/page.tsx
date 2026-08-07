"use client";

import { use, useEffect, useState } from "react";
import type { GameState, Team } from "@/lib/game/types";
import { AnswerBetForm } from "@/components/AnswerBetForm";
import { Board } from "@/components/Board";
import { GameLoader } from "@/components/GameLoader";
import { PlayerTokens } from "@/components/PlayerTokens";
import { QuestionsModal } from "@/components/QuestionsModal";
import { RevealAnswers } from "@/components/RevealAnswers";
import { TeamSelection } from "@/components/TeamSelection";
import { useGameRealtime } from "@/hooks/useGameRealtime";
import { useRoomPresence } from "@/hooks/useRoomPresence";

const emptyState: GameState = { room: null as never, players: [], game: null, question: null, moves: [] };

export default function LobbyPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params);
  const [initial, setInitial] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>();
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [startingGame, setStartingGame] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const { state, refresh } = useGameRealtime(initial ?? emptyState, codigo);
  const onlineIds = useRoomPresence(codigo, playerId);
  const currentState = initial ? state : null;
  const me = currentState?.players.find((player) => player.id === playerId);
  const game = currentState?.game;
  const lastMove = currentState?.moves[0] ?? null;
  const isRoundPlayer = Boolean(me && game && (me.id === game.player_1_id || me.id === game.player_2_id));
  const alreadyAnswered = Boolean(
    me &&
      game &&
      ((me.id === game.player_1_id && game.answer_1_at) || (me.id === game.player_2_id && game.answer_2_at)),
  );

  useEffect(() => {
    setPlayerId(localStorage.getItem(`room:${codigo}:playerId`) ?? undefined);
    setTestMode(localStorage.getItem(`room:${codigo}:testMode`) === "true");
    fetch(`/api/games/${codigo}/state`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setInitial(payload));
  }, [codigo]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroVisible(false), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  async function sortTeams() {
    await fetch(`/api/rooms/${codigo}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    await refresh();
  }

  async function startGame() {
    setBusy(true);
    setNotice(null);
    const response = await fetch(`/api/rooms/${codigo}/start`, { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    if (response.ok) {
      setStartingGame(true);
      window.setTimeout(async () => {
        await refresh();
        setStartingGame(false);
      }, 850);
      return;
    }
    setNotice(payload.error ?? "Revise jogadores, lados e perguntas antes de iniciar.");
    await refresh();
  }

  async function fillTestPlayers() {
    if (!playerId) return;
    setBusy(true);
    setNotice(null);
    const response = await fetch(`/api/rooms/${codigo}/dev-fill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice(payload.error ?? "Nao foi possivel preencher jogadores de teste.");
      setBusy(false);
      return;
    }
    localStorage.setItem(`room:${codigo}:testMode`, "true");
    setTestMode(true);
    await refresh();
    setBusy(false);
  }

  async function updateMe(payload: { team?: Team; ready?: boolean }) {
    if (!playerId) return;
    await fetch(`/api/rooms/${codigo}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, ...payload }),
    });
    await refresh();
  }

  function switchTestPlayer(nextPlayerId: string) {
    localStorage.setItem(`room:${codigo}:playerId`, nextPlayerId);
    setPlayerId(nextPlayerId);
  }

  if (!currentState) {
    return <GameLoader label="Abrindo lobby..." />;
  }

  return (
    <main className={`relative bg-zinc-950 text-white ${game ? "h-screen overflow-hidden p-2" : "min-h-screen overflow-y-auto px-5 py-8"}`}>
      <div className="absolute inset-0 bg-[url('/cazalmigos-hero.png')] bg-cover bg-center" />
      <div className={`absolute inset-0 transition-opacity duration-700 ${introVisible && !game ? "opacity-0" : "opacity-100"} bg-[linear-gradient(90deg,rgba(9,9,11,.94),rgba(9,9,11,.68)_55%,rgba(9,9,11,.45))]`} />
      {introVisible && !game && <div className="absolute inset-0 z-40" />}
      <div className={`relative mx-auto space-y-6 transition-all duration-700 ${introVisible && !game ? "translate-y-8 opacity-0" : "translate-y-0 opacity-100"} ${game ? "max-w-[1800px]" : "max-w-5xl"}`}>
        {!game && (
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-300">Lobby</p>
              <h1 className="text-5xl font-black text-white drop-shadow">Cazalmigos</h1>
              <p className="text-lg font-bold text-rose-50">Codigo {codigo}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {me?.is_host && (
                <>
                  <button onClick={() => setQuestionsOpen(true)} className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-semibold text-zinc-950">
                    Perguntas
                  </button>
                  <button onClick={fillTestPlayers} className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 font-semibold text-sky-900">
                    Preencher teste
                  </button>
                  <button onClick={sortTeams} className="rounded-md border border-zinc-300 bg-white px-4 py-2 font-semibold text-zinc-950">
                    Sortear equipes
                  </button>
                  <button onClick={startGame} disabled={busy} className="rounded-md bg-emerald-500 px-4 py-2 font-black text-white shadow-lg transition hover:bg-emerald-400 disabled:opacity-60">
                    {busy ? "Aguarde..." : "Iniciar"}
                  </button>
                </>
              )}
            </div>
          </header>
        )}

        {notice && (
          <div className="reveal-pop rounded-lg border border-amber-300 bg-amber-50/95 p-4 font-bold text-amber-950 shadow-xl">
            {notice}
          </div>
        )}

        {startingGame && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 backdrop-blur-sm">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-4 border-rose-300 border-t-transparent animate-spin" />
              <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-200">Aguarde</p>
              <h1 className="mt-2 text-3xl font-black text-white">Subindo o tabuleiro...</h1>
            </div>
          </div>
        )}

        {game ? (
          <section className="flex h-[calc(100vh-1rem)] flex-col gap-2 rounded-3xl border border-white/20 bg-white/12 p-2 shadow-2xl backdrop-blur-md">
            <div className="rounded-2xl border border-white/20 bg-white/95 p-2 text-zinc-950 shadow-xl">
              <div className="flex flex-wrap items-stretch gap-2">
                <div className="min-w-[220px] flex-[1] rounded-xl bg-rose-50 p-2">
                  <p className="text-xs font-black uppercase text-rose-700">Sala {codigo}</p>
                  <h2 className="text-lg font-black">
                    Lado {game.current_team === "a" ? "vermelho" : "azul"} joga agora
                  </h2>
                  <p className="text-sm font-bold text-zinc-600">
                    Vermelho {game.team_a_position} - Azul {game.team_b_position}
                  </p>
                </div>
                <div className="min-w-[280px] flex-[1.5] rounded-xl bg-white p-2">
                  <p className="text-xs font-black uppercase text-rose-700">Pergunta</p>
                  <h3 className="text-base font-black leading-snug">{currentState.question?.question ?? "Aguardando pergunta..."}</h3>
                  {alreadyAnswered && <p className="mt-1 text-sm font-black text-emerald-700">Sua resposta foi enviada.</p>}
                  {!isRoundPlayer && <p className="mt-1 text-sm font-bold text-zinc-600">Aguarde a dupla da vez responder.</p>}
                </div>
                {testMode && <label className="min-w-[190px] rounded-xl bg-sky-50 p-2 text-xs font-black uppercase text-sky-900">
                  Testar como
                  <select
                    value={playerId ?? ""}
                    onChange={(event) => switchTestPlayer(event.target.value)}
                    className="mt-1 w-full rounded-md border border-sky-200 bg-white px-2 py-1.5 text-sm font-semibold normal-case text-zinc-950"
                  >
                    {currentState.players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} - {player.team === "a" ? "vermelho" : "azul"}
                      </option>
                    ))}
                  </select>
                </label>}
                {me && isRoundPlayer && game.status === "aguardando_respostas" && (
                  <div className="min-w-[330px] flex-[1.8]">
                    <AnswerBetForm
                      playerId={me.id}
                      chips={me.chips}
                      roomCode={codigo}
                      disabled={alreadyAnswered}
                      onSubmitted={refresh}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="relative min-h-0 flex-1">
              <PlayerTokens players={currentState.players} />
              <Board teamAPosition={game.team_a_position} teamBPosition={game.team_b_position} />
            </div>
            <RevealAnswers
              game={game}
              lastMove={lastMove}
              players={currentState.players}
              question={currentState.question}
              currentPlayerId={playerId}
              roomCode={codigo}
              onValidated={refresh}
            />
          </section>
        ) : (
          <>
            <section className="rounded-xl border border-white/20 bg-white/90 p-5 text-zinc-950 shadow-2xl backdrop-blur">
              <p className="font-semibold">{currentState.players.length}/4 jogadores</p>
              <p className="mt-1 text-sm text-zinc-500">Escolha um lado, marque pronto e espere todos confirmarem. Perguntas ficam todas selecionadas por padrao.</p>
              {me && (
                <button onClick={() => updateMe({ ready: !me.ready })} className="mt-4 rounded-full border-2 border-emerald-300 bg-lime-400 px-6 py-3 font-black text-lime-950 shadow-lg">
                  {me.ready ? "Tirar pronto" : "Estou pronto"}
                </button>
              )}
            </section>
            <TeamSelection
              players={currentState.players}
              currentPlayerId={playerId}
              onJoin={(team) => updateMe({ team, ready: false })}
            />
          </>
        )}
      </div>
      <QuestionsModal roomCode={codigo} open={questionsOpen} onClose={() => setQuestionsOpen(false)} />
    </main>
  );
}
