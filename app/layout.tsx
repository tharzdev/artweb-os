import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "artweb.so — Seu workspace criativo",
  description: "Projetos, tarefas e documentos em um espaço para criar.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/assets/artweb-logo.png",
    shortcut: "/assets/artweb-logo.png",
    apple: "/assets/artweb-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
