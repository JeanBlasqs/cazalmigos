export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function gerarCodigoSala() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}
