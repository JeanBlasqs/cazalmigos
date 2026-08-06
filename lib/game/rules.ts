import { respostasIguais } from "./normalize";
import { obterCasa } from "./path";
import type { Team } from "./types";

export function limitarPosicao(posicaoAtual: number, casas: number, boardSize = 50) {
  return Math.min(boardSize, posicaoAtual + casas);
}

export function proximoTime(time: Team): Team {
  return time === "a" ? "b" : "a";
}

export function aplicarPerdaDeFichas(fichas: number, aposta: number) {
  const restantes = fichas - aposta;
  return {
    chips: restantes <= 0 ? 10 : restantes,
    zerou: restantes <= 0,
  };
}

export function aplicarBonusDeAcerto(fichas: number, aposta: number) {
  return Math.min(10, fichas + Math.ceil(aposta / 2));
}

export function resolverRodada(input: {
  answer1: string;
  answer2: string;
  bet1: number;
  bet2: number;
  currentPosition: number;
  boardSize?: number;
  correctOverride?: boolean;
}) {
  const correct = input.correctOverride ?? respostasIguais(input.answer1, input.answer2);
  const spacesMoved = correct ? input.bet1 + input.bet2 : 0;
  const nextPosition = correct
    ? limitarPosicao(input.currentPosition, spacesMoved, input.boardSize)
    : input.currentPosition;
  const specials = correct ? aplicarCasasEspeciais(nextPosition, input.boardSize) : [];
  const special = specials.at(-1) ?? null;
  const finalPosition = special?.nextPosition ?? nextPosition;

  return {
    correct,
    spacesMoved,
    nextPosition: finalPosition,
    special,
    specials,
    winner: finalPosition >= (input.boardSize ?? 50),
  };
}

export function aplicarCasasEspeciais(position: number, boardSize = 50) {
  const applied: NonNullable<ReturnType<typeof aplicarCasaEspecial>>[] = [];
  const visited = new Set<number>();
  let currentPosition = position;

  for (let step = 0; step < 6; step++) {
    if (visited.has(currentPosition)) break;
    visited.add(currentPosition);

    const special = aplicarCasaEspecial(currentPosition, boardSize);
    if (!special) break;

    applied.push(special);
    if (special.nextPosition === currentPosition) break;
    currentPosition = special.nextPosition;
  }

  return applied;
}

export function aplicarCasaEspecial(position: number, boardSize = 50) {
  const casa = obterCasa(position);

  if (casa.kind === "heart") {
    return {
      kind: casa.kind,
      label: casa.label ?? "",
      nextPosition: limitarPosicao(position, casa.value ?? 0, boardSize),
      skipTeam: null as Team | null,
      restoreChips: false,
    };
  }

  if (casa.kind === "bomb") {
    return {
      kind: casa.kind,
      label: casa.label ?? "",
      nextPosition: 0,
      skipTeam: null as Team | null,
      restoreChips: false,
    };
  }

  if (casa.kind === "skip") {
    return {
      kind: casa.kind,
      label: casa.label ?? "",
      nextPosition: position,
      skipTurn: true,
      restoreChips: false,
    };
  }

  if (casa.kind === "chips") {
    return {
      kind: casa.kind,
      label: casa.label ?? "",
      nextPosition: position,
      skipTeam: null as Team | null,
      restoreChips: true,
    };
  }

  return null;
}
