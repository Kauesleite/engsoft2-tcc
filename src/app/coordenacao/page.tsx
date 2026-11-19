import Link from "next/link";
import { exigirUsuario } from "@/lib/sessao";
import { dashboardCoordenacao, DIAS_ALERTA_AVALIACAO, DIAS_ALERTA_PARADO, type FiltroCoord } from "@/services/consultas";
import { Cartao, Kpi, Progresso, SecaoTitulo, Selo, Titulo, Vazio } from "@/components/visual";
import { haQuanto } from "@/lib/formato";

const FILTROS: { id: FiltroCoord; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "alertas", rotulo: "Com alerta" },
  { id: "aguardando", rotulo: "Aguardando avaliação" },
  { id: "sem-orientador", rotulo: "Sem orientador" },
];
const ROTULO_ALERTA = {
  SEM_ORIENTADOR: ["Sem orientador", "ouro"],
  AGUARDANDO_HA_MUITO: [`Avaliação pendente +${DIAS_ALERTA_AVALIACAO} dias`, "alerta"],
  PARADO: [`Sem movimentação +${DIAS_ALERTA_PARADO} dias`, "alerta"],
} as const;

export default async function PainelCoordenacao({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  await exigirUsuario("COORDENACAO");
  const sp = await searchParams;
  const filtro = (FILTROS.find((f) => f.id === sp.filtro)?.id ?? "todos") as FiltroCoord;
  const d = await dashboardCoordenacao(filtro);
  const totalEtapas = d.etapas.aprovadas + d.etapas.aguardando + d.etapas.alteracoes + d.etapas.pendentes || 1;
  const barras = [
    ["Aprovadas", d.etapas.aprovadas, "bg-verde-700"],
    ["Aguardando avaliação", d.etapas.aguardando, "bg-ouro-500"],
    ["Alterações solicitadas", d.etapas.alteracoes, "bg-alerta-700"],
    ["Pendentes", d.etapas.pendentes, "bg-aco"],
  ] as const;

  return (
    <>
      <Titulo sub="UC10 · Visão geral dos TCCs do curso de Ciência da Computação.">Painel da coordenação</Titulo>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi valor={d.kpis.tccs} rotulo="TCCs em andamento" />
        <Kpi valor={`${d.kpis.progressoMedio}%`} rotulo="Progresso médio" tom="verde" />
        <Kpi valor={d.kpis.aguardando} rotulo="Etapas aguardando avaliação" tom={d.kpis.aguardando ? "ouro" : "neutro"} href="/coordenacao?filtro=aguardando" />
        <Kpi valor={d.kpis.semOrientador} rotulo="Sem orientador ativo" tom={d.kpis.semOrientador ? "ouro" : "neutro"} href="/coordenacao?filtro=sem-orientador" />
        <div className="col-span-2 lg:col-span-1">
          <Kpi valor={d.kpis.comAlerta} rotulo="TCCs com alerta" tom={d.kpis.comAlerta ? "alerta" : "neutro"} href="/coordenacao?filtro=alertas" />
        </div>
      </div>

      <Cartao className="mb-6">
        <p className="rotulo-mono mb-3 text-aco">Situação de todas as etapas</p>
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-gelo" role="img" aria-label="Distribuição das situações das etapas">
          {barras.map(([n, v, c]) => (
            <div key={n} className={c} style={{ width: `${(v / totalEtapas) * 100}%` }} title={`${n}: ${v}`} />
          ))}
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
          {barras.map(([n, v, c]) => (
            <li key={n} className="flex items-center gap-2">
              <span className={`size-3 rounded-sm ${c}`} />
              <span>{n}: <strong>{v}</strong></span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-aco">Alertas são indicadores de acompanhamento (o sistema ainda não tem prazos por etapa).</p>
      </Cartao>

      <SecaoTitulo contagem={d.linhas.length}>TCCs</SecaoTitulo>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtros">
        {FILTROS.map((f) => (
          <Link
            key={f.id}
            href={f.id === "todos" ? "/coordenacao" : `/coordenacao?filtro=${f.id}`}
            className={`min-h-10 rounded-full border px-4 py-2 text-sm font-semibold ${filtro === f.id ? "border-verde-900 bg-verde-900 text-white" : "border-gelo bg-white text-grafite-700 hover:border-verde-700"}`}
          >
            {f.rotulo}
          </Link>
        ))}
      </div>

      {d.linhas.length === 0 ? (
        <Vazio>Nenhum TCC neste filtro.</Vazio>
      ) : (
        <ul className="space-y-3">
          {d.linhas.map((l) => (
            <li key={l.id}>
              <Cartao className="grid gap-4 md:grid-cols-[1.6fr_1fr_1fr] md:items-center">
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    <Selo tom="verde">{l.modalidade === "DUPLA" ? "Dupla" : "Individual"}</Selo>
                    {l.alertas.map((a) => (
                      <Selo key={a} tom={ROTULO_ALERTA[a][1]}>
                        {ROTULO_ALERTA[a][0]}
                      </Selo>
                    ))}
                  </div>
                  <Link href={`/tcc/${l.id}`} className="font-bold leading-snug text-grafite-900 hover:underline">
                    {l.titulo}
                  </Link>
                </div>
                <div className="text-sm">
                  <p className="text-xs text-aco">Alunos</p>
                  <p>{l.integrantes.map((i) => i.nome).join(" e ")}</p>
                  <p className="mt-1.5 text-xs text-aco">Orientador(a)</p>
                  <p>{l.orientadorNome ?? <em className="text-aco">não definido</em>}</p>
                </div>
                <div>
                  <Progresso aprovadas={l.aprovadas} total={l.total} percentual={l.percentual} />
                  <p className="mt-2 text-xs text-aco">
                    {l.aguardando} aguardando · {l.alteracoes} c/ alterações · {l.pendentes} pendentes
                  </p>
                  <p className="text-xs text-aco">Última movimentação {haQuanto(l.ultimaMovimentacao)}</p>
                </div>
              </Cartao>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
