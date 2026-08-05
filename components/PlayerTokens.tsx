import type { Player } from "@/lib/game/types";
import { AvatarPortrait } from "./AvatarPortrait";
import { CoinIcon } from "./CoinIcon";

export function PlayerTokens({ players }: { players: Player[] }) {
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-10 flex max-w-[210px] flex-wrap justify-end gap-2">
      {players.map((player) => (
        <div
          key={player.id}
          className={`pointer-events-auto flex items-center gap-1.5 rounded-full border-2 bg-black/28 px-2 py-1 text-white shadow-xl backdrop-blur-sm ${
            player.team === "b" ? "border-sky-300" : "border-rose-300"
          }`}
          title={`${player.name}: ${player.chips} fichas`}
        >
          <AvatarPortrait player={player} size={34} />
          <CoinIcon size={22} />
          <span className="min-w-4 text-sm font-black">{player.chips}</span>
        </div>
      ))}
    </div>
  );
}
