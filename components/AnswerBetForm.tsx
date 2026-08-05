"use client";

import { useState } from "react";

export function AnswerBetForm({
  playerId,
  chips,
  roomCode,
  disabled,
  onSubmitted,
}: {
  playerId: string;
  chips: number;
  roomCode: string;
  disabled?: boolean;
  onSubmitted?: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [bet, setBet] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDisabled = disabled || loading || submitted;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSubmitted(true);
    setError(null);

    const response = await fetch(`/api/games/${roomCode}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, answer, bet }),
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Nao foi possivel enviar.");
      setSubmitted(false);
      return;
    }

    setAnswer("");
    setBet(1);
    onSubmitted?.();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm">
      <label className="min-w-[220px] flex-1">
        <span className="text-sm font-semibold text-zinc-700">Sua resposta</span>
        <input
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={isDisabled}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          maxLength={120}
          required
        />
      </label>
      <label className="min-w-[170px] flex-1">
        <span className="text-sm font-semibold text-zinc-700">Aposta: {bet}</span>
        <input
          type="range"
          min="1"
          max={Math.max(1, Math.min(10, chips))}
          value={bet}
          onChange={(event) => setBet(Number(event.target.value))}
          disabled={isDisabled}
          className="mt-1 w-full accent-emerald-600"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={isDisabled}
        className="min-h-[42px] rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {loading ? "Enviando..." : submitted || disabled ? "Resposta enviada" : "Enviar aposta e resposta"}
      </button>
    </form>
  );
}
