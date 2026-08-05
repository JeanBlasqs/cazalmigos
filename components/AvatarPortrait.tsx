import type { Player } from "@/lib/game/types";

function avatarTheme(avatar?: string | null) {
  if (avatar === "avatar-1") return { hair: "#d97706", skin: "#f7c6a3", shirt: "#111827", accent: "#f9a8d4" };
  if (avatar === "avatar-2") return { hair: "#111827", skin: "#dca37f", shirt: "#c2410c", accent: "#fb7185" };
  if (avatar === "avatar-3") return { hair: "#18181b", skin: "#b77958", shirt: "#111827", accent: "#60a5fa" };
  if (avatar === "avatar-4") return { hair: "#111827", skin: "#a66a4b", shirt: "#0f172a", accent: "#c084fc" };
  if (avatar?.includes("b")) return { hair: "#111827", skin: "#b77958", shirt: "#1d4ed8", accent: "#93c5fd" };
  return { hair: "#111827", skin: "#dca37f", shirt: "#be123c", accent: "#fda4af" };
}

export function AvatarPortrait({
  player,
  size = 56,
}: {
  player: Pick<Player, "avatar" | "name" | "team">;
  size?: number;
}) {
  const theme = avatarTheme(player.avatar);
  const showGlasses = player.avatar === "avatar-3" || player.avatar === "avatar-4";
  const showLongHair = player.avatar === "avatar-1" || player.avatar === "avatar-4";
  const gradientId = `avatar-bg-${(player.avatar ?? player.name).replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label={player.name} className="rounded-full shadow-inner">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={player.team === "b" ? "#bfdbfe" : "#fecdd3"} />
          <stop offset="100%" stopColor={theme.accent} />
        </linearGradient>
      </defs>
      <circle cx="48" cy="48" r="48" fill={`url(#${gradientId})`} />
      <path d="M20 88 C24 66 35 56 48 56 C61 56 72 66 76 88Z" fill={theme.shirt} />
      <circle cx="48" cy="42" r="22" fill={theme.skin} />
      {showLongHair ? (
        <path d="M21 47 C17 23 32 10 50 11 C70 13 80 29 75 56 C69 42 67 27 50 25 C35 24 30 35 21 47Z" fill={theme.hair} />
      ) : (
        <path d="M25 37 C27 17 48 10 65 19 C76 25 77 40 72 48 C62 31 43 25 25 37Z" fill={theme.hair} />
      )}
      <circle cx="39" cy="43" r="3" fill="#111827" />
      <circle cx="57" cy="43" r="3" fill="#111827" />
      {showGlasses && (
        <g fill="none" stroke="#111827" strokeWidth="2.2">
          <circle cx="38" cy="43" r="8" />
          <circle cx="58" cy="43" r="8" />
          <path d="M46 43 L50 43" />
        </g>
      )}
      <path d="M39 55 C44 60 52 60 58 55" fill="none" stroke="#7f1d1d" strokeWidth="3" strokeLinecap="round" />
      {player.avatar === "avatar-2" && <path d="M39 51 C45 54 52 54 58 51" stroke="#111827" strokeWidth="2" strokeLinecap="round" />}
      <circle cx="74" cy="25" r="10" fill={player.team === "b" ? "#2563eb" : "#ef4444"} stroke="#fff" strokeWidth="3" />
    </svg>
  );
}
