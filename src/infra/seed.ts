import bcrypt from "bcryptjs";
import type { Database, Executor } from "./db";
import { ETAPAS_PADRAO } from "@/domain/tcc";

export const SENHA_DEMO = "protcc123";
const diasAtras = (n: number) => new Date(Date.now() - n * 86_400_000);

export const CONTAS_DEMO = [
  { chave: "coord", nome: "Profa. Carla Nogueira", email: "coordenacao@protcc.demo", perfil: "COORDENACAO", papel: "Coordenação do curso" },
  { chave: "rafael", nome: "Prof. Rafael Monteiro", email: "rafael@protcc.demo", perfil: "PROFESSOR", papel: "Orientador (2 TCCs)" },
  { chave: "helena", nome: "Profa. Helena Cardoso", email: "helena@protcc.demo", perfil: "PROFESSOR", papel: "Orientadora (1 TCC)" },
  { chave: "marcos", nome: "Prof. Marcos Tavares", email: "marcos@protcc.demo", perfil: "PROFESSOR", papel: "Tem convite de orientação pendente" },
  { chave: "ana", nome: "Ana Beatriz Souza", email: "ana@protcc.demo", perfil: "ALUNO", papel: "Dupla com Bruno · tem etapa com alterações solicitadas" },
  { chave: "bruno", nome: "Bruno Almeida", email: "bruno@protcc.demo", perfil: "ALUNO", papel: "Dupla com Ana" },
  { chave: "camila", nome: "Camila Ferreira", email: "camila@protcc.demo", perfil: "ALUNO", papel: "TCC individual · entrega aguardando há 10 dias" },
  { chave: "diego", nome: "Diego Martins", email: "diego@protcc.demo", perfil: "ALUNO", papel: "TCC individual · sem movimentação há mais de 30 dias" },
  { chave: "eduarda", nome: "Eduarda Lima", email: "eduarda@protcc.demo", perfil: "ALUNO", papel: "Convite de orientação pendente" },
  { chave: "felipe", nome: "Felipe Rocha", email: "felipe@protcc.demo", perfil: "ALUNO", papel: "Convidou Gabriela para dupla" },
  { chave: "gabriela", nome: "Gabriela Nunes", email: "gabriela@protcc.demo", perfil: "ALUNO", papel: "Tem convite de dupla pendente" },
  { chave: "henrique", nome: "Henrique Costa", email: "henrique@protcc.demo", perfil: "ALUNO", papel: "Sem TCC (cadastrar pré-projeto)" },
] as const;

type SitSeed = "PENDENTE" | "AGUARDANDO_AVALIACAO" | "ALTERACOES_SOLICITADAS" | "APROVADA";
interface EntregaSeed {
  autor: string;
  dias: number;
  comentario: string;
  arquivo?: string;
  link?: string;
  av?: { dec: "APROVADA" | "ALTERACOES_SOLICITADAS"; parecer: string; dias: number };
}
type EtapaSeed = { situacao: SitSeed; entregas?: EntregaSeed[] } | null;

interface TccSeed {
  titulo: string;
  resumo: string;
  area: string;
  alunos: string[];
  orientador: string | null;
  criadoHa: number;
  etapas: EtapaSeed[];
}

const TCCS: TccSeed[] = [
  {
    titulo: "Sistema de recomendação de rotas para o transporte coletivo de Macapá",
    resumo: "Aplicação web que sugere rotas de ônibus combinando horários, lotação e acessibilidade, a partir de dados abertos do transporte coletivo da cidade.",
    area: "Sistemas de informação",
    alunos: ["ana", "bruno"],
    orientador: "rafael",
    criadoHa: 70,
    etapas: [
      { situacao: "APROVADA", entregas: [{ autor: "ana", dias: 60, comentario: "Primeira versão da introdução.", arquivo: "introducao_v1.txt", av: { dec: "APROVADA", parecer: "Problema bem delimitado. Aprovado.", dias: 57 } }] },
      {
        situacao: "ALTERACOES_SOLICITADAS",
        entregas: [
          { autor: "ana", dias: 30, comentario: "Fundamentação teórica – primeira versão.", arquivo: "fundamentacao_v1.txt", av: { dec: "ALTERACOES_SOLICITADAS", parecer: "Faltam referências sobre grafos e sobre sistemas de recomendação. Incluir ao menos 10 fontes recentes.", dias: 4 } },
        ],
      },
      { situacao: "PENDENTE" },
      { situacao: "AGUARDANDO_AVALIACAO", entregas: [{ autor: "bruno", dias: 2, comentario: "Protótipo inicial do módulo de rotas (enviado fora de ordem, antes da metodologia).", link: "https://github.com/exemplo/rotas-macapa" }] },
      null,
      null,
      null,
    ],
  },
  {
    titulo: "Aplicativo para monitoramento da qualidade da água em comunidades ribeirinhas",
    resumo: "Aplicativo móvel offline-first para registrar medições de pH e turbidez e gerar alertas para as comunidades ribeirinhas do Amapá.",
    area: "Computação móvel",
    alunos: ["camila"],
    orientador: "helena",
    criadoHa: 90,
    etapas: [
      { situacao: "APROVADA", entregas: [{ autor: "camila", dias: 75, comentario: "Introdução.", arquivo: "introducao.txt", av: { dec: "APROVADA", parecer: "Ok.", dias: 72 } }] },
      { situacao: "APROVADA", entregas: [{ autor: "camila", dias: 60, comentario: "Fundamentação teórica.", arquivo: "fundamentacao.txt", av: { dec: "APROVADA", parecer: "Boa revisão da literatura.", dias: 55 } }] },
      { situacao: "APROVADA", entregas: [{ autor: "camila", dias: 40, comentario: "Metodologia.", arquivo: "metodologia.txt", av: { dec: "APROVADA", parecer: "Metodologia adequada.", dias: 35 } }] },
      { situacao: "AGUARDANDO_AVALIACAO", entregas: [{ autor: "camila", dias: 10, comentario: "Primeira versão do aplicativo (APK) e documentação.", link: "https://drive.google.com/exemplo-app-agua" }] },
      null,
      null,
      null,
    ],
  },
  {
    titulo: "Análise de desempenho de algoritmos de ordenação em sistemas embarcados",
    resumo: "Estudo experimental comparando algoritmos de ordenação em microcontroladores de baixo custo, medindo tempo de execução e consumo de memória.",
    area: "Sistemas embarcados",
    alunos: ["diego"],
    orientador: "rafael",
    criadoHa: 120,
    etapas: [
      { situacao: "APROVADA", entregas: [{ autor: "diego", dias: 100, comentario: "Introdução.", arquivo: "introducao.txt", av: { dec: "APROVADA", parecer: "Aprovado.", dias: 98 } }] },
      null,
      null,
      null,
      null,
      null,
      null,
    ],
  },
  {
    titulo: "Plataforma de gamificação para o ensino de lógica de programação",
    resumo: "Plataforma web com desafios, pontuação e conquistas para apoiar o ensino de lógica de programação em turmas do ensino médio técnico.",
    area: "Informática na educação",
    alunos: ["eduarda"],
    orientador: null,
    criadoHa: 5,
    etapas: [null, null, null, null, null, null, null],
  },
  {
    titulo: "Painel de visualização de dados abertos de saúde pública do Amapá",
    resumo: "Painel interativo que reúne dados abertos de saúde do estado e permite filtrar por município e período.",
    area: "Ciência de dados",
    alunos: ["felipe"],
    orientador: null,
    criadoHa: 3,
    etapas: [null, null, null, null, null, null, null],
  },
];

async function inserirUsuarios(tx: Executor, hash: string) {
  const ids: Record<string, number> = {};
  for (const u of CONTAS_DEMO) {
    const r = await tx.query<{ id: number }>(
      `INSERT INTO usuario (nome, email, senha_hash, perfil, matricula, criado_em) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [u.nome, u.email, hash, u.perfil, u.perfil === "ALUNO" ? `2022${String(1000 + Object.keys(ids).length)}` : null, diasAtras(150)],
    );
    ids[u.chave] = r.rows[0].id;
  }
  return ids;
}

export async function semearDemo(db: Database) {
  const hash = await bcrypt.hash(SENHA_DEMO, 8);
  await db.transaction(async (tx) => {
    const ids = await inserirUsuarios(tx, hash);
    const nome = (k: string) => CONTAS_DEMO.find((c) => c.chave === k)!.nome;
    const log = (k: string | null, acao: string, ent: string, entId: number | null, tccId: number | null, det: string, d: number) =>
      tx.query(
        `INSERT INTO log_auditoria (usuario_id, usuario_nome, acao, entidade, entidade_id, tcc_id, detalhes, criado_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [k ? ids[k] : null, k ? nome(k) : "Sistema", acao, ent, entId, tccId, det, diasAtras(d)],
      );
    const tccIds: number[] = [];

    for (const t of TCCS) {
      const dupla = t.alunos.length === 2;
      const r = await tx.query<{ id: number }>(
        `INSERT INTO tcc (titulo, resumo, area, modalidade, orientador_id, criado_por, criado_em) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [t.titulo, t.resumo, t.area, dupla ? "DUPLA" : "INDIVIDUAL", t.orientador ? ids[t.orientador] : null, ids[t.alunos[0]], diasAtras(t.criadoHa)],
      );
      const tccId = r.rows[0].id;
      tccIds.push(tccId);
      for (const a of t.alunos) await tx.query(`INSERT INTO tcc_integrante (tcc_id, aluno_id, entrou_em) VALUES ($1,$2,$3)`, [tccId, ids[a], diasAtras(t.criadoHa)]);
      await log(t.alunos[0], "CADASTRO_PREPROJETO", "tcc", tccId, tccId, t.titulo, t.criadoHa);
      if (dupla) {
        await log(t.alunos[0], "CONVITE_DUPLA", "convite_dupla", null, tccId, `Convidado: ${nome(t.alunos[1])}`, t.criadoHa - 0.5);
        await log(t.alunos[1], "ACEITE_DUPLA", "convite_dupla", null, tccId, t.titulo, t.criadoHa - 1);
      }
      if (t.orientador) {
        await log(t.alunos[0], "CONVITE_ORIENTACAO", "convite_orientacao", null, tccId, `Professor: ${nome(t.orientador)}`, t.criadoHa - 2);
        await log(t.orientador, "ACEITE_ORIENTACAO", "convite_orientacao", null, tccId, t.titulo, t.criadoHa - 3);
      }

      for (const [i, def] of ETAPAS_PADRAO.entries()) {
        const spec = t.etapas[i];
        const entregas = spec?.entregas ?? [];
        let ultimo = t.criadoHa;
        for (const e of entregas) ultimo = Math.min(ultimo, e.av ? e.av.dias : e.dias);
        const er = await tx.query<{ id: number }>(
          `INSERT INTO etapa (tcc_id, ordem, nome, descricao, situacao, situacao_atualizada_em) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [tccId, i + 1, def.nome, def.descricao, spec?.situacao ?? "PENDENTE", diasAtras(ultimo)],
        );
        const etapaId = er.rows[0].id;
        for (const [v, e] of entregas.entries()) {
          const dados = e.arquivo ? Buffer.from(`ProTCC – arquivo de demonstração\nEtapa: ${def.nome}\nVersão: ${v + 1}\nAutor: ${nome(e.autor)}\n`) : null;
          const en = await tx.query<{ id: number }>(
            `INSERT INTO entrega (etapa_id, versao, autor_id, comentario, arquivo_nome, arquivo_tipo, arquivo_tamanho, arquivo_dados, link_externo, criada_em)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
            [etapaId, v + 1, ids[e.autor], e.comentario, e.arquivo ?? null, e.arquivo ? "text/plain" : null, dados?.length ?? null, dados, e.link ?? null, diasAtras(e.dias)],
          );
          await log(e.autor, v === 0 ? "SUBMISSAO" : "NOVA_VERSAO", "entrega", en.rows[0].id, tccId, `Etapa "${def.nome}" – versão ${v + 1}`, e.dias);
          if (e.av) {
            const av = await tx.query<{ id: number }>(
              `INSERT INTO avaliacao (entrega_id, avaliador_id, decisao, parecer, criada_em) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
              [en.rows[0].id, ids[t.orientador!], e.av.dec, e.av.parecer, diasAtras(e.av.dias)],
            );
            await log(t.orientador!, e.av.dec === "APROVADA" ? "APROVACAO" : "SOLICITACAO_ALTERACAO", "avaliacao", av.rows[0].id, tccId, `Etapa "${def.nome}" – versão ${v + 1}`, e.av.dias);
          }
        }
      }
    }

    // Convites pendentes (para demonstrar aceite/recusa)
    const [, , , tccEduarda, tccFelipe] = tccIds;
    await tx.query(`INSERT INTO convite_orientacao (tcc_id, convidante_id, professor_id, criado_em) VALUES ($1,$2,$3,$4)`, [tccEduarda, ids.eduarda, ids.marcos, diasAtras(2)]);
    await log("eduarda", "CONVITE_ORIENTACAO", "convite_orientacao", null, tccEduarda, `Professor: ${nome("marcos")}`, 2);
    await tx.query(`INSERT INTO convite_dupla (tcc_id, convidante_id, convidado_id, criado_em) VALUES ($1,$2,$3,$4)`, [tccFelipe, ids.felipe, ids.gabriela, diasAtras(1)]);
    await log("felipe", "CONVITE_DUPLA", "convite_dupla", null, tccFelipe, `Convidado: ${nome("gabriela")}`, 1);

    // Notificações de exemplo
    const [tccAna, tccCamila] = tccIds;
    const notif = (dest: string, tcc: number, msg: string, link: string, d: number) =>
      tx.query(`INSERT INTO notificacao (destinatario_id, tcc_id, mensagem, link, criada_em) VALUES ($1,$2,$3,$4,$5)`, [ids[dest], tcc, msg, link, diasAtras(d)]);
    await notif("rafael", tccAna, `Bruno Almeida enviou a versão 1 da etapa "Desenvolvimento / implementação" (${TCCS[0].titulo}).`, `/tcc/${tccAna}`, 2);
    await notif("helena", tccCamila, `Camila Ferreira enviou a versão 1 da etapa "Desenvolvimento / implementação" (${TCCS[1].titulo}).`, `/tcc/${tccCamila}`, 10);
    await notif("ana", tccAna, `${nome("rafael")} solicitou alterações em a etapa "Fundamentação teórica".`, `/tcc/${tccAna}`, 4);
    await notif("marcos", tccEduarda, `${nome("eduarda")} convidou você para orientar o TCC "${TCCS[3].titulo}".`, "/professor", 2);
    await notif("gabriela", tccFelipe, `${nome("felipe")} convidou você para formar dupla no TCC "${TCCS[4].titulo}".`, "/aluno", 1);
  });
}
