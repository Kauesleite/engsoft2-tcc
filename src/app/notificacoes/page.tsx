import Link from "next/link";
import { exigirUsuario } from "@/lib/sessao";
import { notificacoesDe } from "@/services/consultas";
import { marcarLidasAction } from "../actions";
import { Botao } from "@/components/ui";
import { Cartao, Titulo, Vazio } from "@/components/visual";
import { haQuanto } from "@/lib/formato";

export default async function Notificacoes() {
  const u = await exigirUsuario();
  const itens = await notificacoesDe(u.id);
  const naoLidas = itens.filter((n: any) => !n.lida).length;
  return (
    <>
      <Titulo
        sub="Avisos gerados pelo sistema a cada evento (nova entrega, avaliação, convites)."
        acao={naoLidas > 0 ? <form action={marcarLidasAction}><Botao variante="secundario">Marcar todas como lidas</Botao></form> : undefined}
      >
        Avisos
      </Titulo>
      {itens.length === 0 ? (
        <Vazio>Você não tem avisos.</Vazio>
      ) : (
        <ul className="space-y-2">
          {itens.map((n: any) => (
            <li key={n.id}>
              <Link href={n.link ?? "#"} className="block">
                <Cartao className={`!p-3.5 transition hover:border-verde-700 ${n.lida ? "" : "border-l-4 border-l-ouro-500 bg-ouro-100/30"}`}>
                  <p className="text-sm">{n.mensagem}</p>
                  <p className="mt-1 text-xs text-aco">{haQuanto(n.criada_em)}</p>
                </Cartao>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
