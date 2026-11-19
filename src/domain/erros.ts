export type CodigoErro =
  | "NAO_AUTORIZADO"
  | "NAO_INTEGRANTE"
  | "NAO_ORIENTADOR"
  | "ETAPA_APROVADA"
  | "ETAPA_AGUARDANDO"
  | "ETAPA_NAO_AGUARDA"
  | "ENTREGA_VAZIA"
  | "PARECER_OBRIGATORIO"
  | "NAO_ENCONTRADO"
  | "ALUNO_JA_VINCULADO"
  | "TCC_COMPLETO"
  | "JA_TEM_ORIENTADOR"
  | "CONVITE_PENDENTE"
  | "CONVITE_INVALIDO"
  | "DADOS_INVALIDOS"
  | "PERFIL_INCORRETO"
  | "ARQUIVO_GRANDE";

/** Erro de regra de negócio: a mensagem é segura para exibir ao usuário. */
export class ErroDeDominio extends Error {
  constructor(public readonly codigo: CodigoErro, mensagem: string) {
    super(mensagem);
    this.name = "ErroDeDominio";
  }
}
