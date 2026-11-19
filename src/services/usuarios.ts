import bcrypt from "bcryptjs";
import { getDb } from "@/infra/db";
import { ErroDeDominio } from "@/domain/erros";
import { registrarAuditoria } from "./auditoria";

export type Perfil = "ALUNO" | "PROFESSOR" | "COORDENACAO";
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  matricula: string | null;
}

/** RF01: cadastro como aluno ou professor. (Coordenação é criada pela instituição, não por autocadastro.) */
export async function cadastrarUsuario(d: { nome: string; email: string; senha: string; perfil: string; matricula?: string }): Promise<Usuario> {
  const nome = d.nome?.trim();
  const email = d.email?.trim().toLowerCase();
  if (!nome || nome.length < 3) throw new ErroDeDominio("DADOS_INVALIDOS", "Informe o nome completo.");
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new ErroDeDominio("DADOS_INVALIDOS", "Informe um e-mail válido.");
  if (!d.senha || d.senha.length < 6) throw new ErroDeDominio("DADOS_INVALIDOS", "A senha precisa ter pelo menos 6 caracteres.");
  if (d.perfil !== "ALUNO" && d.perfil !== "PROFESSOR") throw new ErroDeDominio("PERFIL_INCORRETO", "Escolha o perfil Aluno ou Professor.");
  const db = await getDb();
  const hash = await bcrypt.hash(d.senha, 8);
  return db.transaction(async (tx) => {
    const ja = await tx.query(`SELECT 1 FROM usuario WHERE email = $1`, [email]);
    if (ja.rows[0]) throw new ErroDeDominio("DADOS_INVALIDOS", "Já existe uma conta com este e-mail.");
    const r = await tx.query<Usuario>(
      `INSERT INTO usuario (nome, email, senha_hash, perfil, matricula) VALUES ($1,$2,$3,$4,$5)
       RETURNING id, nome, email, perfil, matricula`,
      [nome, email, hash, d.perfil, d.matricula?.trim() || null],
    );
    const u = r.rows[0];
    await registrarAuditoria(tx, { id: u.id, nome: u.nome }, "CADASTRO_USUARIO", "usuario", u.id, null, `Perfil ${u.perfil}`);
    return u;
  });
}

export async function autenticar(email: string, senha: string): Promise<Usuario | null> {
  const db = await getDb();
  const r = await db.query<Usuario & { senha_hash: string }>(`SELECT * FROM usuario WHERE email = $1`, [email.trim().toLowerCase()]);
  const u = r.rows[0];
  if (!u || !(await bcrypt.compare(senha, u.senha_hash))) return null;
  return { id: u.id, nome: u.nome, email: u.email, perfil: u.perfil, matricula: u.matricula };
}

export async function buscarUsuario(id: number): Promise<Usuario | null> {
  const db = await getDb();
  const r = await db.query<Usuario>(`SELECT id, nome, email, perfil, matricula FROM usuario WHERE id = $1`, [id]);
  return r.rows[0] ?? null;
}
