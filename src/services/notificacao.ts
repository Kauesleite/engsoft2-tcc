import { getDb, type Executor } from "@/infra/db";
import { barramento, type AvaliacaoRegistrada, type EntregaRegistrada } from "@/domain/eventos";

/** Canal de envio (D07): trocar/adicionar canais não afeta o núcleo da submissão (Missão 4, Mudança 1). */
export interface CanalNotificacao {
  nome: string;
  enviar(db: Executor, m: { destinatarioId: number; tccId: number | null; mensagem: string; link: string }): Promise<void>;
}

export const CanalSistema: CanalNotificacao = {
  nome: "sistema",
  async enviar(db, m) {
    await db.query(`INSERT INTO notificacao (destinatario_id, tcc_id, mensagem, link) VALUES ($1,$2,$3,$4)`, [
      m.destinatarioId,
      m.tccId,
      m.mensagem,
      m.link,
    ]);
  },
};

/** Canal de e-mail simulado (sem SMTP nesta versão): registra no log do servidor. */
export const CanalEmailSimulado: CanalNotificacao = {
  nome: "email-simulado",
  async enviar(db, m) {
    const u = await db.query<{ email: string }>(`SELECT email FROM usuario WHERE id = $1`, [m.destinatarioId]);
    console.log(`[e-mail simulado] para ${u.rows[0]?.email}: ${m.mensagem}`);
  },
};

export const canais: CanalNotificacao[] = [CanalSistema, CanalEmailSimulado];

export async function notificar(destinatarioId: number, tccId: number | null, mensagem: string, link: string) {
  const db = await getDb();
  for (const c of canais) await c.enviar(db, { destinatarioId, tccId, mensagem, link });
}

/** ServicoNotificacao: escuta os eventos do domínio (R7). */
export function registrarAssinantes() {
  barramento.limpar();
  barramento.assinar<EntregaRegistrada>("EntregaRegistrada", async (e) => {
    if (!e.orientadorId) return; // sem orientador ativo ainda: ninguém a avisar
    await notificar(
      e.orientadorId,
      e.tccId,
      `${e.autorNome} enviou a versão ${e.versao} da etapa "${e.etapaNome}" (${e.tccTitulo}).`,
      `/tcc/${e.tccId}/etapa/${e.etapaId}`,
    );
  });
  barramento.assinar<AvaliacaoRegistrada>("AvaliacaoRegistrada", async (e) => {
    const texto = e.decisao === "APROVADA" ? "aprovou" : "solicitou alterações em";
    for (const alunoId of e.integrantes)
      await notificar(alunoId, e.tccId, `${e.avaliadorNome} ${texto} a etapa "${e.etapaNome}".`, `/tcc/${e.tccId}/etapa/${e.etapaId}`);
  });
}
registrarAssinantes();
