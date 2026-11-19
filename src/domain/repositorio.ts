import type { Entrega, SituacaoEtapa, Decisao } from "./etapa";
import type { TCC } from "./tcc";

/**
 * RepositorioTCC (D09): oferece apenas INCLUSÃO de entregas e avaliações.
 * Não existe operação de alterar ou excluir uma Entrega — a integridade do
 * histórico (RNF06) é garantida pela própria estrutura.
 */
export interface NovaEntrega {
  etapaId: number;
  versao: number;
  autorId: number;
  comentario: string | null;
  arquivoNome: string | null;
  arquivoTipo: string | null;
  arquivoTamanho: number | null;
  arquivoDados: Uint8Array | null;
  linkExterno: string | null;
  criadaEm: Date;
}

export interface RepositorioTCC {
  carregar(tccId: number): Promise<TCC | null>;
  /** Carrega o TCC dono da etapa travando a etapa para a operação (evita duas submissões simultâneas). */
  carregarPorEtapaParaAtualizacao(etapaId: number): Promise<TCC | null>;
  incluirEntrega(nova: NovaEntrega): Promise<number>;
  incluirAvaliacao(entregaId: number, avaliadorId: number, decisao: Decisao, parecer: string, quando: Date): Promise<number>;
  /** Somente a Etapa (via serviço, na mesma transação da gravação) altera a situação – D10. */
  gravarSituacaoEtapa(etapaId: number, situacao: SituacaoEtapa, quando: Date): Promise<void>;
}

export type { Entrega };
