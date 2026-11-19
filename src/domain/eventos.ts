/** Barramento de eventos em memória (D07): o núcleo da submissão não conhece o canal de aviso. */
export interface EntregaRegistrada {
  tipo: "EntregaRegistrada";
  tccId: number;
  tccTitulo: string;
  etapaId: number;
  etapaNome: string;
  entregaId: number;
  versao: number;
  autorId: number;
  autorNome: string;
  orientadorId: number | null;
  quando: Date;
}

export interface AvaliacaoRegistrada {
  tipo: "AvaliacaoRegistrada";
  tccId: number;
  tccTitulo: string;
  etapaId: number;
  etapaNome: string;
  decisao: "APROVADA" | "ALTERACOES_SOLICITADAS";
  integrantes: number[];
  avaliadorNome: string;
  quando: Date;
}

export type Evento = EntregaRegistrada | AvaliacaoRegistrada;
type Handler<T extends Evento> = (e: T) => Promise<void> | void;

class Barramento {
  private handlers = new Map<string, Handler<any>[]>();
  assinar<T extends Evento>(tipo: T["tipo"], h: Handler<T>) {
    const lista = this.handlers.get(tipo) ?? [];
    lista.push(h);
    this.handlers.set(tipo, lista);
  }
  limpar() {
    this.handlers.clear();
  }
  /** Falha de um assinante nunca desfaz a operação que já foi concluída. */
  async publicar(e: Evento) {
    for (const h of this.handlers.get(e.tipo) ?? []) {
      try {
        await h(e);
      } catch (err) {
        console.error(`[evento ${e.tipo}] assinante falhou:`, err);
      }
    }
  }
}

const g = globalThis as unknown as { __protccBus?: Barramento };
export const barramento = (g.__protccBus ??= new Barramento());
