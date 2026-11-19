import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { usuarioAtual, rotaInicial } from "@/lib/sessao";
import { contarNaoLidas } from "@/services/consultas";
import { sair } from "./actions";

export const metadata: Metadata = {
  title: "ProTCC · Acompanhamento de TCC – UNIFAP",
  description: "Sistema web para centralizar, gerenciar e acompanhar o desenvolvimento de Trabalhos de Conclusão de Curso.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1c1c21" };

export const dynamic = "force-dynamic";

const ROTULO = { ALUNO: "Aluno", PROFESSOR: "Professor orientador", COORDENACAO: "Coordenação" } as const;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const u = await usuarioAtual();
  const naoLidas = u ? await contarNaoLidas(u.id) : 0;
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Raleway:wght@600;700;800&family=Roboto:wght@400;500;700&display=swap"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <header className="bg-grafite-900 text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
            <Link href={u ? rotaInicial(u.perfil) : "/login"} className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-verde-900 font-titulo text-lg font-extrabold ring-1 ring-white/20">P</span>
              <span className="leading-tight">
                <span className="block font-titulo text-lg font-extrabold">ProTCC</span>
                <span className="block text-[11px] text-gelo/80">UNIFAP · Ciência da Computação</span>
              </span>
            </Link>
            {u && (
              <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Principal">
                <Link className="rounded-md px-3 py-2 hover:bg-white/10" href={rotaInicial(u.perfil)}>
                  Painel
                </Link>
                {u.perfil === "COORDENACAO" && (
                  <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/coordenacao/auditoria">
                    Auditoria
                  </Link>
                )}
                <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/sobre">
                  Modelagem
                </Link>
                <Link className="relative rounded-md px-3 py-2 hover:bg-white/10" href="/notificacoes" aria-label={`Notificações (${naoLidas} não lidas)`}>
                  Avisos
                  {naoLidas > 0 && <span className="ml-1.5 rounded-full bg-ouro-500 px-1.5 py-0.5 text-[11px] font-bold text-grafite-900">{naoLidas}</span>}
                </Link>
                <span className="mx-1 hidden h-6 w-px bg-white/20 sm:block" />
                <span className="hidden px-2 text-xs text-gelo/90 sm:block">
                  {u.nome}
                  <span className="block text-[10px] uppercase tracking-wide text-ouro-500">{ROTULO[u.perfil]}</span>
                </span>
                <form action={sair}>
                  <button className="rounded-md border border-white/25 px-3 py-2 text-xs font-semibold hover:bg-white/10">Sair</button>
                </form>
              </nav>
            )}
          </div>
          <div className="grafismo" aria-hidden />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <footer className="bg-grafite-900 text-gelo/80">
          <div className="grafismo" aria-hidden />
          <div className="mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed">
            <p className="font-semibold text-white">ProTCC · Engenharia de Software II</p>
            <p>Bacharelado em Ciência da Computação · Universidade Federal do Amapá · Docente: Adeildo Telles da Silva</p>
            <p className="mt-1 text-gelo/60">Projeto acadêmico. Os dados exibidos são fictícios, para demonstração.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
