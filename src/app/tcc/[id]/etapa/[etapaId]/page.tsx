import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirUsuario, rotaInicial } from "@/lib/sessao";
import { carregarTccAutorizado, nomesUsuarios } from "@/services/consultas";
import { ErroDeDominio } from "@/domain/erros";
import { avaliarAction, submeterEtapaAction } from "../../../../actions";
import { Botao } from "@/components/ui";
import { Aviso, Avatar, Campo, Cartao, classeCampo, SecaoTitulo, Selo, Situacao, Titulo } from "@/components/visual";
import { dataHora, tamanho } from "@/lib/formato";

export default async function PaginaEtapa({ params, searchParams }: { params: Promise<{ id: string; etapaId: string }>; searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const u = await exigirUsuario();
  const { id, etapaId } = await params;
  const sp = await searchParams;
  let tcc;
  try {
    tcc = await carregarTccAutorizado(u, Number(id));
  } catch (e) {
    if (e instanceof ErroDeDominio) {
      if (e.codigo === "NAO_ENCONTRADO") notFound();
      redirect(rotaInicial(u.perfil) + "?erro=" + encodeURIComponent(e.message));
    }
    throw e;
  }
  const etapa = tcc.etapas.find((e) => e.id === Number(etapaId));
  if (!etapa) notFound();
  const ids = new Set<number>();
  etapa.entregas.forEach((x) => {
    ids.add(x.autorId);
    if (x.avaliacao) ids.add(x.avaliacao.avaliadorId);
  });
  const nomes = await nomesUsuarios([...ids]);
  const souAluno = u.perfil === "ALUNO" && tcc.ehIntegrante(u.id);
  const souOrientador = u.perfil === "PROFESSOR" && tcc.ehOrientador(u.id);
  const podeEnviar = souAluno && etapa.aceitaSubmissao();
  const podeAvaliar = souOrientador && etapa.situacao === "AGUARDANDO_AVALIACAO";
  const historico = [...etapa.entregas].reverse();
  const prox = etapa.proximaVersao();

  return (
    <>
      <nav className="mb-3 text-sm" aria-label="Navegação">
        <Link href={`/tcc/${tcc.id}`} className="font-semibold text-verde-700 underline">
          ← {tcc.titulo}
        </Link>
      </nav>
      <Aviso ok={sp.ok} erro={sp.erro} />
      <Titulo
        sub={etapa.descricao}
        acao={<Situacao valor={etapa.situacao} />}
      >
        <span className="rotulo-mono mb-1 block text-aco">Etapa {etapa.ordem}</span>
        {etapa.nome}
      </Titulo>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          {podeAvaliar && (
            <Cartao className="border-ouro-500/60 bg-ouro-100/40">
              <p className="rotulo-mono text-ouro-700">UC06 · Avaliar entrega</p>
              <h2 className="mb-1 mt-1 text-lg font-extrabold">Versão {etapa.ultimaEntrega!.versao} aguarda sua avaliação</h2>
              <p className="mb-4 text-xs text-aco">Somente o orientador vinculado ao TCC pode aprovar ou solicitar alterações (RN09).</p>
              <form action={avaliarAction} className="space-y-3">
                <input type="hidden" name="tccId" value={tcc.id} />
                <input type="hidden" name="etapaId" value={etapa.id} />
                <Campo rotulo="Parecer" dica="Obrigatório ao solicitar alterações.">
                  <textarea name="parecer" rows={4} className={classeCampo} placeholder="Comentários para o(s) aluno(s)…" />
                </Campo>
                <div className="flex flex-wrap gap-2">
                  <Botao name="decisao" value="APROVADA">
                    ✓ Aprovar etapa
                  </Botao>
                  <Botao name="decisao" value="ALTERACOES_SOLICITADAS" variante="perigo">
                    ✎ Solicitar alterações
                  </Botao>
                </div>
              </form>
            </Cartao>
          )}

          {podeEnviar && (
            <Cartao>
              <p className="rotulo-mono text-verde-700">UC05 · Submeter etapa</p>
              <h2 className="mb-1 mt-1 text-lg font-extrabold">{prox === 1 ? "Enviar primeira versão" : `Enviar nova versão (v${prox})`}</h2>
              <p className="mb-4 text-xs text-aco">
                {prox === 1
                  ? "Qualquer integrante do TCC pode enviar, em qualquer ordem de etapa."
                  : "A versão anterior continua registrada: novas versões nunca apagam o histórico (RN12, RNF06)."}
              </p>
              <form action={submeterEtapaAction} className="space-y-3" encType="multipart/form-data">
                <input type="hidden" name="tccId" value={tcc.id} />
                <input type="hidden" name="etapaId" value={etapa.id} />
                <Campo rotulo="Arquivo" dica="Até 3,5 MB (PDF, DOCX, ZIP…).">
                  <input name="arquivo" type="file" className={`${classeCampo} file:mr-3 file:rounded-md file:border-0 file:bg-verde-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-verde-900`} />
                </Campo>
                <Campo rotulo="ou link da entrega" dica="Drive, GitHub, etc. Informe o arquivo, o link, ou ambos.">
                  <input name="link" type="url" className={classeCampo} placeholder="https://" />
                </Campo>
                <Campo rotulo="Comentário para o orientador (opcional)">
                  <textarea name="comentario" rows={3} className={classeCampo} />
                </Campo>
                <Botao>Enviar para avaliação</Botao>
              </form>
            </Cartao>
          )}

          {souAluno && !podeEnviar && (
            <Cartao className="bg-verde-50">
              <p className="text-sm">
                {etapa.situacao === "APROVADA"
                  ? "✓ Etapa aprovada pelo orientador: não aceita novas submissões (RN10)."
                  : "◔ Há uma entrega aguardando avaliação. Você poderá enviar outra versão se o orientador solicitar alterações."}
              </p>
            </Cartao>
          )}

          {!souAluno && !podeAvaliar && (
            <Cartao className="bg-azul-100/50">
              <p className="text-sm text-azul-700">Visualização somente leitura{u.perfil === "COORDENACAO" ? " (coordenação)" : ""}.</p>
            </Cartao>
          )}
        </div>

        <div className="lg:col-span-2">
          <SecaoTitulo contagem={etapa.entregas.length}>Histórico (UC07)</SecaoTitulo>
          {historico.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gelo bg-white/60 px-4 py-6 text-center text-sm text-aco">Nenhuma versão enviada ainda.</p>
          ) : (
            <ol className="relative space-y-4 border-l-2 border-verde-200 pl-5">
              {historico.map((en) => (
                <li key={en.versao} className="relative">
                  <span className="absolute -left-[1.72rem] top-3 flex size-4 items-center justify-center rounded-full border-2 border-verde-700 bg-white" />
                  <Cartao className="!p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold text-grafite-900">v{en.versao}</span>
                      {en.avaliacao ? <Selo tom={en.avaliacao.decisao === "APROVADA" ? "verde" : "alerta"}>{en.avaliacao.decisao === "APROVADA" ? "Aprovada" : "Alterações solicitadas"}</Selo> : <Selo tom="ouro">Aguardando avaliação</Selo>}
                    </div>
                    <p className="mt-2 flex items-center gap-2 text-xs text-aco">
                      <Avatar nome={nomes.get(en.autorId) ?? "?"} />
                      <span>
                        <strong className="text-grafite-800">{nomes.get(en.autorId)}</strong> · {dataHora(en.criadaEm)}
                      </span>
                    </p>
                    {en.comentario && <p className="mt-2 text-sm">{en.comentario}</p>}
                    <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold">
                      {en.temArquivo && en.id && (
                        <a className="text-verde-700 underline" href={`/arquivo/${en.id}`}>
                          ⬇ {en.arquivoNome} <span className="font-normal text-aco">{tamanho(en.arquivoTamanho)}</span>
                        </a>
                      )}
                      {en.linkExterno && (
                        <a className="text-verde-700 underline" href={en.linkExterno} target="_blank" rel="noopener noreferrer">
                          ↗ Abrir link
                        </a>
                      )}
                    </div>
                    {en.avaliacao && (
                      <div className={`mt-3 rounded-lg border p-3 text-sm ${en.avaliacao.decisao === "APROVADA" ? "border-verde-500/30 bg-verde-50" : "border-alerta-700/20 bg-alerta-100/60"}`}>
                        <p className="text-xs text-aco">
                          Parecer de <strong className="text-grafite-800">{nomes.get(en.avaliacao.avaliadorId)}</strong> · {dataHora(en.avaliacao.criadaEm)}
                        </p>
                        <p className="mt-1">{en.avaliacao.parecer || <em className="text-aco">Sem comentários.</em>}</p>
                      </div>
                    )}
                  </Cartao>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}
