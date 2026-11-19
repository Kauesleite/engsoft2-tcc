import Link from "next/link";
import { exigirUsuario } from "@/lib/sessao";
import { listarAuditoria } from "@/services/consultas";
import { Cartao, Selo, Titulo, Vazio } from "@/components/visual";
import { dataHora, ROTULO_ACAO } from "@/lib/formato";

export default async function Auditoria() {
  await exigirUsuario("COORDENACAO");
  const log = await listarAuditoria(150);
  return (
    <>
      <Titulo sub="RNF05 · Cada ação crítica registra quem, quando e o quê. Os registros são imutáveis: o banco recusa alteração e exclusão.">Registro de auditoria</Titulo>
      {log.length === 0 ? (
        <Vazio>Nenhum registro.</Vazio>
      ) : (
        <ul className="space-y-2">
          {log.map((l: any) => (
            <li key={l.id}>
              <Cartao className="!p-3 sm:!p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Selo tom={/APROV/.test(l.acao) ? "verde" : /ALTER|RECUSA/.test(l.acao) ? "alerta" : "azul"}>{ROTULO_ACAO[l.acao] ?? l.acao}</Selo>
                  <span className="font-mono text-xs text-aco">{dataHora(l.criado_em)}</span>
                </div>
                <p className="mt-1.5 text-sm">
                  <strong>{l.usuario_nome}</strong>
                  {l.detalhes && <span className="text-grafite-700"> · {l.detalhes}</span>}
                </p>
                {l.tcc_id && (
                  <Link href={`/tcc/${l.tcc_id}`} className="text-xs text-verde-700 underline">
                    {l.tcc_titulo}
                  </Link>
                )}
              </Cartao>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
