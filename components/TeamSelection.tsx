"use client";

import type { Player, Team } from "@/lib/game/types";
import { AvatarPortrait } from "./AvatarPortrait";

function TeamCard({
  title,
  team,
  players,
  currentPlayerId,
  onJoin,
}: {
  title: string;
  team: Team;
  players: Player[];
  currentPlayerId?: string;
  onJoin: (team: Team) => void;
}) {
  const isRed = team === "a";

  return (
    <section className={`rounded-2xl border-4 p-4 shadow-2xl ${isRed ? "border-red-200 bg-red-500/90" : "border-sky-200 bg-sky-500/90"}`}>
      <h2 className="rounded-xl bg-black/35 px-4 py-2 text-center text-2xl font-black text-white">
        {title}
      </h2>
      <div className="mt-4 grid min-h-[210px] gap-3">
        {[0, 1].map((slot) => {
          const player = players[slot];
          return (
            <div key={slot} className="relative overflow-hidden rounded-xl border-2 border-white/60 bg-white/18 p-4 text-white">
              <p className="text-sm font-black uppercase">{slot === 0 ? "Jogador" : "Parceiro"}</p>
              {player ? (
                <div className="mt-3 flex items-center gap-3">
                  <AvatarPortrait player={player} size={64} />
                  <div>
                    <p className="text-xl font-black">{player.name}</p>
                    <p className="text-sm font-bold">{player.ready ? "Pronto" : "Aguardando check"}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-lg font-black opacity-70">Espaco livre</p>
              )}
              {player?.id === currentPlayerId && (
                <span className="absolute right-3 top-3 rounded-full bg-lime-400 px-3 py-1 text-xs font-black text-lime-950">
                  voce
                </span>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={() => onJoin(team)}
        className="mt-4 w-full rounded-full border-2 border-white bg-lime-500 px-4 py-3 text-lg font-black text-lime-950 shadow-lg transition hover:bg-lime-300"
      >
        Entrar neste lado
      </button>
    </section>
  );
}

export function TeamSelection({
  players,
  currentPlayerId,
  onJoin,
}: {
  players: Player[];
  currentPlayerId?: string;
  onJoin: (team: Team) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr_320px]">
      <TeamCard
        title="LADO AZUL"
        team="b"
        players={players.filter((player) => player.team === "b")}
        currentPlayerId={currentPlayerId}
        onJoin={onJoin}
      />
      <section className="rounded-2xl border-4 border-white/25 bg-zinc-950/75 p-6 text-white shadow-2xl backdrop-blur">
        <h2 className="text-center text-2xl font-black">CONFIGURACOES DO JOGO</h2>
        <div className="mt-6 grid gap-4">
          <div className="rounded-xl border-2 border-white/20 bg-white/10 p-5">
            <p className="text-sm font-black uppercase text-rose-200">Modo</p>
            <p className="mt-1 text-2xl font-black">Cazalmigos Classic</p>
            <p className="text-sm font-bold text-zinc-300">4 jogadores, respostas em dupla e fichas individuais.</p>
          </div>
          <div className="rounded-xl border-2 border-white/20 bg-white/10 p-5">
            <p className="text-sm font-black uppercase text-rose-200">Perguntas</p>
            <p className="mt-1 font-bold text-zinc-200">Todas entram por padrao. O host pode abrir Perguntas para personalizar.</p>
          </div>
        </div>
      </section>
      <TeamCard
        title="LADO VERMELHO"
        team="a"
        players={players.filter((player) => player.team === "a")}
        currentPlayerId={currentPlayerId}
        onJoin={onJoin}
      />
    </div>
  );
}
