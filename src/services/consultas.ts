import { getDb } from "@/infra/db";
import { RepositorioTCCPostgres } from "@/infra/repositorio-postgres";
import { ErroDeDominio } from "@/domain/erros";
import type { TCC } from "@/domain/tcc";
import type { Usuario } from "./usuarios";

export const DIAS_ALERTA_AVALIACAO = 7;
export const DIAS_ALERTA_PARADO = 30;

export interface LinhaTcc {
  id: number;
  titulo: string;
  modalidade: string;
  area: string | null;
  orientadorId: number | null;
  orientadorNome: string | null;
  integrantes: { id: number; nome: string }[];
  total: number;
  aprovadas: number;
  aguardando: number;
  alteracoes: number;
  pendentes: number;
  percentual: number;
  aguardandoDesde: Date | null;
  ultimaMovimentacao: Date;
  alertas: ("SEM_ORIENTADOR" | "AGUARDANDO_HA_MUITO" | "PARADO")[];
}

const BASE_LINHA = `
SELECT t.id, t.titulo, t.modalidade, t.area, t.orientador_id, o.nome AS orientador_nome, t.criado_em,
  count(e.id)::int AS total,
  count(*) FILTER (WHERE e.situacao = 'APROVADA')::int AS aprovadas,
  count(*) FILTER (WHERE e.situacao = 'AGUARDANDO_AVALIACAO')::int AS aguardando,
  count(*) FILTER (WHERE e.situacao = 'ALTERACOES_SOLICITADAS')::int AS alteracoes,
  count(*) FILTER (WHERE e.situacao = 'PENDENTE')::int AS pendentes,
  min(e.situacao_atualizada_em) FILTER (WHERE e.situacao = 'AGUARDANDO_AVALIACAO') AS aguardando_desde,
  COALESCE(max(e.situacao_atualizada_em), t.criado_em) AS ultima_mov,
  (SELECT json_agg(json_build_object('id', u.id, 'nome', u.nome) ORDER BY ti.entrou_em, u.id)
     FROM tcc_integrante ti JOIN usuario u ON u.id = ti.aluno_id WHERE ti.tcc_id = t.id) AS integrantes
FROM tcc t
LEFT JOIN usuario o ON o.id = t.orientador_id
LEFT JOIN etapa e ON e.tcc_id = t.id`;

function paraLinha(r: any): LinhaTcc {
  const agora = Date.now();
  const dias = (d: Date) => (agora - new Date(d).getTime()) / 86_400_000;
  const alertas: LinhaTcc["alertas"] = [];
  if (!r.orientador_id) alertas.push("SEM_ORIENTADOR");
  if (r.aguardando_desde && dias(r.aguardando_desde) > DIAS_ALERTA_AVALIACAO) alertas.push("AGUARDANDO_HA_MUITO");
  if (r.aprovadas < r.total && dias(r.ultima_mov) > DIAS_ALERTA_PARADO) alertas.push("PARADO");
  return {
    id: r.id,
    titulo: r.titulo,
    modalidade: r.modalidade,
    area: r.area,
    orientadorId: r.orientador_id,
    orientadorNome: r.orientador_nome,
    integrantes: r.integrantes ?? [],
    total: r.total,
    aprovadas: r.aprovadas,
    aguardando: r.aguardando,
    alteracoes: r.alteracoes,
    pendentes: r.pendentes,
    percentual: r.total ? Math.round((r.aprovadas / r.total) * 100) : 0,
    aguardandoDesde: r.aguardando_desde,
    ultimaMovimentacao: r.ultima_mov,
    alertas,
  };
}

/** RNF02: aluno só vê o próprio TCC, professor só o dos seus orientandos, coordenação vê todos. */
export async function carregarTccAutorizado(usuario: Usuario, tccId: number): Promise<TCC> {
  const db = await getDb();
  const tcc = await new RepositorioTCCPostgres(db).carregar(tccId);
  if (!tcc) throw new ErroDeDominio("NAO_ENCONTRADO", "TCC não encontrado.");
  const ok =
    usuario.perfil === "COORDENACAO" ||
    (usuario.perfil === "ALUNO" && tcc.ehIntegrante(usuario.id)) ||
    (usuario.perfil === "PROFESSOR" && tcc.ehOrientador(usuario.id));
  if (!ok) throw new ErroDeDominio("NAO_AUTORIZADO", "Você não tem acesso a este TCC.");
  return tcc;
}

export async function tccDoAluno(alunoId: number): Promise<number | null> {
  const db = await getDb();
  const r = await db.query<{ tcc_id: number }>(`SELECT tcc_id FROM tcc_integrante WHERE aluno_id = $1`, [alunoId]);
  return r.rows[0]?.tcc_id ?? null;
}

export async function nomesUsuarios(ids: number[]): Promise<Map<number, string>> {
  const db = await getDb();
  if (!ids.length) return new Map();
  const r = await db.query<{ id: number; nome: string }>(`SELECT id, nome FROM usuario WHERE id = ANY($1::int[])`, [ids]);
  return new Map(r.rows.map((x) => [x.id, x.nome]));
}

export async function linhaDoTcc(tccId: number): Promise<LinhaTcc | null> {
  const db = await getDb();
  const r = await db.query(`${BASE_LINHA} WHERE t.id = $1 GROUP BY t.id, o.nome`, [tccId]);
  return r.rows[0] ? paraLinha(r.rows[0]) : null;
}

export async function convitesDoTcc(tccId: number) {
  const db = await getDb();
  const dupla = await db.query(
    `SELECT c.id, c.status, c.criado_em, u.nome AS convidado FROM convite_dupla c JOIN usuario u ON u.id = c.convidado_id
      WHERE c.tcc_id = $1 ORDER BY c.criado_em DESC`,
    [tccId],
  );
  const orient = await db.query(
    `SELECT c.id, c.status, c.criado_em, u.nome AS professor FROM convite_orientacao c JOIN usuario u ON u.id = c.professor_id
      WHERE c.tcc_id = $1 ORDER BY c.criado_em DESC`,
    [tccId],
  );
  return { dupla: dupla.rows, orientacao: orient.rows };
}

export async function convitesDuplaRecebidos(alunoId: number) {
  const db = await getDb();
  return (
    await db.query(
      `SELECT c.id, c.criado_em, t.titulo, u.nome AS convidante FROM convite_dupla c
         JOIN tcc t ON t.id = c.tcc_id JOIN usuario u ON u.id = c.convidante_id
        WHERE c.convidado_id = $1 AND c.status = 'PENDENTE' ORDER BY c.criado_em`,
      [alunoId],
    )
  ).rows;
}

export async function convitesOrientacaoRecebidos(profId: number) {
  const db = await getDb();
  return (
    await db.query(
      `SELECT c.id, c.criado_em, t.id AS tcc_id, t.titulo, t.resumo, t.modalidade, u.nome AS convidante,
              (SELECT string_agg(a.nome, ', ' ORDER BY a.nome) FROM tcc_integrante ti JOIN usuario a ON a.id = ti.aluno_id WHERE ti.tcc_id = t.id) AS alunos
         FROM convite_orientacao c JOIN tcc t ON t.id = c.tcc_id JOIN usuario u ON u.id = c.convidante_id
        WHERE c.professor_id = $1 AND c.status = 'PENDENTE' ORDER BY c.criado_em`,
      [profId],
    )
  ).rows;
}

/** UC09 / RF14: dashboard do orientador. */
export async function dashboardProfessor(profId: number) {
  const db = await getDb();
  const orientandos = (await db.query(`${BASE_LINHA} WHERE t.orientador_id = $1 GROUP BY t.id, o.nome ORDER BY t.titulo`, [profId])).rows.map(paraLinha);
  const fila = (
    await db.query(
      `SELECT e.id AS etapa_id, e.nome AS etapa, e.situacao_atualizada_em AS desde, t.id AS tcc_id, t.titulo,
              (SELECT max(versao) FROM entrega WHERE etapa_id = e.id) AS versao,
              (SELECT string_agg(a.nome, ', ' ORDER BY a.nome) FROM tcc_integrante ti JOIN usuario a ON a.id = ti.aluno_id WHERE ti.tcc_id = t.id) AS alunos
         FROM etapa e JOIN tcc t ON t.id = e.tcc_id
        WHERE t.orientador_id = $1 AND e.situacao = 'AGUARDANDO_AVALIACAO' ORDER BY e.situacao_atualizada_em`,
      [profId],
    )
  ).rows;
  return { orientandos, fila, convites: await convitesOrientacaoRecebidos(profId) };
}

export type FiltroCoord = "todos" | "sem-orientador" | "aguardando" | "alertas";

/** UC10 / RF15: visão geral da coordenação. */
export async function dashboardCoordenacao(filtro: FiltroCoord = "todos") {
  const db = await getDb();
  const todos = (await db.query(`${BASE_LINHA} GROUP BY t.id, o.nome ORDER BY t.titulo`)).rows.map(paraLinha);
  const linhas = todos.filter((l) => {
    if (filtro === "sem-orientador") return l.alertas.includes("SEM_ORIENTADOR");
    if (filtro === "aguardando") return l.aguardando > 0;
    if (filtro === "alertas") return l.alertas.length > 0;
    return true;
  });
  const soma = (f: (l: LinhaTcc) => number) => todos.reduce((a, l) => a + f(l), 0);
  return {
    linhas,
    kpis: {
      tccs: todos.length,
      semOrientador: todos.filter((l) => l.alertas.includes("SEM_ORIENTADOR")).length,
      aguardando: soma((l) => l.aguardando),
      comAlerta: todos.filter((l) => l.alertas.length > 0).length,
      progressoMedio: todos.length ? Math.round(todos.reduce((a, l) => a + l.percentual, 0) / todos.length) : 0,
    },
    etapas: {
      aprovadas: soma((l) => l.aprovadas),
      aguardando: soma((l) => l.aguardando),
      alteracoes: soma((l) => l.alteracoes),
      pendentes: soma((l) => l.pendentes),
    },
  };
}

export async function listarAuditoria(limite = 200) {
  const db = await getDb();
  return (
    await db.query(
      `SELECT l.*, t.titulo AS tcc_titulo FROM log_auditoria l LEFT JOIN tcc t ON t.id = l.tcc_id ORDER BY l.criado_em DESC, l.id DESC LIMIT $1`,
      [limite],
    )
  ).rows;
}

export async function notificacoesDe(usuarioId: number) {
  const db = await getDb();
  return (await db.query(`SELECT * FROM notificacao WHERE destinatario_id = $1 ORDER BY criada_em DESC, id DESC LIMIT 50`, [usuarioId])).rows;
}
export async function contarNaoLidas(usuarioId: number): Promise<number> {
  const db = await getDb();
  return (await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM notificacao WHERE destinatario_id = $1 AND NOT lida`, [usuarioId])).rows[0].n;
}
export async function marcarLidas(usuarioId: number) {
  const db = await getDb();
  await db.query(`UPDATE notificacao SET lida = true WHERE destinatario_id = $1 AND NOT lida`, [usuarioId]);
}

/** Download de arquivo de entrega, com a mesma regra de acesso do TCC (RNF02). */
export async function arquivoDaEntrega(usuario: Usuario, entregaId: number) {
  const db = await getDb();
  const r = await db.query(
    `SELECT e.arquivo_nome, e.arquivo_tipo, e.arquivo_dados, et.tcc_id FROM entrega e JOIN etapa et ON et.id = e.etapa_id WHERE e.id = $1`,
    [entregaId],
  );
  const row = r.rows[0];
  if (!row || !row.arquivo_dados) throw new ErroDeDominio("NAO_ENCONTRADO", "Arquivo não encontrado.");
  await carregarTccAutorizado(usuario, row.tcc_id);
  return { nome: row.arquivo_nome as string, tipo: (row.arquivo_tipo as string) || "application/octet-stream", dados: row.arquivo_dados as Uint8Array };
}
