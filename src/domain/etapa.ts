import { ErroDeDominio } from "./erros";

export type SituacaoEtapa = "PENDENTE" | "AGUARDANDO_AVALIACAO" | "ALTERACOES_SOLICITADAS" | "APROVADA";
export type Decisao = "APROVADA" | "ALTERACOES_SOLICITADAS";

export const ROTULO_SITUACAO: Record<SituacaoEtapa, string> = {
  PENDENTE: "Pendente",
  AGUARDANDO_AVALIACAO: "Aguardando avaliação",
  ALTERACOES_SOLICITADAS: "Alterações solicitadas",
  APROVADA: "Aprovada",
};

export interface AvaliacaoDados {
  id?: number;
  entregaId?: number;
  avaliadorId: number;
  decisao: Decisao;
  parecer: string;
  criadaEm: Date;
}

export interface EntregaDados {
  id?: number;
  etapaId: number;
  versao: number;
  autorId: number;
  comentario?: string | null;
  arquivoNome?: string | null;
  arquivoTipo?: string | null;
  arquivoTamanho?: number | null;
  linkExterno?: string | null;
  criadaEm: Date;
  avaliacao?: AvaliacaoDados | null;
}

/**
 * Entrega: registro imutável (D09 / RNF06). Autor, data e hora são obrigatórios (RNF05).
 * O objeto é congelado: não existe forma de alterá-lo depois de criado.
 */
export class Entrega {
  readonly id?: number;
  readonly etapaId: number;
  readonly versao: number;
  readonly autorId: number;
  readonly comentario: string | null;
  readonly arquivoNome: string | null;
  readonly arquivoTipo: string | null;
  readonly arquivoTamanho: number | null;
  readonly linkExterno: string | null;
  readonly criadaEm: Date;
  readonly avaliacao: Readonly<AvaliacaoDados> | null;

  constructor(d: EntregaDados) {
    if (!d.autorId) throw new ErroDeDominio("DADOS_INVALIDOS", "Toda entrega precisa de um autor.");
    if (!(d.criadaEm instanceof Date)) throw new ErroDeDominio("DADOS_INVALIDOS", "Toda entrega precisa de data e hora.");
    this.id = d.id;
    this.etapaId = d.etapaId;
    this.versao = d.versao;
    this.autorId = d.autorId;
    this.comentario = d.comentario ?? null;
    this.arquivoNome = d.arquivoNome ?? null;
    this.arquivoTipo = d.arquivoTipo ?? null;
    this.arquivoTamanho = d.arquivoTamanho ?? null;
    this.linkExterno = d.linkExterno ?? null;
    this.criadaEm = d.criadaEm;
    this.avaliacao = d.avaliacao ? Object.freeze({ ...d.avaliacao }) : null;
    Object.freeze(this);
  }

  get temArquivo() {
    return !!this.arquivoNome;
  }
}

export interface ConteudoSubmissao {
  autorId: number;
  comentario?: string | null;
  arquivoNome?: string | null;
  arquivoTipo?: string | null;
  arquivoTamanho?: number | null;
  linkExterno?: string | null;
  quando: Date;
}

/**
 * Etapa: conhece sua situação e suas entregas; decide se aceita submissão (RN10),
 * calcula a próxima versão (RN12) e muda a própria situação (D08, D10).
 * Não conhece o TCC (dependência em um só sentido).
 */
export class Etapa {
  private _situacao: SituacaoEtapa;
  private _entregas: Entrega[];

  constructor(
    readonly id: number,
    readonly ordem: number,
    readonly nome: string,
    situacao: SituacaoEtapa,
    entregas: Entrega[] = [],
    readonly descricao: string | null = null,
    readonly situacaoAtualizadaEm: Date | null = null,
  ) {
    this._situacao = situacao;
    this._entregas = [...entregas].sort((a, b) => a.versao - b.versao);
  }

  get situacao(): SituacaoEtapa {
    return this._situacao;
  }
  get entregas(): readonly Entrega[] {
    return this._entregas;
  }
  get ultimaEntrega(): Entrega | null {
    return this._entregas.at(-1) ?? null;
  }

  /** RN10 + R2: não aceita se já aprovada ou se há entrega aguardando avaliação. */
  verificarAceite(): void {
    if (this._situacao === "APROVADA")
      throw new ErroDeDominio("ETAPA_APROVADA", "Esta etapa já foi aprovada pelo orientador e não aceita novas submissões.");
    if (this._situacao === "AGUARDANDO_AVALIACAO")
      throw new ErroDeDominio("ETAPA_AGUARDANDO", "Já existe uma entrega aguardando avaliação nesta etapa.");
  }

  aceitaSubmissao(): boolean {
    return this._situacao === "PENDENTE" || this._situacao === "ALTERACOES_SOLICITADAS";
  }

  /** RN12: primeira versão = 1; correção = versão seguinte, nunca sobrescreve. */
  proximaVersao(): number {
    return (this.ultimaEntrega?.versao ?? 0) + 1;
  }

  /** R3, R4, R6: cria a Entrega, anexa e passa a etapa para "aguardando avaliação". */
  receberEntrega(c: ConteudoSubmissao): Entrega {
    this.verificarAceite();
    if (!c.arquivoNome && !c.linkExterno?.trim())
      throw new ErroDeDominio("ENTREGA_VAZIA", "Envie um arquivo ou informe um link para a entrega.");
    const entrega = new Entrega({
      etapaId: this.id,
      versao: this.proximaVersao(),
      autorId: c.autorId,
      comentario: c.comentario?.trim() || null,
      arquivoNome: c.arquivoNome,
      arquivoTipo: c.arquivoTipo,
      arquivoTamanho: c.arquivoTamanho,
      linkExterno: c.linkExterno?.trim() || null,
      criadaEm: c.quando,
    });
    this._entregas.push(entrega);
    this._situacao = "AGUARDANDO_AVALIACAO";
    return entrega;
  }

  /** UC06: aprova ou solicita alterações da última entrega. */
  avaliar(avaliadorId: number, decisao: Decisao, parecer: string, quando: Date): { entrega: Entrega; avaliacao: AvaliacaoDados } {
    const entrega = this.ultimaEntrega;
    if (this._situacao !== "AGUARDANDO_AVALIACAO" || !entrega)
      throw new ErroDeDominio("ETAPA_NAO_AGUARDA", "Esta etapa não tem entrega aguardando avaliação.");
    const texto = parecer.trim();
    if (decisao === "ALTERACOES_SOLICITADAS" && texto.length < 5)
      throw new ErroDeDominio("PARECER_OBRIGATORIO", "Descreva as alterações solicitadas (mínimo de 5 caracteres).");
    this._situacao = decisao === "APROVADA" ? "APROVADA" : "ALTERACOES_SOLICITADAS";
    return { entrega, avaliacao: { avaliadorId, decisao, parecer: texto, criadaEm: quando } };
  }
}
