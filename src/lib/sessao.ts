import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { garantirPronto } from "@/infra/pronto";
import { buscarUsuario, type Perfil, type Usuario } from "@/services/usuarios";

const NOME = "protcc_sessao";
const DURACAO_S = 60 * 60 * 12;

function segredo() {
  return process.env.SESSION_SECRET || createHash("sha256").update("protcc:" + (process.env.DATABASE_URL ?? "dev")).digest("hex");
}
const assinar = (v: string) => createHmac("sha256", segredo()).update(v).digest("base64url");

export async function criarSessao(usuarioId: number) {
  const corpo = Buffer.from(JSON.stringify({ u: usuarioId, e: Math.floor(Date.now() / 1000) + DURACAO_S })).toString("base64url");
  (await cookies()).set(NOME, `${corpo}.${assinar(corpo)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACAO_S,
  });
}

export async function encerrarSessao() {
  (await cookies()).delete(NOME);
}

/** RNF01: só usuários autenticados acessam as funcionalidades internas. */
export async function usuarioAtual(): Promise<Usuario | null> {
  // cookies() primeiro: marca a renderização como dinâmica e evita tocar no banco durante o build.
  const c = (await cookies()).get(NOME)?.value;
  await garantirPronto();
  if (!c) return null;
  const [corpo, ass] = c.split(".");
  if (!corpo || !ass) return null;
  const esperado = assinar(corpo);
  if (ass.length !== esperado.length || !timingSafeEqual(Buffer.from(ass), Buffer.from(esperado))) return null;
  try {
    const { u, e } = JSON.parse(Buffer.from(corpo, "base64url").toString());
    if (e < Date.now() / 1000) return null;
    return await buscarUsuario(u);
  } catch {
    return null;
  }
}

export const rotaInicial = (p: Perfil) => (p === "ALUNO" ? "/aluno" : p === "PROFESSOR" ? "/professor" : "/coordenacao");

/** RNF02: cada perfil acessa somente o que lhe cabe. */
export async function exigirUsuario(...perfis: Perfil[]): Promise<Usuario> {
  const u = await usuarioAtual();
  if (!u) redirect("/login");
  if (perfis.length && !perfis.includes(u.perfil)) redirect(rotaInicial(u.perfil));
  return u;
}
