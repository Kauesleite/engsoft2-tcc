"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ErroDeDominio } from "@/domain/erros";
import { garantirPronto } from "@/infra/pronto";
import { criarSessao, encerrarSessao, exigirUsuario, rotaInicial } from "@/lib/sessao";
import { autenticar, cadastrarUsuario } from "@/services/usuarios";
import { cadastrarPreProjeto, convidarOrientador, convidarParceiro, responderConviteDupla, responderConviteOrientacao } from "@/services/tcc";
import { submeterEtapa } from "@/services/submissao";
import { avaliarEntrega } from "@/services/avaliacao";
import { marcarLidas } from "@/services/consultas";

type Res = { ok: true; msg?: string } | { ok: false; msg: string };

async function tentar(fn: () => Promise<unknown>): Promise<Res> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    if (e instanceof ErroDeDominio) return { ok: false, msg: e.message };
    console.error(e);
    return { ok: false, msg: "Erro inesperado. Tente novamente em instantes." };
  }
}
const q = (k: "ok" | "erro", msg: string) => `${k}=${encodeURIComponent(msg)}`;
function voltar(destino: string, r: Res, msgOk: string): never {
  const sep = destino.includes("?") ? "&" : "?";
  redirect(`${destino}${sep}${r.ok ? q("ok", msgOk) : q("erro", r.msg)}`);
}
const txt = (f: FormData, k: string) => String(f.get(k) ?? "");
const num = (f: FormData, k: string) => Number(f.get(k));

export async function entrar(f: FormData) {
  await garantirPronto();
  const u = await autenticar(txt(f, "email"), txt(f, "senha"));
  if (!u) redirect("/login?" + q("erro", "E-mail ou senha incorretos."));
  await criarSessao(u.id);
  redirect(rotaInicial(u.perfil));
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}

export async function cadastrar(f: FormData) {
  await garantirPronto();
  let id = 0;
  const r = await tentar(async () => {
    const u = await cadastrarUsuario({ nome: txt(f, "nome"), email: txt(f, "email"), senha: txt(f, "senha"), perfil: txt(f, "perfil"), matricula: txt(f, "matricula") });
    id = u.id;
  });
  if (!r.ok) redirect("/cadastro?" + q("erro", r.msg));
  await criarSessao(id);
  redirect(txt(f, "perfil") === "PROFESSOR" ? "/professor" : "/aluno");
}

export async function criarPreProjeto(f: FormData) {
  const u = await exigirUsuario("ALUNO");
  let id = 0;
  const r = await tentar(async () => {
    id = await cadastrarPreProjeto(u, { titulo: txt(f, "titulo"), resumo: txt(f, "resumo"), area: txt(f, "area") });
  });
  if (!r.ok) redirect("/aluno/novo?" + q("erro", r.msg));
  redirect(`/tcc/${id}?` + q("ok", "Pré-projeto cadastrado. Agora convide o orientador (e o parceiro, se for em dupla)."));
}

export async function convidarParceiroAction(f: FormData) {
  const u = await exigirUsuario("ALUNO");
  const tccId = num(f, "tccId");
  const r = await tentar(() => convidarParceiro(u, tccId, txt(f, "email")));
  revalidatePath(`/tcc/${tccId}`);
  voltar(`/tcc/${tccId}`, r, "Convite de dupla enviado. O vínculo só vale após o aceite.");
}

export async function convidarOrientadorAction(f: FormData) {
  const u = await exigirUsuario("ALUNO");
  const tccId = num(f, "tccId");
  const r = await tentar(() => convidarOrientador(u, tccId, txt(f, "email")));
  revalidatePath(`/tcc/${tccId}`);
  voltar(`/tcc/${tccId}`, r, "Convite de orientação enviado. Ele só vale após o aceite do professor.");
}

export async function responderDuplaAction(f: FormData) {
  const u = await exigirUsuario("ALUNO");
  const aceitar = txt(f, "decisao") === "aceitar";
  const r = await tentar(() => responderConviteDupla(u, num(f, "conviteId"), aceitar));
  voltar("/aluno", r, aceitar ? "Convite aceito: você agora faz parte do TCC." : "Convite recusado.");
}

export async function responderOrientacaoAction(f: FormData) {
  const u = await exigirUsuario("PROFESSOR");
  const aceitar = txt(f, "decisao") === "aceitar";
  const r = await tentar(() => responderConviteOrientacao(u, num(f, "conviteId"), aceitar));
  voltar("/professor", r, aceitar ? "Orientação aceita." : "Convite recusado.");
}

export async function submeterEtapaAction(f: FormData) {
  const u = await exigirUsuario("ALUNO");
  const tccId = num(f, "tccId");
  const etapaId = num(f, "etapaId");
  const destino = `/tcc/${tccId}/etapa/${etapaId}`;
  const arq = f.get("arquivo");
  let arquivo: { nome: string; tipo: string; dados: Uint8Array } | null = null;
  if (arq instanceof File && arq.size > 0) arquivo = { nome: arq.name, tipo: arq.type || "application/octet-stream", dados: new Uint8Array(await arq.arrayBuffer()) };
  let versao = 0;
  const r = await tentar(async () => {
    versao = (await submeterEtapa({ tccId, etapaId, autorId: u.id, comentario: txt(f, "comentario"), arquivo, linkExterno: txt(f, "link") })).versao;
  });
  revalidatePath(destino);
  voltar(destino, r, `Versão ${versao} registrada e enviada para avaliação do orientador.`);
}

export async function avaliarAction(f: FormData) {
  const u = await exigirUsuario("PROFESSOR");
  const tccId = num(f, "tccId");
  const etapaId = num(f, "etapaId");
  const destino = `/tcc/${tccId}/etapa/${etapaId}`;
  const decisao = txt(f, "decisao") as "APROVADA" | "ALTERACOES_SOLICITADAS";
  const r = await tentar(() => avaliarEntrega({ tccId, etapaId, avaliadorId: u.id, decisao, parecer: txt(f, "parecer") }));
  revalidatePath(destino);
  voltar(destino, r, decisao === "APROVADA" ? "Etapa aprovada. O progresso do TCC foi atualizado." : "Alterações solicitadas. O aluno foi avisado.");
}

export async function marcarLidasAction() {
  const u = await exigirUsuario();
  await marcarLidas(u.id);
  revalidatePath("/notificacoes");
  redirect("/notificacoes");
}
