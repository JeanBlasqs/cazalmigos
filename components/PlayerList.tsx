import type { Player, Team } from "@/lib/game/types";
import { ChipsBadge } from "./ChipsBadge";
import { AvatarPortrait } from "./AvatarPortrait";

function labelTime(team: Team | null) {
  if (team === "a") return "Lado vermelho";
  if (team === "b") return "Lado azul";
  return "Sem lado";
}

export function PlayerList({
  players,
  onlineIds = [],
  compact = false,
}: {
  players: Player[];
  onlineIds?: string[];
  compact?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {players.map((player) => (
        <div key={player.id} className={`rounded-lg border border-zinc-200 bg-white text-zinc-950 shadow-sm ${compact ? "p-2" : "p-4"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <AvatarPortrait player={player} size={compact ? 34 : 46} />
              <div>
                <p className="font-semibold text-zinc-950">{player.name}</p>
                <p className="text-sm text-zinc-500">
                  {labelTime(player.team)}
                  {player.is_host ? " - host" : ""}
                  {player.ready ? " - pronto" : ""}
                </p>
              </div>
            </div>
            <span
              className={`mt-1 h-2.5 w-2.5 rounded-full ${
                onlineIds.includes(player.id) || player.connected ? "bg-emerald-500" : "bg-zinc-300"
              }`}
              title={onlineIds.includes(player.id) || player.connected ? "Online" : "Desconectado"}
            />
          </div>
          {!compact && <div className="mt-3">
            <ChipsBadge player={player} />
          </div>}
        </div>
      ))}
    </div>
  );
}
