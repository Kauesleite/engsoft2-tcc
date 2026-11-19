import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/infra/db";
import { criarUsuarios, montarDuplaComOrientador, novoBanco } from "./helpers";
import { submeterEtapa } from "@/services/submissao";
import { avaliarEntrega } from "@/services/avaliacao";
import { cadastrarPreProjeto, convidarParceiro, convidarOrientador, responderConviteDupla, responderConviteOrientacao } from "@/services/tcc";
import { carregarTccAutorizado, dashboardCoordenacao, listarAuditoria, notificacoesDe, convitesDoTcc } from "@/services/consultas";
import { RepositorioTCCPostgres } from "@/infra/repositorio-postgres";
import { Entrega } from "@/domain/etapa";
import { ErroDeDominio } from "@/domain/erros";
import { semearDemo } from "@/infra/seed";
import * as canais from "@/services/notificacao";

let db: Database;
let u: Awaited<ReturnType<typeof criarUsuarios>>;
let dupla: Awaited<ReturnType<typeof montarDuplaComOrientador>>;

const link = (n = 1) => ({ linkExterno: `https://exemplo.com/v${n}` });
const codigo = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    if (e instanceof ErroDeDominio) return e.codigo;
    throw e;
  }
  return "OK";
};

beforeEach(async () => {
  db = await novoBanco();
  u = await criarUsuarios();
  dupla = await montarDuplaComOrientador(db, u);
});

describe("UC05 – Submeter etapa (RF08, RF10, RN08, RN10, RN11, RN12)", () => {
  it("cenário da Missão 4: dupla envia nova versão após alterações solicitadas, preservando a v1", async () => {
    const etapa = dupla.etapa(2);
    const v1 = await submeterEtapa({ tccId: dupla.tccId, etapaId: etapa, autorId: u.ana.id, ...link(1) });
    expect(v1.versao).toBe(1);
    await avaliarEntrega({ tccId: dupla.tccId, etapaId: etapa, avaliadorId: u.rafael.id, decisao: "ALTERACOES_SOLICITADAS", parecer: "Faltam referências." });
    // o OUTRO integrante da dupla envia a correção (RN08)
    const v2 = await submeterEtapa({ tccId: dupla.tccId, etapaId: etapa, autorId: u.bruno.id, ...link(2) });
    expect(v2.versao).toBe(2);
    const tcc = await carregarTccAutorizado(u.ana, dupla.tccId);
    const e = tcc.etapa(etapa);
    expect(e.entregas.map((x) => x.versao)).toEqual([1, 2]);
    expect(e.entregas[0].linkExterno).toBe("https://exemplo.com/v1"); // v1 intacta
    expect(e.entregas[0].avaliacao?.decisao).toBe("ALTERACOES_SOLICITADAS");
    expect(e.situacao).toBe("AGUARDANDO_AVALIACAO");
  });

  it("RN11: aceita etapas fora de ordem", async () => {
    await submeterEtapa({ tccId: dupla.tccId, etapaId: dupla.etapa(4), autorId: u.ana.id, ...link() });
    const tcc = await carregarTccAutorizado(u.ana, dupla.tccId);
    expect(tcc.etapa(4).situacao).toBe("AGUARDANDO_AVALIACAO");
    expect(tcc.etapa(3).situacao).toBe("PENDENTE");
  });

  it("R2: recusa nova submissão enquanto há entrega aguardando avaliação", async () => {
    await submeterEtapa({ tccId: dupla.tccId, etapaId: dupla.etapa(1), autorId: u.ana.id, ...link() });
    expect(await codigo(submeterEtapa({ tccId: dupla.tccId, etapaId: dupla.etapa(1), autorId: u.bruno.id, ...link(2) }))).toBe("ETAPA_AGUARDANDO");
  });

  it("RN10: recusa submissão em etapa já aprovada", async () => {
    const e = dupla.etapa(1);
    await submeterEtapa({ tccId: dupla.tccId, etapaId: e, autorId: u.ana.id, ...link() });
    await avaliarEntrega({ tccId: dupla.tccId, etapaId: e, avaliadorId: u.rafael.id, decisao: "APROVADA", parecer: "" });
    expect(await codigo(submeterEtapa({ tccId: dupla.tccId, etapaId: e, autorId: u.ana.id, ...link(2) }))).toBe("ETAPA_APROVADA");
  });

  it("R1/RN08: aluno que não integra o TCC não submete", async () => {
    expect(await codigo(submeterEtapa({ tccId: dupla.tccId, etapaId: dupla.etapa(1), autorId: u.carla.id, ...link() }))).toBe("NAO_INTEGRANTE");
  });

  it("recusa entrega vazia (sem arquivo e sem link)", async () => {
    expect(await codigo(submeterEtapa({ tccId: dupla.tccId, etapaId: dupla.etapa(1), autorId: u.ana.id }))).toBe("ENTREGA_VAZIA");
  });

  it("guarda o arquivo enviado e permite recuperá-lo", async () => {
    const dados = new TextEncoder().encode("conteudo do arquivo");
    const r = await submeterEtapa({ tccId: dupla.tccId, etapaId: dupla.etapa(1), autorId: u.ana.id, arquivo: { nome: "intro.txt", tipo: "text/plain", dados } });
    const { arquivoDaEntrega } = await import("@/services/consultas");
    const a = await arquivoDaEntrega(u.bruno, r.entregaId);
    expect(new TextDecoder().decode(a.dados)).toBe("conteudo do arquivo");
    expect(await codigo(arquivoDaEntrega(u.carla, r.entregaId))).toBe("NAO_AUTORIZADO");
  });

  it("D10: submissões concorrentes na mesma etapa – só uma entra", async () => {
    const e = dupla.etapa(5);
    const res = await Promise.allSettled([
      submeterEtapa({ tccId: dupla.tccId, etapaId: e, autorId: u.ana.id, ...link(1) }),
      submeterEtapa({ tccId: dupla.tccId, etapaId: e, autorId: u.bruno.id, ...link(2) }),
    ]);
    expect(res.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const n = (await db.query<{ n: number }>(`SELECT count(*)::int n FROM entrega WHERE etapa_id = $1`, [e])).rows[0].n;
    expect(n).toBe(1);
  });
});

describe("UC06 – Avaliar entrega (RF09, RN09, RN13, RF12)", () => {
  it("RN09: só o orientador ativo avalia (outro professor e aluno não)", async () => {
    const e = dupla.etapa(1);
    await submeterEtapa({ tccId: dupla.tccId, etapaId: e, autorId: u.ana.id, ...link() });
    expect(await codigo(avaliarEntrega({ tccId: dupla.tccId, etapaId: e, avaliadorId: u.helena.id, decisao: "APROVADA", parecer: "" }))).toBe("NAO_ORIENTADOR");
    expect(await codigo(avaliarEntrega({ tccId: dupla.tccId, etapaId: e, avaliadorId: u.ana.id, decisao: "APROVADA", parecer: "" }))).toBe("NAO_ORIENTADOR");
  });

  it("alterações exigem parecer", async () => {
    const e = dupla.etapa(1);
    await submeterEtapa({ tccId: dupla.tccId, etapaId: e, autorId: u.ana.id, ...link() });
    expect(await codigo(avaliarEntrega({ tccId: dupla.tccId, etapaId: e, avaliadorId: u.rafael.id, decisao: "ALTERACOES_SOLICITADAS", parecer: " " }))).toBe("PARECER_OBRIGATORIO");
  });

  it("não avalia etapa sem entrega aguardando", async () => {
    expect(await codigo(avaliarEntrega({ tccId: dupla.tccId, etapaId: dupla.etapa(1), avaliadorId: u.rafael.id, decisao: "APROVADA", parecer: "" }))).toBe("ETAPA_NAO_AGUARDA");
  });

  it("RN13/RF12: progresso = etapas aprovadas / total, atualizado ao aprovar", async () => {
    for (const ordem of [1, 2, 3]) {
      await submeterEtapa({ tccId: dupla.tccId, etapaId: dupla.etapa(ordem), autorId: u.ana.id, ...link() });
      await avaliarEntrega({ tccId: dupla.tccId, etapaId: dupla.etapa(ordem), avaliadorId: u.rafael.id, decisao: "APROVADA", parecer: "" });
    }
    const tcc = await carregarTccAutorizado(u.bruno, dupla.tccId);
    expect(tcc.progresso()).toEqual({ aprovadas: 3, total: 7, percentual: 43 });
  });
});

describe("RNF06 / ADR-01 – Histórico inviolável", () => {
  it("o banco recusa UPDATE e DELETE em entrega, avaliação e log", async () => {
    const e = dupla.etapa(1);
    await submeterEtapa({ tccId: dupla.tccId, etapaId: e, autorId: u.ana.id, ...link() });
    await avaliarEntrega({ tccId: dupla.tccId, etapaId: e, avaliadorId: u.rafael.id, decisao: "APROVADA", parecer: "ok" });
    for (const sql of [
      `UPDATE entrega SET comentario = 'adulterado'`,
      `DELETE FROM entrega`,
      `UPDATE avaliacao SET decisao = 'ALTERACOES_SOLICITADAS'`,
      `DELETE FROM avaliacao`,
      `UPDATE log_auditoria SET usuario_nome = 'x'`,
      `DELETE FROM log_auditoria`,
    ])
      await expect(db.query(sql)).rejects.toThrow(/imutável/);
  });

  it("conformidade: o RepositorioTCC não expõe operação de alterar ou excluir Entrega", () => {
    const metodos = Object.getOwnPropertyNames(RepositorioTCCPostgres.prototype).filter((m) => m !== "constructor");
    const proibidos = metodos.filter((m) => /(alterar|atualizar|editar|excluir|remover|apagar|delete|update).*(entrega|avaliacao)/i.test(m));
    expect(proibidos).toEqual([]);
    expect(metodos).toContain("incluirEntrega");
  });

  it("a Entrega de domínio é imutável (objeto congelado)", () => {
    const en = new Entrega({ etapaId: 1, versao: 1, autorId: 1, criadaEm: new Date(), linkExterno: "https://x" });
    expect(Object.isFrozen(en)).toBe(true);
    expect(() => {
      "use strict";
      (en as any).versao = 9;
    }).toThrow();
  });

  it("nenhuma entrega nasce sem autor ou sem data", () => {
    expect(() => new Entrega({ etapaId: 1, versao: 1, autorId: 0, criadaEm: new Date() })).toThrow(ErroDeDominio);
    expect(() => new Entrega({ etapaId: 1, versao: 1, autorId: 1, criadaEm: undefined as any })).toThrow(ErroDeDominio);
  });
});

describe("RNF05 – Auditoria", () => {
  it("registra quem, quando e o quê para submissão, avaliação e convites", async () => {
    const e = dupla.etapa(1);
    await submeterEtapa({ tccId: dupla.tccId, etapaId: e, autorId: u.bruno.id, ...link() });
    await avaliarEntrega({ tccId: dupla.tccId, etapaId: e, avaliadorId: u.rafael.id, decisao: "APROVADA", parecer: "" });
    const log = await listarAuditoria();
    const acoes = log.map((l: any) => `${l.acao}:${l.usuario_nome}`);
    expect(acoes).toContain("SUBMISSAO:Bruno Lima");
    expect(acoes).toContain("APROVACAO:Rafael Prof");
    expect(acoes).toContain("CONVITE_DUPLA:Ana Souza");
    expect(acoes).toContain("ACEITE_ORIENTACAO:Rafael Prof");
    expect(log.every((l: any) => l.criado_em instanceof Date)).toBe(true);
  });
});

describe("Vínculos (RF03–RF06, RN01–RN07)", () => {
  it("RN04: aluno não cadastra segundo pré-projeto", async () => {
    expect(await codigo(cadastrarPreProjeto(u.ana, { titulo: "Outro projeto", resumo: "Descrição longa o bastante para passar na validação." }))).toBe("ALUNO_JA_VINCULADO");
  });

  it("RN01: TCC em dupla não aceita terceiro integrante", async () => {
    expect(await codigo(convidarParceiro(u.ana, dupla.tccId, u.carla.email))).toBe("TCC_COMPLETO");
  });

  it("RN02: só quem cadastrou o pré-projeto convida o parceiro", async () => {
    const t2 = await cadastrarPreProjeto(u.carla, { titulo: "Projeto da Carla", resumo: "Descrição longa o bastante para passar na validação." });
    expect(await codigo(convidarParceiro(u.bruno, t2, u.carla.email))).toBe("NAO_AUTORIZADO");
  });

  it("RN03: o vínculo só existe após o aceite; recusa não vincula", async () => {
    const t2 = await cadastrarPreProjeto(u.carla, { titulo: "Projeto da Carla", resumo: "Descrição longa o bastante para passar na validação." });
    // Ana e Bruno já têm TCC, então o convite é recusado por RN04
    expect(await codigo(convidarParceiro(u.carla, t2, u.ana.email))).toBe("ALUNO_JA_VINCULADO");
  });

  it("RN03: convite pendente não vincula; recusa mantém TCC individual", async () => {
    const x = await (await import("@/services/usuarios")).cadastrarUsuario({ nome: "Davi Novo", email: "davi@t.com", senha: "123456", perfil: "ALUNO" });
    const t2 = await cadastrarPreProjeto(u.carla, { titulo: "Projeto da Carla", resumo: "Descrição longa o bastante para passar na validação." });
    const c = await convidarParceiro(u.carla, t2, x.email);
    let tcc = await carregarTccAutorizado(u.carla, t2);
    expect(tcc.integrantes).toHaveLength(1); // pendente: ainda não vinculado
    await responderConviteDupla(x, c, false);
    tcc = await carregarTccAutorizado(u.carla, t2);
    expect(tcc.integrantes).toHaveLength(1);
    expect(tcc.modalidade).toBe("INDIVIDUAL");
  });

  it("RN07: orientação só fica ativa após o aceite; RN06: um orientador por TCC", async () => {
    const t2 = await cadastrarPreProjeto(u.carla, { titulo: "Projeto da Carla", resumo: "Descrição longa o bastante para passar na validação." });
    const c = await convidarOrientador(u.carla, t2, u.helena.email);
    expect((await carregarTccAutorizado(u.carla, t2)).orientadorId).toBeNull();
    expect(await codigo(convidarOrientador(u.carla, t2, u.rafael.email))).toBe("CONVITE_PENDENTE");
    await responderConviteOrientacao(u.helena, c, true);
    expect((await carregarTccAutorizado(u.carla, t2)).orientadorId).toBe(u.helena.id);
    expect(await codigo(convidarOrientador(u.carla, t2, u.rafael.email))).toBe("JA_TEM_ORIENTADOR");
  });

  it("só o professor convidado responde ao convite de orientação", async () => {
    const t2 = await cadastrarPreProjeto(u.carla, { titulo: "Projeto da Carla", resumo: "Descrição longa o bastante para passar na validação." });
    const c = await convidarOrientador(u.carla, t2, u.helena.email);
    expect(await codigo(responderConviteOrientacao(u.rafael, c, true))).toBe("CONVITE_INVALIDO");
    const { dupla: d, orientacao } = await convitesDoTcc(t2);
    expect(d).toHaveLength(0);
    expect(orientacao[0].status).toBe("PENDENTE");
  });
});

describe("RNF02 – Controle de acesso", () => {
  it("aluno de outro TCC e professor não orientador não acessam; coordenação acessa", async () => {
    expect(await codigo(carregarTccAutorizado(u.carla, dupla.tccId))).toBe("NAO_AUTORIZADO");
    expect(await codigo(carregarTccAutorizado(u.helena, dupla.tccId))).toBe("NAO_AUTORIZADO");
    expect(await codigo(carregarTccAutorizado(u.rafael, dupla.tccId))).toBe("OK");
    const { cadastrarUsuario } = await import("@/services/usuarios");
    expect(await codigo(cadastrarUsuario({ nome: "Fulana", email: "f@t.com", senha: "123456", perfil: "COORDENACAO" }))).toBe("PERFIL_INCORRETO");
  });
});

describe("D07 – Notificação por evento", () => {
  it("avisa o orientador quando a entrega é registrada e os alunos quando é avaliada", async () => {
    const e = dupla.etapa(1);
    await submeterEtapa({ tccId: dupla.tccId, etapaId: e, autorId: u.ana.id, ...link() });
    const n1 = await notificacoesDe(u.rafael.id);
    expect(n1.some((n: any) => /enviou a versão 1/.test(n.mensagem))).toBe(true);
    await avaliarEntrega({ tccId: dupla.tccId, etapaId: e, avaliadorId: u.rafael.id, decisao: "APROVADA", parecer: "" });
    for (const aluno of [u.ana, u.bruno]) expect((await notificacoesDe(aluno.id)).some((n: any) => /aprovou/.test(n.mensagem))).toBe(true);
  });

  it("falha no canal de aviso não desfaz a submissão", async () => {
    const spy = vi.spyOn(canais.CanalSistema, "enviar").mockRejectedValue(new Error("canal fora do ar"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await submeterEtapa({ tccId: dupla.tccId, etapaId: dupla.etapa(1), autorId: u.ana.id, ...link() });
    expect(r.versao).toBe(1);
    spy.mockRestore();
  });
});

describe("UC10 – Coordenação e dados de demonstração", () => {
  it("o seed carrega e o dashboard da coordenação aponta pendências", async () => {
    const bancoDemo = await novoBanco();
    await semearDemo(bancoDemo);
    const d = await dashboardCoordenacao();
    expect(d.kpis.tccs).toBe(5);
    expect(d.kpis.semOrientador).toBe(2);
    expect(d.kpis.aguardando).toBe(2);
    const alertas = (await dashboardCoordenacao("alertas")).linhas;
    expect(alertas.length).toBeGreaterThanOrEqual(3);
    const filtrado = (await dashboardCoordenacao("aguardando")).linhas;
    expect(filtrado.every((l) => l.aguardando > 0)).toBe(true);
  });
});
