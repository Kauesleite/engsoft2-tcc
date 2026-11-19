import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirUsuario, rotaInicial } from "@/lib/sessao";
import { carregarTccAutorizado, convitesDoTcc, linhaDoTcc, nomesUsuarios } from "@/services/consultas";
import { ErroDeDominio } from "@/domain/erros";
import { convidarOrientadorAction, convidarParceiroAction } from "../../actions";
import { Botao } from "@/components/ui";
import { Aviso, Avatar, Campo, Cartao, classeCampo, Progresso, SecaoTitulo, Selo, Situacao, Titulo } from "@/components/visual";
import { dataHora, haQuanto } from "@/lib/formato";

export default async function PaginaTcc({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const u = await exigirUsuario();
  const { id } = await params;
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
  const linha = (await linhaDoTcc(tcc.id))!;
  const nomes = await nomesUsuarios([...tcc.integrantes, ...(tcc.orientadorId ? [tcc.orientadorId] : [])]);
  const convites = await convitesDoTcc(tcc.id);
  const souAluno = u.perfil === "ALUNO" && tcc.ehIntegrante(u.id);
  const dupPendente = convites.dupla.find((c: any) => c.status === "PENDENTE");
  const oriPendente = convites.orientacao.find((c: any) => c.status === "PENDENTE");
  const souCriador = tcc.criadoPor === u.id;

  return (
    <>
      <Aviso ok={sp.ok} erro={sp.erro} />
      <Titulo
        sub={
          <span className="flex flex-wrap items-center gap-2">
            <Selo tom="verde">{tcc.modalidade === "DUPLA" ? "Em dupla" : "Individual"}</Selo>
            {tcc.etapas.some((e) => e.situacao === "AGUARDANDO_AVALIACAO") && <Selo tom="ouro">Há entrega aguardando avaliação</Selo>}
          </span>
        }
      >
        {tcc.titulo}
      </Titulo>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Cartao>
            <p className="text-sm leading-relaxed text-grafite-700">{tcc.resumo}</p>
            {tcc.area && <p className="mt-2 text-xs text-aco">Área: {tcc.area}</p>}
            <div className="mt-5">
              <Progresso aprovadas={linha.aprovadas} total={linha.total} percentual={linha.percentual} grande />
            </div>
          </Cartao>

          <div>
            <SecaoTitulo>Etapas do TCC</SecaoTitulo>
            <p className="mb-3 text-xs text-aco">As etapas podem ser enviadas em qualquer ordem (RN11). Uma etapa só conta como concluída após a aprovação do orientador (RN10).</p>
            <ol className="space-y-2">
              {tcc.etapas.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/tcc/${tcc.id}/etapa/${e.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-gelo bg-white p-3.5 shadow-sm transition hover:border-verde-700 hover:shadow sm:p-4"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-grafite-900 font-mono text-sm font-bold text-white">{e.ordem}</span>
                    <span className="min-w-[11rem] flex-1">
                      <span className="block font-semibold leading-snug text-grafite-900">{e.nome}</span>
                      <span className="block text-xs text-aco">
                        {e.ultimaEntrega ? `Versão ${e.ultimaEntrega.versao} · ${haQuanto(e.ultimaEntrega.criadaEm)}` : "Nenhuma entrega ainda"}
                      </span>
                    </span>
                    <Situacao valor={e.situacao} />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="space-y-5">
          <Cartao>
            <p className="rotulo-mono mb-3 text-aco">Integrantes</p>
            <ul className="space-y-2.5">
              {tcc.integrantes.map((i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <Avatar nome={nomes.get(i) ?? "?"} />
                  <span>{nomes.get(i)}</span>
                </li>
              ))}
            </ul>
            <p className="rotulo-mono mb-3 mt-5 text-aco">Orientador(a)</p>
            {tcc.orientadorId ? (
              <div className="flex items-center gap-2.5 text-sm">
                <Avatar nome={nomes.get(tcc.orientadorId) ?? "?"} />
                <span>{nomes.get(tcc.orientadorId)}</span>
              </div>
            ) : (
              <p className="text-sm text-aco">Ainda sem orientador ativo.</p>
            )}
          </Cartao>

          {souAluno && (
            <Cartao>
              <p className="rotulo-mono mb-3 text-aco">Vínculos</p>
              {!tcc.orientadorId && (
                <div className="mb-5">
                  <p className="mb-2 text-sm font-semibold">Convidar orientador (UC03)</p>
                  {oriPendente ? (
                    <p className="rounded-lg bg-ouro-100 p-3 text-xs text-ouro-700">
                      Convite enviado a <strong>{(oriPendente as any).professor}</strong> {haQuanto((oriPendente as any).criado_em)}. Aguardando aceite (RN07).
                    </p>
                  ) : (
                    <form action={convidarOrientadorAction} className="space-y-2">
                      <input type="hidden" name="tccId" value={tcc.id} />
                      <Campo rotulo="E-mail do professor">
                        <input name="email" type="email" required className={classeCampo} placeholder="professor@protcc.demo" />
                      </Campo>
                      <Botao className="w-full">Enviar convite</Botao>
                    </form>
                  )}
                </div>
              )}
              {tcc.podeReceberIntegrante() && souCriador && (
                <div>
                  <p className="mb-2 text-sm font-semibold">Convidar parceiro de dupla (UC02)</p>
                  {dupPendente ? (
                    <p className="rounded-lg bg-ouro-100 p-3 text-xs text-ouro-700">
                      Convite enviado a <strong>{(dupPendente as any).convidado}</strong> {haQuanto((dupPendente as any).criado_em)}. O vínculo só vale após o aceite (RN03).
                    </p>
                  ) : (
                    <form action={convidarParceiroAction} className="space-y-2">
                      <input type="hidden" name="tccId" value={tcc.id} />
                      <Campo rotulo="E-mail do colega">
                        <input name="email" type="email" required className={classeCampo} placeholder="colega@protcc.demo" />
                      </Campo>
                      <Botao variante="secundario" className="w-full">
                        Enviar convite
                      </Botao>
                    </form>
                  )}
                </div>
              )}
              {tcc.orientadorId && !tcc.podeReceberIntegrante() && <p className="text-xs text-aco">Vínculos completos: dupla formada e orientador ativo.</p>}
            </Cartao>
          )}

          {(convites.dupla.length > 0 || convites.orientacao.length > 0) && (
            <Cartao>
              <p className="rotulo-mono mb-3 text-aco">Histórico de convites</p>
              <ul className="space-y-2 text-xs">
                {convites.orientacao.map((c: any) => (
                  <li key={`o${c.id}`} className="flex justify-between gap-2">
                    <span>Orientação · {c.professor}</span>
                    <Selo tom={c.status === "ACEITO" ? "verde" : c.status === "RECUSADO" ? "alerta" : "ouro"}>{c.status.toLowerCase()}</Selo>
                  </li>
                ))}
                {convites.dupla.map((c: any) => (
                  <li key={`d${c.id}`} className="flex justify-between gap-2">
                    <span>Dupla · {c.convidado}</span>
                    <Selo tom={c.status === "ACEITO" ? "verde" : c.status === "RECUSADO" ? "alerta" : "ouro"}>{c.status.toLowerCase()}</Selo>
                  </li>
                ))}
              </ul>
            </Cartao>
          )}
        </aside>
      </div>
    </>
  );
}
