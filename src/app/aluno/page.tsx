import Link from "next/link";
import { exigirUsuario } from "@/lib/sessao";
import { convitesDuplaRecebidos, linhaDoTcc, tccDoAluno } from "@/services/consultas";
import { carregarTccAutorizado } from "@/services/consultas";
import { responderDuplaAction } from "../actions";
import { Botao } from "@/components/ui";
import { Aviso, Cartao, Progresso, SecaoTitulo, Selo, Situacao, Titulo, Vazio } from "@/components/visual";
import { haQuanto } from "@/lib/formato";

export default async function PainelAluno({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const u = await exigirUsuario("ALUNO");
  const sp = await searchParams;
  const tccId = await tccDoAluno(u.id);
  const convites = await convitesDuplaRecebidos(u.id);
  const tcc = tccId ? await carregarTccAutorizado(u, tccId) : null;
  const linha = tccId ? await linhaDoTcc(tccId) : null;
  const proxima = tcc?.etapas.find((e) => e.situacao === "ALTERACOES_SOLICITADAS") ?? tcc?.etapas.find((e) => e.situacao === "PENDENTE");

  return (
    <>
      <Titulo sub={`Olá, ${u.nome.split(" ")[0]}. Aqui está a situação do seu trabalho.`}>Meu TCC</Titulo>
      <Aviso ok={sp.ok} erro={sp.erro} />

      {convites.length > 0 && (
        <div className="mb-6">
          <SecaoTitulo contagem={convites.length}>Convites de dupla</SecaoTitulo>
          <div className="space-y-3">
            {convites.map((c: any) => (
              <Cartao key={c.id} className="border-ouro-500/50 bg-ouro-100/40">
                <p className="text-sm">
                  <strong>{c.convidante}</strong> convidou você para formar dupla no TCC <strong>“{c.titulo}”</strong>.
                </p>
                <p className="mt-1 text-xs text-aco">O vínculo só será efetivado se você aceitar (RN03). Enviado {haQuanto(c.criado_em)}.</p>
                <form action={responderDuplaAction} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="conviteId" value={c.id} />
                  <button name="decisao" value="aceitar" className="min-h-11 rounded-lg bg-verde-900 px-4 text-sm font-semibold text-white hover:bg-verde-700">
                    Aceitar
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

      {!tcc || !linha ? (
        <Cartao className="text-center">
          <p className="rotulo-mono text-verde-700">UC01 · Cadastrar pré-projeto</p>
          <h2 className="mt-1 text-xl font-extrabold">Você ainda não tem um TCC cadastrado</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-aco">
            Cadastre seu pré-projeto para começar. Depois você poderá convidar um colega (dupla) e o professor orientador.
          </p>
          <Link href="/aluno/novo" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-verde-900 px-5 text-sm font-semibold text-white hover:bg-verde-700">
            Cadastrar pré-projeto
          </Link>
        </Cartao>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <Cartao className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Selo tom="verde">{linha.modalidade === "DUPLA" ? "Em dupla" : "Individual"}</Selo>
              {linha.orientadorNome ? <Selo tom="azul">Orientador(a): {linha.orientadorNome}</Selo> : <Selo tom="ouro">Sem orientador ativo</Selo>}
            </div>
            <h2 className="text-xl font-extrabold leading-snug">{tcc.titulo}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-aco">{tcc.resumo}</p>
            <div className="mt-5">
              <Progresso aprovadas={linha.aprovadas} total={linha.total} percentual={linha.percentual} grande />
            </div>
            <Link href={`/tcc/${tcc.id}`} className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-verde-900 px-5 text-sm font-semibold text-white hover:bg-verde-700">
              Abrir meu TCC
            </Link>
          </Cartao>
          <div className="space-y-5">
            <Cartao>
              <p className="rotulo-mono mb-3 text-aco">Resumo das etapas</p>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span>Aprovadas</span><strong className="text-verde-900">{linha.aprovadas}</strong></li>
                <li className="flex justify-between"><span>Aguardando avaliação</span><strong className="text-ouro-700">{linha.aguardando}</strong></li>
                <li className="flex justify-between"><span>Alterações solicitadas</span><strong className="text-alerta-700">{linha.alteracoes}</strong></li>
                <li className="flex justify-between"><span>Pendentes</span><strong>{linha.pendentes}</strong></li>
              </ul>
            </Cartao>
            {proxima && (
              <Cartao className="border-verde-500/40 bg-verde-50">
                <p className="rotulo-mono mb-2 text-verde-700">Próxima ação sugerida</p>
                <p className="mb-2 text-sm font-semibold">{proxima.nome}</p>
                <Situacao valor={proxima.situacao} />
                <Link href={`/tcc/${tcc.id}/etapa/${proxima.id}`} className="mt-3 block text-sm font-semibold text-verde-700 underline">
                  {proxima.situacao === "ALTERACOES_SOLICITADAS" ? "Ver o parecer e enviar nova versão →" : "Enviar esta etapa →"}
                </Link>
              </Cartao>
            )}
          </div>
        </div>
      )}
      {!tcc && convites.length === 0 && <div className="mt-5"><Vazio>Se um colega convidou você para uma dupla, o convite aparecerá aqui.</Vazio></div>}
    </>
  );
}
