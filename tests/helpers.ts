import { criarPglite, __definirDbParaTestes, type Database } from "@/infra/db";
import { garantirEsquema } from "@/infra/schema";
import { cadastrarUsuario, type Usuario } from "@/services/usuarios";
import { registrarAssinantes } from "@/services/notificacao";

export async function novoBanco(): Promise<Database> {
  const db = await criarPglite();
  __definirDbParaTestes(db);
  await garantirEsquema(db);
  registrarAssinantes();
  return db;
}

export async function criarUsuarios() {
  const mk = (nome: string, perfil: string): Promise<Usuario> =>
    cadastrarUsuario({ nome, email: `${nome.split(" ")[0].toLowerCase()}@t.com`, senha: "123456", perfil });
  const [ana, bruno, carla, rafael, helena] = await Promise.all([
    mk("Ana Souza", "ALUNO"),
    mk("Bruno Lima", "ALUNO"),
    mk("Carla Dias", "ALUNO"),
    mk("Rafael Prof", "PROFESSOR"),
    mk("Helena Prof", "PROFESSOR"),
  ]);
  return { ana, bruno, carla, rafael, helena };
}

/** Monta uma dupla (Ana + Bruno) com orientador ativo (Rafael) e devolve os ids das etapas. */
export async function montarDuplaComOrientador(db: Database, u: Awaited<ReturnType<typeof criarUsuarios>>) {
  const { cadastrarPreProjeto, convidarParceiro, responderConviteDupla, convidarOrientador, responderConviteOrientacao } = await import("@/services/tcc");
  const tccId = await cadastrarPreProjeto(u.ana, { titulo: "Sistema de teste ProTCC", resumo: "Resumo suficientemente longo para o teste de cadastro." });
  const cd = await convidarParceiro(u.ana, tccId, u.bruno.email);
  await responderConviteDupla(u.bruno, cd, true);
  const co = await convidarOrientador(u.ana, tccId, u.rafael.email);
  await responderConviteOrientacao(u.rafael, co, true);
  const etapas = (await db.query<{ id: number; ordem: number }>(`SELECT id, ordem FROM etapa WHERE tcc_id = $1 ORDER BY ordem`, [tccId])).rows;
  return { tccId, etapa: (ordem: number) => etapas.find((e) => e.ordem === ordem)!.id };
}
