import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cazalmigos",
  description: "Jogo de tabuleiro 2x2 para casais e amigos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
