import Link from "next/link";
import { exigirUsuario } from "@/lib/sessao";
import { dashboardProfessor, DIAS_ALERTA_AVALIACAO } from "@/services/consultas";
import { responderOrientacaoAction } from "../actions";
import { Aviso, Cartao, Kpi, Progresso, SecaoTitulo, Selo, Titulo, Vazio } from "@/components/visual";
import { haQuanto } from "@/lib/formato";

export default async function PainelProfessor({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const u = await exigirUsuario("PROFESSOR");
  const sp = await searchParams;
  const d = await dashboardProfessor(u.id);
  const aprovadas = d.orientandos.reduce((a, o) => a + o.aprovadas, 0);
  const total = d.orientandos.reduce((a, o) => a + o.total, 0);

  return (
    <>
      <Titulo sub="UC09 · Acompanhe seus orientandos e as entregas que aguardam sua análise.">Painel do orientador</Titulo>
      <Aviso ok={sp.ok} erro={sp.erro} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi valor={d.orientandos.length} rotulo="TCCs sob orientação" />
        <Kpi valor={d.fila.length} rotulo="Entregas aguardando avaliação" tom={d.fila.length ? "ouro" : "neutro"} />
        <Kpi valor={d.convites.length} rotulo="Convites de orientação" tom={d.convites.length ? "ouro" : "neutro"} />
        <Kpi valor={total ? `${Math.round((aprovadas / total) * 100)}%` : "—"} rotulo="Etapas aprovadas (média)" tom="verde" />
      </div>

      {d.convites.length > 0 && (
        <div className="mb-6">
          <SecaoTitulo contagem={d.convites.length}>Convites de orientação · UC04</SecaoTitulo>
          <div className="space-y-3">
            {d.convites.map((c: any) => (
              <Cartao key={c.id} className="border-ouro-500/50 bg-ouro-100/40">
                <p className="text-sm">
                  <strong>{c.convidante}</strong> convidou você para orientar <strong>“{c.titulo}”</strong>
                  {c.alunos ? <> ({c.alunos})</> : null}.
                </p>
                <p className="mt-1 text-sm text-grafite-700">{c.resumo}</p>
                <p className="mt-1 text-xs text-aco">A orientação só fica ativa após o seu aceite (RN07). Enviado {haQuanto(c.criado_em)}.</p>
                <form action={responderOrientacaoAction} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="conviteId" value={c.id} />
                  <button name="decisao" value="aceitar" className="min-h-11 rounded-lg bg-verde-900 px-4 text-sm font-semibold text-white hover:bg-verde-700">
                    Aceitar orientação
                  </button>
                  <button name="decisao" value="recusar" className="min-h-11 rounded-lg border border-alerta-700/40 bg-white px-4 text-sm font-semibold text-alerta-700 hover:bg-alerta-100">
                    Recusar
                  </button>
                </form>
              </Cartao>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <SecaoTitulo contagem={d.fila.length}>Aguardando minha avaliação</SecaoTitulo>
        {d.fila.length === 0 ? (
          <Vazio>Nenhuma entrega pendente. Tudo em dia! ✓</Vazio>
        ) : (
          <ul className="space-y-2">
            {d.fila.map((f: any) => {
              const atrasada = (Date.now() - new Date(f.desde).getTime()) / 86_400_000 > DIAS_ALERTA_AVALIACAO;
              return (
                <li key={f.etapa_id}>
                  <Link
                    href={`/tcc/${f.tcc_id}/etapa/${f.etapa_id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-gelo bg-white p-3.5 shadow-sm transition hover:border-verde-700 hover:shadow sm:p-4"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-grafite-900">
                        {f.etapa} <span className="font-mono text-xs text-aco">v{f.versao}</span>
                      </span>
                      <span className="block text-xs text-aco">
                        {f.titulo} · {f.alunos}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      {atrasada && <Selo tom="alerta">+{DIAS_ALERTA_AVALIACAO} dias esperando</Selo>}
                      <span className="text-xs text-aco">enviada {haQuanto(f.desde)}</span>
                      <span className="rounded-lg bg-verde-900 px-3 py-1.5 text-xs font-semibold text-white">Avaliar</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <SecaoTitulo contagem={d.orientandos.length}>Meus orientandos</SecaoTitulo>
        {d.orientandos.length === 0 ? (
          <Vazio>Você ainda não orienta nenhum TCC.</Vazio>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {d.orientandos.map((o) => (
              <Cartao key={o.id}>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Selo tom="verde">{o.modalidade === "DUPLA" ? "Dupla" : "Individual"}</Selo>
                  {o.aguardando > 0 && <Selo tom="ouro">{o.aguardando} aguardando</Selo>}
                  {o.alteracoes > 0 && <Selo tom="alerta">{o.alteracoes} com alterações</Selo>}
                </div>
                <Link href={`/tcc/${o.id}`} className="block font-bold leading-snug text-grafite-900 hover:underline">
                  {o.titulo}
                </Link>
                <p className="mb-3 mt-1 text-xs text-aco">{o.integrantes.map((i) => i.nome).join(" e ")}</p>
                <Progresso aprovadas={o.aprovadas} total={o.total} percentual={o.percentual} />
              </Cartao>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
