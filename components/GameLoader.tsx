export function GameLoader({ label = "Preparando Cazalmigos..." }: { label?: string }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-zinc-950 p-6 text-white">
      <div className="absolute inset-0 bg-[url('/cazalmigos-hero.png')] bg-cover bg-center opacity-45" />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative rounded-2xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-4 border-rose-300 border-t-transparent animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-200">Aguarde</p>
        <h1 className="mt-2 text-3xl font-black">{label}</h1>
      </div>
    </main>
  );
}
