"use client";

import { useEffect, useState } from "react";
import { gerarPercurso } from "@/lib/game/path";

const casas = gerarPercurso();
const pathD = casas.map((casa, index) => `${index === 0 ? "M" : "L"} ${casa.x} ${casa.y}`).join(" ");

function casaStyle(kind: string) {
  if (kind === "start") return { fill: "#ffe4e6", stroke: "#be123c", title: "INICIO" };
  if (kind === "finish") return { fill: "#f8fafc", stroke: "#111827", title: "FINAL" };
  if (kind === "heart") return { fill: "#fecdd3", stroke: "#e11d48", title: "AMOR" };
  if (kind === "bomb") return { fill: "#18181b", stroke: "#020617", title: "DRAMA" };
  if (kind === "skip") return { fill: "#dbeafe", stroke: "#2563eb", title: "GELO" };
  if (kind === "chips") return { fill: "#fef3c7", stroke: "#d97706", title: "FICHAS" };
  return { fill: "#fbcfe8", stroke: "#be185d", title: "" };
}

function SpecialIcon({ kind, x, y, label }: { kind: string; x: number; y: number; label?: string }) {
  if (kind === "chips") {
    return (
      <g transform={`translate(${x - 18} ${y - 18}) scale(.56)`}>
        <ellipse cx="32" cy="46" rx="23" ry="8" fill="#b45309" />
        <rect x="9" y="22" width="46" height="24" rx="8" fill="#f59e0b" />
        <ellipse cx="32" cy="22" rx="23" ry="9" fill="#fde047" stroke="#78350f" strokeWidth="3" />
        <path d="M15 28 C24 34 41 34 50 28" fill="none" stroke="#92400e" strokeWidth="3" />
        <path d="M21 18 C30 14 39 15 48 20" fill="none" stroke="#fff7ad" strokeWidth="4" strokeLinecap="round" />
        <path d="M18 35 L18 45 M28 37 L28 47 M39 36 L39 46 M50 32 L50 42" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }

  if (kind === "skip") {
    return (
      <g transform={`translate(${x} ${y})`} strokeLinecap="round" strokeLinejoin="round">
        <path d="M-17 -2 L-6 -17 L5 -2 L17 -16 L10 4 L18 16 L2 10 L-12 18 L-9 3Z" fill="#93c5fd" stroke="#1d4ed8" strokeWidth="3" />
        <path d="M-6 -17 L-2 -4 L5 -2 M10 4 L2 10" stroke="#eff6ff" strokeWidth="3" />
      </g>
    );
  }

  if (kind === "bomb") {
    return (
      <g transform={`translate(${x} ${y})`}>
        <path d="M-16 2 C-16 -12 -8 -20 4 -20 C16 -20 23 -10 20 4 C18 17 9 22 -3 20 C-12 18 -16 12 -16 2Z" fill="#f8fafc" />
        <circle cx="-6" cy="-3" r="3" fill="#111827" />
        <circle cx="8" cy="-3" r="3" fill="#111827" />
        <path d="M-7 9 L-2 5 L3 10 L8 5 L12 10" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
        <path d="M-2 -20 L-6 -28 M5 -20 L9 -28" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  }

  if (kind === "finish") {
    return (
      <g transform={`translate(${x} ${y})`}>
        <path d="M-15 18 L-15 -20" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
        <path d="M-12 -20 H18 V5 H-12Z" fill="#fff" stroke="#111827" strokeWidth="2" />
        <path d="M-12 -20 H-2 V-10 H-12Z M8 -20 H18 V-10 H8Z M-2 -10 H8 V0 H-2Z M-12 0 H-2 V5 H-12Z M8 0 H18 V5 H8Z" fill="#111827" />
      </g>
    );
  }

  if (kind === "heart") {
    return (
      <g transform={`translate(${x} ${y})`}>
        <path d="M-2 -8 C-10 -22 -30 -10 -22 8 C-16 20 0 27 0 27 C0 27 16 20 22 8 C30 -10 10 -22 2 -8 C0 -11 0 -11 -2 -8Z" fill="#e11d48" stroke="#881337" strokeWidth="2" />
        <text x="0" y="8" textAnchor="middle" className="fill-amber-300 text-[15px] font-black">
          {label}
        </text>
      </g>
    );
  }

  return null;
}

export function Board({
  teamAPosition,
  teamBPosition,
}: {
  teamAPosition: number;
  teamBPosition: number;
}) {
  const [displayA, setDisplayA] = useState(teamAPosition);
  const [displayB, setDisplayB] = useState(teamBPosition);

  useEffect(() => {
    const target = Math.min(teamAPosition, 50);
    if (target === displayA) return;
    const direction = target > displayA ? 1 : -1;
    const timer = window.setTimeout(() => setDisplayA((current) => current + direction), 110);
    return () => window.clearTimeout(timer);
  }, [displayA, teamAPosition]);

  useEffect(() => {
    const target = Math.min(teamBPosition, 50);
    if (target === displayB) return;
    const direction = target > displayB ? 1 : -1;
    const timer = window.setTimeout(() => setDisplayB((current) => current + direction), 110);
    return () => window.clearTimeout(timer);
  }, [displayB, teamBPosition]);

  const posA = casas[Math.min(displayA, 50)];
  const posB = casas[Math.min(displayB, 50)];

  return (
    <div className="board-slide-up relative h-full min-h-[420px] overflow-hidden rounded-2xl border-4 border-rose-200/80 bg-[linear-gradient(135deg,#4c0519,#831843_38%,#1e1b4b)] p-2 shadow-2xl">
      <svg viewBox="0 0 1000 540" className="h-full min-h-[420px] w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Tabuleiro Cazalmigos">
        <defs>
          <radialGradient id="romanticGlow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#fff1f2" stopOpacity=".88" />
            <stop offset="56%" stopColor="#fda4af" stopOpacity=".45" />
            <stop offset="100%" stopColor="#312e81" stopOpacity=".78" />
          </radialGradient>
        </defs>
        <rect x="18" y="20" width="964" height="500" rx="30" fill="url(#romanticGlow)" />
        <path d="M105 86 C270 28 420 82 552 52 C710 16 816 66 916 44" fill="none" stroke="#f9a8d4" strokeWidth="48" opacity=".38" />
        <path d="M70 350 C220 284 355 385 500 326 C620 276 728 360 926 282" fill="none" stroke="#fecdd3" strokeWidth="70" opacity=".42" />
        <path d="M110 474 C286 524 420 464 565 485 C704 508 790 462 925 476" fill="none" stroke="#c4b5fd" strokeWidth="40" opacity=".36" />

        <path d={pathD} fill="none" stroke="#7f1d1d" strokeWidth="84" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
        <path d={pathD} fill="none" stroke="#fb7185" strokeWidth="72" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathD} fill="none" stroke="#fecdd3" strokeWidth="5" strokeDasharray="18 16" strokeLinecap="round" opacity=".8" />

        {casas.map((casa) => {
          const style = casaStyle(casa.kind);
          const isSpecial = casa.kind !== "normal";
          return (
            <g key={casa.index}>
              <rect
                x={casa.x - 35}
                y={casa.y - 32}
                width="70"
                height="64"
                rx="8"
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth="3"
              />
              <line x1={casa.x + 35} y1={casa.y - 30} x2={casa.x + 35} y2={casa.y + 30} stroke="#536b50" opacity=".35" />
              <text x={casa.x - 23} y={casa.y - 15} textAnchor="middle" className={`${casa.kind === "bomb" ? "fill-white" : "fill-zinc-900"} text-[13px] font-black`} opacity=".8">
                {casa.index}
              </text>
              {isSpecial && <SpecialIcon kind={casa.kind} x={casa.x + 4} y={casa.y + 5} label={casa.label} />}
            </g>
          );
        })}

        {posA && (
          <g className="pawn-transition" style={{ transform: `translate(${posA.x - 22}px, ${posA.y - 62}px)` }}>
            <ellipse cx="22" cy="54" rx="19" ry="7" fill="#000" opacity=".25" />
            <circle cx="22" cy="22" r="21" fill="#ef4444" stroke="#fff" strokeWidth="4" />
            <text x="22" y="29" textAnchor="middle" className="fill-white text-[17px] font-black">V</text>
          </g>
        )}
        {posB && (
          <g className="pawn-transition" style={{ transform: `translate(${posB.x + 10}px, ${posB.y - 28}px)` }}>
            <ellipse cx="22" cy="54" rx="19" ry="7" fill="#000" opacity=".25" />
            <circle cx="22" cy="22" r="21" fill="#2563eb" stroke="#fff" strokeWidth="4" />
            <text x="22" y="29" textAnchor="middle" className="fill-white text-[17px] font-black">A</text>
          </g>
        )}
      </svg>
      <div className="absolute left-4 top-4 max-w-[190px] rounded-2xl border border-white/25 bg-black/35 p-3 text-xs font-bold text-white shadow-xl backdrop-blur-sm">
        <p className="mb-2 text-sm font-black uppercase text-rose-100">Legenda</p>
        <div className="space-y-1.5">
          <p><span className="text-rose-200">Casa 6</span> coracao +3 casas</p>
          <p><span className="text-rose-200">Casa 20</span> coracao +7 casas</p>
          <p><span className="text-rose-200">Casa 35</span> coracao +4 casas</p>
          <p><span className="text-amber-200">15, 31, 45</span> recupera fichas</p>
          <p><span className="text-sky-200">11, 24, 38, 47</span> passa a vez</p>
          <p><span className="text-zinc-200">27, 42</span> volta ao inicio</p>
          <p><span className="text-white">50</span> linha de chegada</p>
        </div>
        <div className="mt-3 border-t border-white/20 pt-3">
          <p className="mb-2 text-sm font-black uppercase text-amber-100">Regras</p>
          <div className="space-y-1.5">
            <p>Acertou: ganha metade da aposta em fichas, arredondando para cima.</p>
            <p>Limite maximo: 10 fichas por jogador.</p>
            <p>Zerou fichas: a equipe pula a proxima vez.</p>
            <p>So quem zerou volta para 10 fichas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
