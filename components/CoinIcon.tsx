export function CoinIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <ellipse cx="32" cy="46" rx="23" ry="8" fill="#b45309" />
      <rect x="9" y="22" width="46" height="24" rx="8" fill="#f59e0b" />
      <ellipse cx="32" cy="22" rx="23" ry="9" fill="#fde047" stroke="#78350f" strokeWidth="3" />
      <path d="M15 28 C24 34 41 34 50 28" fill="none" stroke="#92400e" strokeWidth="3" />
      <path d="M21 18 C30 14 39 15 48 20" fill="none" stroke="#fff7ad" strokeWidth="4" strokeLinecap="round" />
      <path d="M18 35 L18 45 M28 37 L28 47 M39 36 L39 46 M50 32 L50 42" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
