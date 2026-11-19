import type { Executor } from "@/infra/db";

export interface AtorAuditoria {
  id: number | null;
  nome: string;
}

/** RNF05: registra quem, quando e o quê. Sempre chamada na mesma transação da ação auditada. */
export async function registrarAuditoria(
  tx: Executor,
  ator: AtorAuditoria,
  acao: string,
  entidade: string,
  entidadeId: number | null,
  tccId: number | null,
  detalhes?: string,
  quando: Date = new Date(),
) {
  await tx.query(
    `INSERT INTO log_auditoria (usuario_id, usuario_nome, acao, entidade, entidade_id, tcc_id, detalhes, criado_em)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [ator.id, ator.nome, acao, entidade, entidadeId, tccId, detalhes ?? null, quando],
  );
}
