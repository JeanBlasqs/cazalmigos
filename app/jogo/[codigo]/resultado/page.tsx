"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { GameState } from "@/lib/game/types";
import { Board } from "@/components/Board";
import { GameLoader } from "@/components/GameLoader";

export default function ResultPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params);
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    fetch(`/api/games/${codigo}/state`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setState(payload));
  }, [codigo]);

  if (!state?.game) {
    return <GameLoader label="Conferindo resultado..." />;
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase text-emerald-700">Fim de jogo</p>
          <h1 className="mt-2 text-4xl font-black">Equipe {state.game.winner_team?.toUpperCase()} venceu</h1>
          <p className="mt-3 text-zinc-600">Primeira equipe a chegar na casa 50.</p>
          <Link href="/" className="mt-6 inline-flex rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white">
            Nova sala
          </Link>
        </section>
        <Board teamAPosition={state.game.team_a_position} teamBPosition={state.game.team_b_position} />
      </div>
    </main>
  );
}
