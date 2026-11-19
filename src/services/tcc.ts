import { getDb, type Executor } from "@/infra/db";
import { ErroDeDominio } from "@/domain/erros";
import { ETAPAS_PADRAO, MAX_INTEGRANTES } from "@/domain/tcc";
import { registrarAuditoria } from "./auditoria";
import { notificar } from "./notificacao";
import type { Usuario } from "./usuarios";

async function nomeDe(tx: Executor, id: number) {
  return (await tx.query<{ nome: string }>(`SELECT nome FROM usuario WHERE id = $1`, [id])).rows[0]?.nome ?? "?";
}
function exigirAluno(u: Usuario) {
  if (u.perfil !== "ALUNO") throw new ErroDeDominio("PERFIL_INCORRETO", "Esta ação é exclusiva de alunos.");
}

/** UC01 / RF02: cadastra o pré-projeto, cria o TCC e as etapas previstas. RN04: aluno só em um TCC. */
export async function cadastrarPreProjeto(aluno: Usuario, d: { titulo: string; resumo: string; area?: string }) {
  exigirAluno(aluno);
  const titulo = d.titulo?.trim();
  const resumo = d.resumo?.trim();
  if (!titulo || titulo.length < 5) throw new ErroDeDominio("DADOS_INVALIDOS", "Informe um título para o pré-projeto.");
  if (!resumo || resumo.length < 20) throw new ErroDeDominio("DADOS_INVALIDOS", "Descreva o pré-projeto (mínimo de 20 caracteres).");
  const db = await getDb();
  return db.transaction(async (tx) => {
    const ja = await tx.query(`SELECT 1 FROM tcc_integrante WHERE aluno_id = $1`, [aluno.id]);
    if (ja.rows[0]) throw new ErroDeDominio("ALUNO_JA_VINCULADO", "Você já está vinculado a um TCC (RN04).");
    const t = await tx.query<{ id: number }>(
      `INSERT INTO tcc (titulo, resumo, area, criado_por) VALUES ($1,$2,$3,$4) RETURNING id`,
      [titulo, resumo, d.area?.trim() || null, aluno.id],
    );
    const tccId = t.rows[0].id;
    await tx.query(`INSERT INTO tcc_integrante (tcc_id, aluno_id) VALUES ($1,$2)`, [tccId, aluno.id]);
    for (const [i, e] of ETAPAS_PADRAO.entries())
      await tx.query(`INSERT INTO etapa (tcc_id, ordem, nome, descricao) VALUES ($1,$2,$3,$4)`, [tccId, i + 1, e.nome, e.descricao]);
    await registrarAuditoria(tx, aluno, "CADASTRO_PREPROJETO", "tcc", tccId, tccId, titulo);
    return tccId;
  });
}

async function carregarTccTravado(tx: Executor, tccId: number) {
  const t = (await tx.query(`SELECT * FROM tcc WHERE id = $1 FOR UPDATE`, [tccId])).rows[0];
  if (!t) throw new ErroDeDominio("NAO_ENCONTRADO", "TCC não encontrado.");
  return t as { id: number; titulo: string; orientador_id: number | null; criado_por: number };
}
async function ehIntegrante(tx: Executor, tccId: number, alunoId: number) {
  return !!(await tx.query(`SELECT 1 FROM tcc_integrante WHERE tcc_id = $1 AND aluno_id = $2`, [tccId, alunoId])).rows[0];
}
async function buscarPorEmail(tx: Executor, email: string, perfil: "ALUNO" | "PROFESSOR") {
  const u = (await tx.query<{ id: number; nome: string }>(`SELECT id, nome FROM usuario WHERE email = $1 AND perfil = $2`, [
    email.trim().toLowerCase(),
    perfil,
  ])).rows[0];
  if (!u)
    throw new ErroDeDominio(
      "NAO_ENCONTRADO",
      perfil === "ALUNO" ? "Nenhum aluno cadastrado com este e-mail." : "Nenhum professor cadastrado com este e-mail.",
    );
  return u;
}

/** UC02 / RF03 / RN02: só o aluno que cadastrou o pré-projeto convida outro aluno cadastrado. */
export async function convidarParceiro(aluno: Usuario, tccId: number, emailColega: string) {
  exigirAluno(aluno);
  const db = await getDb();
  return db.transaction(async (tx) => {
    const t = await carregarTccTravado(tx, tccId);
    if (t.criado_por !== aluno.id) throw new ErroDeDominio("NAO_AUTORIZADO", "Somente quem cadastrou o pré-projeto pode convidar o parceiro (RN02).");
    const n = (await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM tcc_integrante WHERE tcc_id = $1`, [tccId])).rows[0].n;
    if (n >= MAX_INTEGRANTES) throw new ErroDeDominio("TCC_COMPLETO", "O TCC já tem dois integrantes (RN01).");
    const colega = await buscarPorEmail(tx, emailColega, "ALUNO");
    if (colega.id === aluno.id) throw new ErroDeDominio("DADOS_INVALIDOS", "Você não pode convidar a si mesmo.");
    if ((await tx.query(`SELECT 1 FROM tcc_integrante WHERE aluno_id = $1`, [colega.id])).rows[0])
      throw new ErroDeDominio("ALUNO_JA_VINCULADO", `${colega.nome} já está vinculado a um TCC (RN04).`);
    if ((await tx.query(`SELECT 1 FROM convite_dupla WHERE tcc_id = $1 AND status = 'PENDENTE'`, [tccId])).rows[0])
      throw new ErroDeDominio("CONVITE_PENDENTE", "Já existe um convite de dupla pendente para este TCC.");
    const c = (await tx.query<{ id: number }>(
      `INSERT INTO convite_dupla (tcc_id, convidante_id, convidado_id) VALUES ($1,$2,$3) RETURNING id`,
      [tccId, aluno.id, colega.id],
    )).rows[0];
    await registrarAuditoria(tx, aluno, "CONVITE_DUPLA", "convite_dupla", c.id, tccId, `Convidado: ${colega.nome}`);
    return { conviteId: c.id, convidadoId: colega.id, titulo: t.titulo, nomeConvidante: aluno.nome };
  }).then(async (r) => {
    await notificar(r.convidadoId, tccId, `${r.nomeConvidante} convidou você para formar dupla no TCC "${r.titulo}".`, "/aluno");
    return r.conviteId;
  });
}

/** UC02 / RF04 / RN03: o vínculo só se efetiva após o aceite. */
export async function responderConviteDupla(aluno: Usuario, conviteId: number, aceitar: boolean) {
  exigirAluno(aluno);
  const db = await getDb();
  const r = await db.transaction(async (tx) => {
    const c = (await tx.query(`SELECT * FROM convite_dupla WHERE id = $1 FOR UPDATE`, [conviteId])).rows[0];
    if (!c || c.convidado_id !== aluno.id || c.status !== "PENDENTE")
      throw new ErroDeDominio("CONVITE_INVALIDO", "Convite inexistente ou já respondido.");
    const t = await carregarTccTravado(tx, c.tcc_id);
    if (aceitar) {
      if ((await tx.query(`SELECT 1 FROM tcc_integrante WHERE aluno_id = $1`, [aluno.id])).rows[0])
        throw new ErroDeDominio("ALUNO_JA_VINCULADO", "Você já está vinculado a um TCC (RN04).");
      const n = (await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM tcc_integrante WHERE tcc_id = $1`, [c.tcc_id])).rows[0].n;
      if (n >= MAX_INTEGRANTES) throw new ErroDeDominio("TCC_COMPLETO", "O TCC já tem dois integrantes (RN01).");
      await tx.query(`INSERT INTO tcc_integrante (tcc_id, aluno_id) VALUES ($1,$2)`, [c.tcc_id, aluno.id]);
      await tx.query(`UPDATE tcc SET modalidade = 'DUPLA' WHERE id = $1`, [c.tcc_id]);
    }
    await tx.query(`UPDATE convite_dupla SET status = $2, respondido_em = now() WHERE id = $1`, [conviteId, aceitar ? "ACEITO" : "RECUSADO"]);
    await registrarAuditoria(tx, aluno, aceitar ? "ACEITE_DUPLA" : "RECUSA_DUPLA", "convite_dupla", conviteId, c.tcc_id, t.titulo);
    return { convidanteId: c.convidante_id as number, tccId: c.tcc_id as number, titulo: t.titulo };
  });
  await notificar(r.convidanteId, r.tccId, `${aluno.nome} ${aceitar ? "aceitou" : "recusou"} o convite para a dupla.`, `/tcc/${r.tccId}`);
}

/** UC03 / RF05 / RN06: convite de orientação (qualquer integrante), se ainda não há orientador ativo. */
export async function convidarOrientador(aluno: Usuario, tccId: number, emailProfessor: string) {
  exigirAluno(aluno);
  const db = await getDb();
  const r = await db.transaction(async (tx) => {
    const t = await carregarTccTravado(tx, tccId);
    if (!(await ehIntegrante(tx, tccId, aluno.id))) throw new ErroDeDominio("NAO_INTEGRANTE", "Você não está vinculado a este TCC.");
    if (t.orientador_id) throw new ErroDeDominio("JA_TEM_ORIENTADOR", "Este TCC já possui orientador ativo (RN06).");
    if ((await tx.query(`SELECT 1 FROM convite_orientacao WHERE tcc_id = $1 AND status = 'PENDENTE'`, [tccId])).rows[0])
      throw new ErroDeDominio("CONVITE_PENDENTE", "Já existe um convite de orientação pendente para este TCC.");
    const prof = await buscarPorEmail(tx, emailProfessor, "PROFESSOR");
    const c = (await tx.query<{ id: number }>(
      `INSERT INTO convite_orientacao (tcc_id, convidante_id, professor_id) VALUES ($1,$2,$3) RETURNING id`,
      [tccId, aluno.id, prof.id],
    )).rows[0];
    await registrarAuditoria(tx, aluno, "CONVITE_ORIENTACAO", "convite_orientacao", c.id, tccId, `Professor: ${prof.nome}`);
    return { id: c.id, profId: prof.id, titulo: t.titulo };
  });
  await notificar(r.profId, tccId, `${aluno.nome} convidou você para orientar o TCC "${r.titulo}".`, "/professor");
  return r.id;
}

/** UC04 / RF06 / RN07: a orientação só fica ativa após o aceite do professor. */
export async function responderConviteOrientacao(prof: Usuario, conviteId: number, aceitar: boolean) {
  if (prof.perfil !== "PROFESSOR") throw new ErroDeDominio("PERFIL_INCORRETO", "Esta ação é exclusiva de professores.");
  const db = await getDb();
  const r = await db.transaction(async (tx) => {
    const c = (await tx.query(`SELECT * FROM convite_orientacao WHERE id = $1 FOR UPDATE`, [conviteId])).rows[0];
    if (!c || c.professor_id !== prof.id || c.status !== "PENDENTE")
      throw new ErroDeDominio("CONVITE_INVALIDO", "Convite inexistente ou já respondido.");
    const t = await carregarTccTravado(tx, c.tcc_id);
    if (aceitar) {
      if (t.orientador_id) throw new ErroDeDominio("JA_TEM_ORIENTADOR", "Este TCC já possui orientador ativo (RN06).");
      await tx.query(`UPDATE tcc SET orientador_id = $2 WHERE id = $1`, [c.tcc_id, prof.id]);
    }
    await tx.query(`UPDATE convite_orientacao SET status = $2, respondido_em = now() WHERE id = $1`, [conviteId, aceitar ? "ACEITO" : "RECUSADO"]);
    await registrarAuditoria(tx, prof, aceitar ? "ACEITE_ORIENTACAO" : "RECUSA_ORIENTACAO", "convite_orientacao", conviteId, c.tcc_id, t.titulo);
    const integrantes = (await tx.query<{ aluno_id: number }>(`SELECT aluno_id FROM tcc_integrante WHERE tcc_id = $1`, [c.tcc_id])).rows.map((x) => x.aluno_id);
    return { tccId: c.tcc_id as number, titulo: t.titulo, integrantes };
  });
  for (const id of r.integrantes)
    await notificar(id, r.tccId, `${prof.nome} ${aceitar ? "aceitou orientar" : "recusou orientar"} o TCC "${r.titulo}".`, `/tcc/${r.tccId}`);
}
