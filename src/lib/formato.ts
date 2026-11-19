const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const fmtDia = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" });

export const dataHora = (d: Date | string | null | undefined) => (d ? fmt.format(new Date(d)) : "—");
export const dia = (d: Date | string | null | undefined) => (d ? fmtDia.format(new Date(d)) : "—");

export function haQuanto(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dias = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "há 1 dia";
  return `há ${dias} dias`;
}

export function tamanho(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const ROTULO_ACAO: Record<string, string> = {
  CADASTRO_USUARIO: "Cadastro de usuário",
  CADASTRO_PREPROJETO: "Cadastro de pré-projeto",
  CONVITE_DUPLA: "Convite de dupla",
  ACEITE_DUPLA: "Aceite de dupla",
  RECUSA_DUPLA: "Recusa de dupla",
  CONVITE_ORIENTACAO: "Convite de orientação",
  ACEITE_ORIENTACAO: "Aceite de orientação",
  RECUSA_ORIENTACAO: "Recusa de orientação",
  SUBMISSAO: "Submissão de etapa",
  NOVA_VERSAO: "Nova versão de etapa",
  APROVACAO: "Aprovação de etapa",
  SOLICITACAO_ALTERACAO: "Solicitação de alterações",
};
