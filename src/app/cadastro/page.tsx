import Link from "next/link";
import { cadastrar } from "../actions";
import { Botao } from "@/components/ui";
import { Aviso, Campo, classeCampo } from "@/components/visual";

export default async function Cadastro({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-lg">
      <p className="rotulo-mono text-verde-700">RF01 · Cadastro de usuário</p>
      <h1 className="mb-5 mt-1 text-3xl font-extrabold text-grafite-900">Criar conta</h1>
      <Aviso erro={sp.erro} />
      <form action={cadastrar} className="space-y-4 rounded-xl border border-gelo bg-white p-5 shadow-sm">
        <Campo rotulo="Perfil">
          <select name="perfil" required className={classeCampo} defaultValue="ALUNO">
            <option value="ALUNO">Aluno</option>
            <option value="PROFESSOR">Professor</option>
          </select>
        </Campo>
        <Campo rotulo="Nome completo">
          <input name="nome" required minLength={3} className={classeCampo} />
        </Campo>
        <Campo rotulo="E-mail">
          <input name="email" type="email" required className={classeCampo} />
        </Campo>
        <Campo rotulo="Matrícula (opcional)">
          <input name="matricula" className={classeCampo} />
        </Campo>
        <Campo rotulo="Senha" dica="Mínimo de 6 caracteres.">
          <input name="senha" type="password" required minLength={6} autoComplete="new-password" className={classeCampo} />
        </Campo>
        <Botao className="w-full">Criar conta</Botao>
        <p className="text-center text-sm text-aco">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-verde-700 underline">
            Entrar
          </Link>
        </p>
      </form>
      <p className="mt-3 text-xs text-aco">A conta da coordenação é criada pela própria instituição e não passa por autocadastro.</p>
    </div>
  );
}
