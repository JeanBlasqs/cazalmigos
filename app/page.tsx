"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarPortrait } from "@/components/AvatarPortrait";

const avatarIds = ["avatar-1", "avatar-2", "avatar-3", "avatar-4"];

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [avatar, setAvatar] = useState("avatar-1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroVisible(false), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  async function createRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: name, avatar }),
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Nao foi possivel criar a sala.");
      return;
    }

    localStorage.setItem(`room:${payload.room.code}:playerId`, payload.player.id);
    localStorage.setItem(`room:${payload.room.code}:reconnectToken`, payload.player.reconnect_token);
    router.push(`/sala/${payload.room.code}`);
  }

  async function joinRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const roomCode = code.trim().toUpperCase();
    const reconnectToken = localStorage.getItem(`room:${roomCode}:reconnectToken`) ?? undefined;
    const response = await fetch(`/api/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: name, avatar, reconnectToken }),
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Nao foi possivel entrar.");
      return;
    }

    localStorage.setItem(`room:${payload.room.code}:playerId`, payload.player.id);
    localStorage.setItem(`room:${payload.room.code}:reconnectToken`, payload.player.reconnect_token);
    router.push(`/sala/${payload.room.code}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 px-5 py-8 text-white">
      <div className="absolute inset-0 bg-[url('/cazalmigos-hero.png')] bg-cover bg-center" />
      <div className={`absolute inset-0 transition-opacity duration-700 ${introVisible ? "opacity-0" : "opacity-100"} bg-[linear-gradient(90deg,rgba(9,9,11,.96),rgba(9,9,11,.6)_42%,rgba(9,9,11,.2))]`} />
      {introVisible && <div className="absolute inset-0 z-40" />}
      <div className={`relative mx-auto max-w-6xl transition-all duration-700 ${introVisible ? "translate-y-8 opacity-0" : "translate-y-0 opacity-100"}`}>
        <section className="grid min-h-[calc(100vh-4rem)] items-center gap-8 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-300">Jogo de tabuleiro 2x2</p>
            <h1 className="mt-4 text-6xl font-black leading-none text-white drop-shadow-2xl sm:text-7xl">
              Cazalmigos
            </h1>
            <p className="mt-5 max-w-xl text-xl leading-8 text-rose-50">
              Aposte fichas, combine respostas, desvie dos dramas e abrace o caos romantico do mapa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm font-black">
              <span className="floaty rounded-full bg-rose-500 px-4 py-2">AMOR</span>
              <span className="floaty delay-150 rounded-full bg-amber-400 px-4 py-2 text-amber-950">FICHAS</span>
              <span className="floaty delay-300 rounded-full bg-violet-500 px-4 py-2">DRAMA</span>
            </div>
          </div>
          <div className="space-y-4 rounded-xl border border-white/20 bg-white/90 p-5 text-zinc-950 shadow-2xl backdrop-blur">
            <div>
              <h2 className="text-2xl font-black">Seu personagem</h2>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {avatarIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAvatar(id)}
                    className={`grid h-16 place-items-center rounded-lg shadow-inner ${avatar === id ? "bg-rose-200 ring-2 ring-rose-600" : "bg-zinc-100"}`}
                  >
                    <AvatarPortrait player={{ avatar: id, name: id, team: "a" }} size={54} />
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Criar sala</h2>
              <form onSubmit={createRoom} className="mt-4 space-y-3">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2"
                  required
                />
                <button disabled={loading} className="w-full rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white">
                  Criar sala
                </button>
              </form>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Entrar</h2>
              <form onSubmit={joinRoom} className="mt-4 space-y-3">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Codigo da sala"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 uppercase"
                  required
                />
                <button disabled={loading} className="w-full rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-950">
                  Entrar na sala
                </button>
              </form>
            </div>
            {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
