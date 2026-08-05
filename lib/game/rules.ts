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
  const special = correct ? aplicarCasaEspecial(nextPosition, input.boardSize) : null;

  return {
    correct,
    spacesMoved,
    nextPosition: special?.nextPosition ?? nextPosition,
    special,
    winner: (special?.nextPosition ?? nextPosition) >= (input.boardSize ?? 50),
  };
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
