export interface Casa {
  index: number;
  x: number;
  y: number;
  kind: CasaKind;
  label?: string;
  value?: number;
}

export type CasaKind = "start" | "finish" | "normal" | "heart" | "bomb" | "skip" | "chips";

export const TAMANHO_CASA = 72;

const especiais: Record<number, Pick<Casa, "kind" | "label" | "value">> = {
  6: { kind: "heart", label: "+3", value: 3 },
  11: { kind: "skip", label: "passa", value: 0 },
  15: { kind: "chips", label: "fichas", value: 0 },
  20: { kind: "heart", label: "+7", value: 7 },
  24: { kind: "skip", label: "passa", value: 0 },
  27: { kind: "bomb", label: "inicio", value: 0 },
  31: { kind: "chips", label: "fichas", value: 0 },
  35: { kind: "heart", label: "+4", value: 4 },
  38: { kind: "skip", label: "passa", value: 0 },
  42: { kind: "bomb", label: "inicio", value: 0 },
  45: { kind: "chips", label: "fichas", value: 0 },
  47: { kind: "skip", label: "passa", value: 0 },
};

const COLUNAS = 11;
const coordenadas = Array.from({ length: 51 }, (_, index) => {
  const linha = Math.floor(index / COLUNAS);
  const coluna = index % COLUNAS;
  const colunaVisual = linha % 2 === 0 ? coluna : COLUNAS - 1 - coluna;
  const curveOffset = Math.sin(colunaVisual / 10 * Math.PI) * 18;
  const x = 86 + colunaVisual * 78;
  const y = 424 - linha * 82 - curveOffset;
  return { index, x, y };
});

export function gerarPercurso(): Casa[] {
  return coordenadas.map((casa) => {
    const special = especiais[casa.index];
    return {
      ...casa,
      kind: casa.index === 0 ? "start" : casa.index === 50 ? "finish" : special?.kind ?? "normal",
      label: special?.label,
      value: special?.value,
    };
  });
}

export function obterCasa(index: number) {
  return gerarPercurso()[Math.max(0, Math.min(50, index))];
}
