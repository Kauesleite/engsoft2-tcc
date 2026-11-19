import Link from "next/link";
import { ROTULO_SITUACAO, type SituacaoEtapa } from "@/domain/etapa";

const COR_SIT: Record<SituacaoEtapa, string> = {
  PENDENTE: "bg-gelo/60 text-grafite-700 border-gelo",
  AGUARDANDO_AVALIACAO: "bg-ouro-100 text-ouro-700 border-ouro-500/50",
  ALTERACOES_SOLICITADAS: "bg-alerta-100 text-alerta-700 border-alerta-700/30",
  APROVADA: "bg-verde-100 text-verde-900 border-verde-500/40",
};
const ICONE_SIT: Record<SituacaoEtapa, string> = { PENDENTE: "○", AGUARDANDO_AVALIACAO: "…", ALTERACOES_SOLICITADAS: "✎", APROVADA: "✓" };

export function Situacao({ valor }: { valor: SituacaoEtapa }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${COR_SIT[valor]}`}>
      <span aria-hidden>{ICONE_SIT[valor]}</span>
      {ROTULO_SITUACAO[valor]}
    </span>
  );
}

export function Selo({ children, tom = "neutro" }: { children: React.ReactNode; tom?: "neutro" | "alerta" | "ouro" | "verde" | "azul" }) {
  const t = {
    neutro: "bg-gelo/60 text-grafite-700 border-gelo",
    alerta: "bg-alerta-100 text-alerta-700 border-alerta-700/30",
    ouro: "bg-ouro-100 text-ouro-700 border-ouro-500/50",
    verde: "bg-verde-100 text-verde-900 border-verde-500/40",
    azul: "bg-azul-100 text-azul-700 border-azul-700/30",
  }[tom];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${t}`}>{children}</span>;
}

export function Progresso({ aprovadas, total, percentual, grande }: { aprovadas: number; total: number; percentual: number; grande?: boolean }) {
  return (
    <div>
      <div className={`flex items-baseline justify-between ${grande ? "mb-2" : "mb-1"}`}>
        <span className={`font-titulo font-bold text-verde-900 ${grande ? "text-3xl" : "text-sm"}`}>{percentual}%</span>
        <span className="text-xs text-aco">
          {aprovadas} de {total} etapas aprovadas
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percentual}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso do TCC"
        className={`w-full overflow-hidden rounded-full bg-gelo ${grande ? "h-4" : "h-2.5"}`}
      >
        <div className="h-full rounded-full bg-gradient-to-r from-verde-700 to-verde-500 transition-all" style={{ width: `${percentual}%` }} />
      </div>
    </div>
  );
}

export function Cartao({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-gelo bg-white p-4 shadow-sm sm:p-5 ${className}`}>{children}</section>;
}

export function Titulo({ children, sub, acao }: { children: React.ReactNode; sub?: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold text-grafite-900 sm:text-3xl">{children}</h1>
        {sub && <p className="mt-1 text-sm text-aco">{sub}</p>}
      </div>
      {acao}
    </div>
  );
}

export function SecaoTitulo({ children, contagem }: { children: React.ReactNode; contagem?: number }) {
  return (
    <h2 className="mb-3 flex items-center gap-3 text-base font-bold text-grafite-900">
      <span className="rotulo-mono text-verde-900">{children}</span>
      {contagem !== undefined && <span className="rounded-full bg-verde-900 px-2 py-0.5 text-xs font-bold text-white">{contagem}</span>}
      <span className="grafismo-claro h-2.5 flex-1" aria-hidden />
    </h2>
  );
}

export function Kpi({ valor, rotulo, tom = "neutro", href }: { valor: React.ReactNode; rotulo: string; tom?: "neutro" | "alerta" | "ouro" | "verde"; href?: string }) {
  const borda = { neutro: "border-l-aco", alerta: "border-l-alerta-700", ouro: "border-l-ouro-500", verde: "border-l-verde-700" }[tom];
  const corpo = (
    <div className={`h-full rounded-xl border border-gelo border-l-4 ${borda} bg-white p-4 shadow-sm ${href ? "transition hover:shadow-md" : ""}`}>
      <div className="font-titulo text-3xl font-extrabold text-grafite-900">{valor}</div>
      <div className="mt-1 text-xs font-medium text-aco">{rotulo}</div>
    </div>
  );
  return href ? <Link href={href}>{corpo}</Link> : corpo;
}

export function Aviso({ ok, erro }: { ok?: string; erro?: string }) {
  if (!ok && !erro) return null;
  return (
    <div
      role={erro ? "alert" : "status"}
      className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${erro ? "border-alerta-700/30 bg-alerta-100 text-alerta-700" : "border-verde-500/40 bg-verde-100 text-verde-900"}`}
    >
      {erro ?? ok}
    </div>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-gelo bg-white/60 px-4 py-6 text-center text-sm text-aco">{children}</p>;
}

export function Campo({ rotulo, dica, children }: { rotulo: string; dica?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-grafite-800">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-aco">{dica}</span>}
    </label>
  );
}
export const classeCampo =
  "w-full rounded-lg border border-gelo bg-white px-3 py-2.5 text-sm text-grafite-900 placeholder:text-aco/70 focus:border-verde-700 focus:outline-none focus:ring-2 focus:ring-verde-500/30";

export function Avatar({ nome }: { nome: string }) {
  const ini = nome.replace(/^(Prof\.|Profa\.)\s*/, "").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-verde-100 text-xs font-bold text-verde-900">{ini}</span>;
}
