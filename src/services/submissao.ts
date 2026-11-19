import { getDb } from "@/infra/db";
import { RepositorioTCCPostgres } from "@/infra/repositorio-postgres";
import { ErroDeDominio } from "@/domain/erros";
import { barramento } from "@/domain/eventos";
import { registrarAuditoria } from "./auditoria";
import "./notificacao";

export const TAMANHO_MAX_ARQUIVO = 3.5 * 1024 * 1024;

export interface PedidoSubmissao {
  tccId: number;
  etapaId: number;
  autorId: number;
  comentario?: string | null;
  arquivo?: { nome: string; tipo: string; dados: Uint8Array } | null;
  linkExterno?: string | null;
}

/**
 * ServicoSubmissao (UC05): só COORDENA o fluxo. Cada regra vive no elemento que conhece os dados:
 * TCC (vínculo), Etapa (aceite, versão, situação), RepositorioTCC (gravação) e,
 * por evento, ServicoNotificacao (aviso). A operação é atômica (transação).
 */
export async function submeterEtapa(p: PedidoSubmissao): Promise<{ entregaId: number; versao: number }> {
  if (p.arquivo && p.arquivo.dados.byteLength > TAMANHO_MAX_ARQUIVO)
    throw new ErroDeDominio("ARQUIVO_GRANDE", "Arquivo acima de 3,5 MB. Envie um arquivo menor ou informe um link.");
  const link = p.linkExterno?.trim() || null;
  if (link && !/^https?:\/\//i.test(link)) throw new ErroDeDominio("DADOS_INVALIDOS", "O link precisa começar com http:// ou https://.");

  const db = await getDb();
  const agora = new Date();

  const r = await db.transaction(async (tx) => {
    const repo = new RepositorioTCCPostgres(tx);
    const tcc = await repo.carregarPorEtapaParaAtualizacao(p.etapaId);
    if (!tcc || tcc.id !== p.tccId) throw new ErroDeDominio("NAO_ENCONTRADO", "Etapa não encontrada.");
    // R1 / RN08: o TCC informa se o aluno é integrante
    if (!tcc.ehIntegrante(p.autorId))
      throw new ErroDeDominio("NAO_INTEGRANTE", "Somente alunos vinculados a este TCC podem submeter etapas.");
    const etapa = tcc.etapa(p.etapaId);
    // R2, R3, R6: a Etapa decide, versiona e muda a própria situação
    const entrega = etapa.receberEntrega({
      autorId: p.autorId,
      comentario: p.comentario,
      arquivoNome: p.arquivo?.nome ?? null,
      arquivoTipo: p.arquivo?.tipo ?? null,
      arquivoTamanho: p.arquivo?.dados.byteLength ?? null,
      linkExterno: link,
      quando: agora,
    });
    // R4, R5: gravação só por inclusão, e situação no mesmo commit (D10)
    const entregaId = await repo.incluirEntrega({
      etapaId: etapa.id,
      versao: entrega.versao,
      autorId: entrega.autorId,
      comentario: entrega.comentario,
      arquivoNome: entrega.arquivoNome,
      arquivoTipo: entrega.arquivoTipo,
      arquivoTamanho: entrega.arquivoTamanho,
      arquivoDados: p.arquivo?.dados ?? null,
      linkExterno: entrega.linkExterno,
      criadaEm: entrega.criadaEm,
    });
    await repo.gravarSituacaoEtapa(etapa.id, etapa.situacao, agora);
    const autor = (await tx.query<{ nome: string }>(`SELECT nome FROM usuario WHERE id = $1`, [p.autorId])).rows[0];
    await registrarAuditoria(
      tx,
      { id: p.autorId, nome: autor.nome },
      entrega.versao === 1 ? "SUBMISSAO" : "NOVA_VERSAO",
      "entrega",
      entregaId,
      tcc.id,
      `Etapa "${etapa.nome}" – versão ${entrega.versao}`,
      agora,
    );
    return {
      entregaId,
      versao: entrega.versao,
      evento: {
        tipo: "EntregaRegistrada" as const,
        tccId: tcc.id,
        tccTitulo: tcc.titulo,
        etapaId: etapa.id,
        etapaNome: etapa.nome,
        entregaId,
        versao: entrega.versao,
        autorId: p.autorId,
        autorNome: autor.nome,
        orientadorId: tcc.orientadorId,
        quando: agora,
      },
    };
  });

  // Evento publicado só depois do commit (D07): falha de aviso não desfaz a submissão.
  await barramento.publicar(r.evento);
  return { entregaId: r.entregaId, versao: r.versao };
}
