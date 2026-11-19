import { getDb } from "@/infra/db";
import { RepositorioTCCPostgres } from "@/infra/repositorio-postgres";
import { ErroDeDominio } from "@/domain/erros";
import type { Decisao } from "@/domain/etapa";
import { barramento } from "@/domain/eventos";
import { registrarAuditoria } from "./auditoria";
import "./notificacao";

/** UC06: somente o orientador ativo do TCC avalia (RN09). */
export async function avaliarEntrega(p: { tccId: number; etapaId: number; avaliadorId: number; decisao: Decisao; parecer: string }) {
  if (p.decisao !== "APROVADA" && p.decisao !== "ALTERACOES_SOLICITADAS")
    throw new ErroDeDominio("DADOS_INVALIDOS", "Decisão inválida.");
  const db = await getDb();
  const agora = new Date();
  const r = await db.transaction(async (tx) => {
    const repo = new RepositorioTCCPostgres(tx);
    const tcc = await repo.carregarPorEtapaParaAtualizacao(p.etapaId);
    if (!tcc || tcc.id !== p.tccId) throw new ErroDeDominio("NAO_ENCONTRADO", "Etapa não encontrada.");
    if (!tcc.ehOrientador(p.avaliadorId))
      throw new ErroDeDominio("NAO_ORIENTADOR", "Somente o professor-orientador deste TCC pode avaliar entregas.");
    const etapa = tcc.etapa(p.etapaId);
    const { entrega, avaliacao } = etapa.avaliar(p.avaliadorId, p.decisao, p.parecer, agora);
    const avId = await repo.incluirAvaliacao(entrega.id!, p.avaliadorId, avaliacao.decisao, avaliacao.parecer, agora);
    await repo.gravarSituacaoEtapa(etapa.id, etapa.situacao, agora);
    const prof = (await tx.query<{ nome: string }>(`SELECT nome FROM usuario WHERE id = $1`, [p.avaliadorId])).rows[0];
    await registrarAuditoria(
      tx,
      { id: p.avaliadorId, nome: prof.nome },
      p.decisao === "APROVADA" ? "APROVACAO" : "SOLICITACAO_ALTERACAO",
      "avaliacao",
      avId,
      tcc.id,
      `Etapa "${etapa.nome}" – versão ${entrega.versao}`,
      agora,
    );
    return {
      situacao: etapa.situacao,
      evento: {
        tipo: "AvaliacaoRegistrada" as const,
        tccId: tcc.id,
        tccTitulo: tcc.titulo,
        etapaId: etapa.id,
        etapaNome: etapa.nome,
        decisao: p.decisao,
        integrantes: [...tcc.integrantes],
        avaliadorNome: prof.nome,
        quando: agora,
      },
    };
  });
  await barramento.publicar(r.evento);
  return { situacao: r.situacao };
}
