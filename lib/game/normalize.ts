export function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function respostasIguais(a: string, b: string): boolean {
  const respostaA = normalizar(a);
  const respostaB = normalizar(b);
  if (respostaA === respostaB) return true;
  if (respostaA.length < 3 || respostaB.length < 3) return false;
  return respostaA.includes(respostaB) || respostaB.includes(respostaA);
}
