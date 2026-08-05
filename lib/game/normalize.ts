export function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function respostasIguais(a: string, b: string): boolean {
  return normalizar(a) === normalizar(b);
}
