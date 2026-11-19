import { ErroDeDominio } from "./erros";
import { Etapa } from "./etapa";

/** D11 (decisão provisória): lista fixa de etapas, igual para todos os TCCs. */
export const ETAPAS_PADRAO: { nome: string; descricao: string }[] = [
  { nome: "Introdução e definição do problema", descricao: "Contexto, problema, objetivos e justificativa do trabalho." },
  { nome: "Fundamentação teórica", descricao: "Revisão da literatura e conceitos que sustentam o trabalho." },
  { nome: "Metodologia", descricao: "Métodos, ferramentas e procedimentos adotados." },
  { nome: "Desenvolvimento / implementação", descricao: "Construção da solução, estudo ou experimento." },
  { nome: "Resultados e discussão", descricao: "Apresentação e análise dos resultados obtidos." },
  { nome: "Considerações finais", descricao: "Conclusões, limitações e trabalhos futuros." },
  { nome: "Versão final revisada", descricao: "Texto completo com todas as correções incorporadas." },
];

export const MAX_INTEGRANTES = 2; // RN01

export interface ResumoProgresso {
  aprovadas: number;
  total: number;
  percentual: number;
}

/**
 * TCC: conhece integrantes (no máximo dois – RN01), orientador ativo (RN06) e etapas.
 * Responde se um aluno é integrante (R1) e calcula o progresso (RN13).
 */
export class TCC {
  constructor(
    readonly id: number,
    readonly titulo: string,
    readonly resumo: string,
    readonly area: string | null,
    readonly integrantes: readonly number[],
    readonly orientadorId: number | null,
    readonly etapas: readonly Etapa[],
    readonly modalidade: "INDIVIDUAL" | "DUPLA" = "INDIVIDUAL",
    readonly criadoPor: number | null = null,
  ) {
    if (integrantes.length > MAX_INTEGRANTES)
      throw new ErroDeDominio("TCC_COMPLETO", "Um TCC pode ter no máximo dois integrantes.");
  }

  ehIntegrante(alunoId: number): boolean {
    return this.integrantes.includes(alunoId);
  }
  ehOrientador(professorId: number): boolean {
    return this.orientadorId !== null && this.orientadorId === professorId;
  }
  podeReceberIntegrante(): boolean {
    return this.integrantes.length < MAX_INTEGRANTES;
  }
  etapa(etapaId: number): Etapa {
    const e = this.etapas.find((x) => x.id === etapaId);
    if (!e) throw new ErroDeDominio("NAO_ENCONTRADO", "Etapa não encontrada neste TCC.");
    return e;
  }

  /** RN13: etapas aprovadas / total de etapas previstas. */
  progresso(): ResumoProgresso {
    const total = this.etapas.length;
    const aprovadas = this.etapas.filter((e) => e.situacao === "APROVADA").length;
    return { aprovadas, total, percentual: total === 0 ? 0 : Math.round((aprovadas / total) * 100) };
  }
}
