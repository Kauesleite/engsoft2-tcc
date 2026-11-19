import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/sessao";
import { tccDoAluno } from "@/services/consultas";
import { criarPreProjeto } from "../../actions";
import { Botao } from "@/components/ui";
import { Aviso, Campo, classeCampo, Cartao } from "@/components/visual";

export default async function NovoPreProjeto({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const u = await exigirUsuario("ALUNO");
  if (await tccDoAluno(u.id)) redirect("/aluno");
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-2xl">
      <p className="rotulo-mono text-verde-700">UC01 · RF02 · Cadastrar pré-projeto</p>
      <h1 className="mb-1 mt-1 text-3xl font-extrabold">Novo pré-projeto de TCC</h1>
      <p className="mb-5 text-sm text-aco">As 7 etapas do trabalho serão criadas automaticamente. Em seguida você convida o orientador e, se quiser, um colega para a dupla.</p>
      <Aviso erro={sp.erro} />
      <Cartao>
        <form action={criarPreProjeto} className="space-y-4">
          <Campo rotulo="Título">
            <input name="titulo" required minLength={5} className={classeCampo} placeholder="Ex.: Sistema de apoio à gestão de ..." />
          </Campo>
          <Campo rotulo="Área de conhecimento (opcional)">
            <input name="area" className={classeCampo} placeholder="Ex.: Engenharia de software" />
          </Campo>
          <Campo rotulo="Descrição / resumo do pré-projeto" dica="Qual problema o trabalho pretende resolver e como. Mínimo de 20 caracteres.">
            <textarea name="resumo" required minLength={20} rows={6} className={classeCampo} />
          </Campo>
          <Botao>Cadastrar pré-projeto</Botao>
        </form>
      </Cartao>
    </div>
  );
}
