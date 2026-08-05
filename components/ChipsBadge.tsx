import type { Player } from "@/lib/game/types";
import { CoinIcon } from "./CoinIcon";

export function ChipsBadge({ player }: { player: Player }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-900">
      <CoinIcon size={18} />
      {player.chips} fichas
    </span>
  );
}
