import Link from "next/link";
import { Cartao, SecaoTitulo, Selo, Titulo } from "@/components/visual";

const ELEMENTOS = [
  ["TCC", "src/domain/tcc.ts", "Conhece integrantes (máx. 2 – RN01) e orientador (RN06); responde se o aluno é integrante (R1); calcula o progresso (RN13)."],
  ["Etapa", "src/domain/etapa.ts", "Decide se aceita submissão (RN10), calcula a próxima versão (RN12) e muda a própria situação (D08, D10). Não conhece o TCC."],
  ["Entrega", "src/domain/etapa.ts", "Registro imutável (objeto congelado); autor, data e hora obrigatórios (RNF05, RNF06)."],
  ["RepositorioTCC", "src/domain/repositorio.ts · src/infra/repositorio-postgres.ts", "Só inclui entregas e avaliações. Não existe operação de alterar ou excluir (D09)."],
  ["ServicoSubmissao", "src/services/submissao.ts", "Apenas orquestra o UC05 em uma transação e publica o evento EntregaRegistrada depois do commit."],
  ["ServicoNotificacao", "src/services/notificacao.ts", "Escuta os eventos e envia por canais plugáveis (sistema + e-mail simulado). Trocar o canal não toca no núcleo (D07)."],
] as const;

const DECISOES = [
  ["D06", "Regras de aceite em módulo próprio", "Substituída por D08", "outro"],
  ["D07", "Aviso ao orientador por evento", "Implementada: barramento de eventos + canais", "ok"],
  ["D08", "Regras de aceite e versionamento na Etapa", "Implementada: Etapa.receberEntrega / avaliar", "ok"],
  ["D09", "Entrega imutável; repositório só inclui", "Implementada em 3 camadas: objeto congelado, repositório sem update/delete, triggers no banco", "ok"],
  ["D10", "Situação da etapa armazenada, alterada só pela Etapa", "Implementada: dashboards consultam a coluna etapa.situacao, gravada na mesma transação", "ok"],
  ["D11", "Etapas fixas ou configuráveis?", "Proposta: por ora, lista fixa de 7 etapas (ETAPAS_PADRAO)", "aberta"],
] as const;

const CASOS = [
  ["UC01", "Cadastrar pré-projeto", "/aluno/novo"],
  ["UC02", "Formar dupla", "/tcc/:id (convite) · /aluno (aceite)"],
  ["UC03", "Convidar orientador", "/tcc/:id"],
  ["UC04", "Responder convite de orientação", "/professor"],
  ["UC05", "Submeter etapa", "/tcc/:id/etapa/:etapaId"],
  ["UC06", "Avaliar entrega", "/tcc/:id/etapa/:etapaId (orientador)"],
  ["UC07", "Consultar histórico da etapa", "/tcc/:id/etapa/:etapaId"],
  ["UC08", "Acompanhar progresso", "/aluno · /tcc/:id"],
  ["UC09", "Acompanhar orientandos", "/professor"],
  ["UC10", "Acompanhar TCCs do curso", "/coordenacao · /coordenacao/auditoria"],
] as const;

export default function Sobre() {
  return (
    <>
      <Titulo sub="Como o modelo das Missões 3 e 4 virou código: use esta página para explicar a arquitetura ao professor.">Da modelagem ao sistema</Titulo>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Cartao>
          <p className="rotulo-mono text-verde-700">Estilo</p>
          <p className="mt-1 font-bold">Monólito modular em camadas</p>
          <p className="mt-1 text-sm text-aco">Interface → serviços → domínio → repositório → banco. Um único deploy, com módulos coesos e dependência em um só sentido.</p>
        </Cartao>
        <Cartao>
          <p className="rotulo-mono text-verde-700">Pilha (100% gratuita)</p>
          <p className="mt-1 font-bold">Next.js · TypeScript · PostgreSQL</p>
          <p className="mt-1 text-sm text-aco">Front e back no mesmo projeto (Vercel); banco Postgres na Neon. Mesmo SQL roda em testes via PGlite.</p>
        </Cartao>
        <Cartao>
          <p className="rotulo-mono text-verde-700">Qualidade verificável</p>
          <p className="mt-1 font-bold">30 testes automatizados</p>
          <p className="mt-1 text-sm text-aco">Cobrem as regras RN01–RN13, a imutabilidade do histórico (RNF06), a auditoria (RNF05) e o controle de acesso (RNF02).</p>
        </Cartao>
      </div>

      <SecaoTitulo>Elementos da Missão 4 → código</SecaoTitulo>
      <div className="mb-8 grid gap-3 md:grid-cols-2">
        {ELEMENTOS.map(([n, arq, d]) => (
          <Cartao key={n} className="!p-4">
            <p className="font-titulo text-lg font-extrabold">{n}</p>
            <p className="mb-1 font-mono text-[11px] text-aco">{arq}</p>
            <p className="text-sm">{d}</p>
          </Cartao>
        ))}
      </div>

      <SecaoTitulo>Diário de decisões → situação no sistema</SecaoTitulo>
      <ul className="mb-8 space-y-2">
        {DECISOES.map(([id, t, s, tom]) => (
          <li key={id}>
            <Cartao className="!p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold">{id}</span>
                <span className="font-semibold">{t}</span>
                <Selo tom={tom === "ok" ? "verde" : tom === "aberta" ? "ouro" : "neutro"}>{tom === "ok" ? "implementada" : tom === "aberta" ? "proposta" : "substituída"}</Selo>
              </div>
              <p className="mt-1 text-sm text-aco">{s}</p>
            </Cartao>
          </li>
        ))}
      </ul>

      <SecaoTitulo>Casos de uso → telas</SecaoTitulo>
      <Cartao className="!p-0">
        <ul className="divide-y divide-gelo">
          {CASOS.map(([id, n, rota]) => (
            <li key={id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 text-sm">
              <span className="w-12 font-mono font-bold text-verde-900">{id}</span>
              <span className="min-w-0 flex-1 font-semibold">{n}</span>
              <span className="font-mono text-xs text-aco">{rota}</span>
            </li>
          ))}
        </ul>
      </Cartao>
      <p className="mt-6 text-sm">
        <Link href="/" className="font-semibold text-verde-700 underline">
          ← Voltar ao sistema
        </Link>
      </p>
    </>
  );
}
