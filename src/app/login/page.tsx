import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtual, rotaInicial } from "@/lib/sessao";
import { getDb } from "@/infra/db";
import { CONTAS_DEMO, SENHA_DEMO } from "@/infra/seed";
import { entrar } from "../actions";
import { Botao } from "@/components/ui";
import { Aviso, Campo, classeCampo } from "@/components/visual";

const ROTULO = { COORDENACAO: "Coordenação", PROFESSOR: "Professores", ALUNO: "Alunos" } as const;

export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string; ok?: string }> }) {
  const u = await usuarioAtual();
  if (u) redirect(rotaInicial(u.perfil));
  const sp = await searchParams;
  let demo: { nome: string; email: string; perfil: keyof typeof ROTULO }[] = [];
  if (process.env.DEMO_LOGIN !== "false") {
    const db = await getDb();
    demo = (await db.query(`SELECT nome, email, perfil FROM usuario WHERE email LIKE '%@protcc.demo' ORDER BY CASE perfil WHEN 'COORDENACAO' THEN 0 WHEN 'PROFESSOR' THEN 1 ELSE 2 END, nome`)).rows as typeof demo;
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-10">
      <div>
        <div className="mb-6">
          <p className="rotulo-mono text-verde-700">Universidade Federal do Amapá</p>
          <h1 className="mt-1 text-3xl font-extrabold text-grafite-900">Acompanhe seu TCC em um só lugar</h1>
          <p className="mt-2 text-sm text-aco">Entregas, avaliações e progresso centralizados: sem e-mails soltos nem mensagens perdidas.</p>
        </div>
        <Aviso erro={sp.erro} ok={sp.ok} />
        <form action={entrar} className="space-y-4 rounded-xl border border-gelo bg-white p-5 shadow-sm">
          <Campo rotulo="E-mail">
            <input name="email" type="email" required autoComplete="email" className={classeCampo} placeholder="voce@exemplo.com" />
          </Campo>
          <Campo rotulo="Senha">
            <input name="senha" type="password" required autoComplete="current-password" className={classeCampo} />
          </Campo>
          <Botao className="w-full">Entrar</Botao>
          <p className="text-center text-sm text-aco">
            Primeiro acesso?{" "}
            <Link href="/cadastro" className="font-semibold text-verde-700 underline">
              Cadastre-se como aluno ou professor
            </Link>
          </p>
        </form>
      </div>

      {demo.length > 0 && (
        <div>
          <div className="rounded-xl border border-ouro-500/50 bg-ouro-100/60 p-4 sm:p-5">
            <p className="rotulo-mono text-ouro-700">Modo demonstração</p>
            <h2 className="mt-1 text-lg font-extrabold text-grafite-900">Entre com um perfil de exemplo</h2>
            <p className="mb-4 text-sm text-grafite-700">Cada conta já tem dados prontos para mostrar um fluxo diferente. Um toque e você entra.</p>
            {(["COORDENACAO", "PROFESSOR", "ALUNO"] as const).map((p) => (
              <div key={p} className="mb-4 last:mb-0">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-aco">{ROTULO[p]}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {demo
                    .filter((d) => d.perfil === p)
                    .map((d) => (
                      <form key={d.email} action={entrar}>
                        <input type="hidden" name="email" value={d.email} />
                        <input type="hidden" name="senha" value={SENHA_DEMO} />
                        <button className="w-full rounded-lg border border-gelo bg-white px-3 py-2.5 text-left text-sm shadow-sm transition hover:border-verde-700 hover:shadow">
                          <span className="block font-semibold text-grafite-900">{d.nome}</span>
                          <span className="block text-xs text-aco">{descricaoDemo(d.email)}</span>
                        </button>
                      </form>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function descricaoDemo(email: string) {
  return CONTAS_DEMO.find((c) => c.email === email)?.papel ?? "";
}
