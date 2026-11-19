import type { Executor } from "./db";
import type { NovaEntrega, RepositorioTCC } from "@/domain/repositorio";
import { Entrega, Etapa, type Decisao, type SituacaoEtapa } from "@/domain/etapa";
import { TCC } from "@/domain/tcc";

/** Implementação Postgres do RepositorioTCC. Só inclui entregas/avaliações; nunca altera nem exclui. */
export class RepositorioTCCPostgres implements RepositorioTCC {
  constructor(private readonly db: Executor) {}

  async carregar(tccId: number): Promise<TCC | null> {
    return this.montar(`SELECT * FROM tcc WHERE id = $1`, [tccId]);
  }

  async carregarPorEtapaParaAtualizacao(etapaId: number): Promise<TCC | null> {
    const lock = await this.db.query<{ tcc_id: number }>(`SELECT tcc_id FROM etapa WHERE id = $1 FOR UPDATE`, [etapaId]);
    if (!lock.rows[0]) return null;
    return this.montar(`SELECT * FROM tcc WHERE id = $1`, [lock.rows[0].tcc_id]);
  }

  private async montar(sql: string, params: unknown[]): Promise<TCC | null> {
    const t = (await this.db.query(sql, params)).rows[0];
    if (!t) return null;
    const integ = await this.db.query<{ aluno_id: number }>(
      `SELECT aluno_id FROM tcc_integrante WHERE tcc_id = $1 ORDER BY entrou_em, aluno_id`,
      [t.id],
    );
    const etapas = (await this.db.query(`SELECT * FROM etapa WHERE tcc_id = $1 ORDER BY ordem`, [t.id])).rows;
    const ids = etapas.map((e) => e.id);
    const entregasRows = ids.length
      ? (
          await this.db.query(
            `SELECT e.id, e.etapa_id, e.versao, e.autor_id, e.comentario, e.arquivo_nome, e.arquivo_tipo,
                    e.arquivo_tamanho, e.link_externo, e.criada_em,
                    a.id AS av_id, a.avaliador_id, a.decisao, a.parecer, a.criada_em AS av_criada
               FROM entrega e LEFT JOIN avaliacao a ON a.entrega_id = e.id
              WHERE e.etapa_id = ANY($1::int[]) ORDER BY e.etapa_id, e.versao`,
            [ids],
          )
        ).rows
      : [];
    const porEtapa = new Map<number, Entrega[]>();
    for (const r of entregasRows) {
      const ent = new Entrega({
        id: r.id,
        etapaId: r.etapa_id,
        versao: r.versao,
        autorId: r.autor_id,
        comentario: r.comentario,
        arquivoNome: r.arquivo_nome,
        arquivoTipo: r.arquivo_tipo,
        arquivoTamanho: r.arquivo_tamanho,
        linkExterno: r.link_externo,
        criadaEm: r.criada_em,
        avaliacao: r.av_id
          ? { id: r.av_id, entregaId: r.id, avaliadorId: r.avaliador_id, decisao: r.decisao, parecer: r.parecer, criadaEm: r.av_criada }
          : null,
      });
      const lista = porEtapa.get(r.etapa_id) ?? [];
      lista.push(ent);
      porEtapa.set(r.etapa_id, lista);
    }
    return new TCC(
      t.id,
      t.titulo,
      t.resumo,
      t.area,
      integ.rows.map((i) => i.aluno_id),
      t.orientador_id,
      etapas.map(
        (e) => new Etapa(e.id, e.ordem, e.nome, e.situacao, porEtapa.get(e.id) ?? [], e.descricao, e.situacao_atualizada_em),
      ),
      t.modalidade,
      t.criado_por,
    );
  }

  async incluirEntrega(n: NovaEntrega): Promise<number> {
    const r = await this.db.query<{ id: number }>(
      `INSERT INTO entrega (etapa_id, versao, autor_id, comentario, arquivo_nome, arquivo_tipo, arquivo_tamanho, arquivo_dados, link_externo, criada_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [n.etapaId, n.versao, n.autorId, n.comentario, n.arquivoNome, n.arquivoTipo, n.arquivoTamanho, n.arquivoDados, n.linkExterno, n.criadaEm],
    );
    return r.rows[0].id;
  }

  async incluirAvaliacao(entregaId: number, avaliadorId: number, decisao: Decisao, parecer: string, quando: Date): Promise<number> {
    const r = await this.db.query<{ id: number }>(
      `INSERT INTO avaliacao (entrega_id, avaliador_id, decisao, parecer, criada_em) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [entregaId, avaliadorId, decisao, parecer, quando],
    );
    return r.rows[0].id;
  }

  async gravarSituacaoEtapa(etapaId: number, situacao: SituacaoEtapa, quando: Date): Promise<void> {
    await this.db.query(`UPDATE etapa SET situacao = $2, situacao_atualizada_em = $3 WHERE id = $1`, [etapaId, situacao, quando]);
  }
}
