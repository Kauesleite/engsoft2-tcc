import { getDb, __pronto, __definirPronto } from "./db";
import { garantirEsquema } from "./schema";
import { semearDemo } from "./seed";

/** Cria o esquema (e, se DEMO_SEED != "false", os dados de demonstração) na primeira utilização. */
export function garantirPronto(): Promise<void> {
  const existente = __pronto();
  if (existente) return existente;
  const p = (async () => {
    const db = await getDb();
    await garantirEsquema(db);
    if (process.env.DEMO_SEED !== "false") {
      const n = (await db.query<{ n: number }>("SELECT count(*)::int AS n FROM usuario")).rows[0].n;
      if (n === 0) {
        try {
          await semearDemo(db);
        } catch (e) {
          // outra instância pode ter semeado ao mesmo tempo
          const n2 = (await db.query<{ n: number }>("SELECT count(*)::int AS n FROM usuario")).rows[0].n;
          if (n2 === 0) throw e;
        }
      }
    }
  })();
  p.catch(() => __definirPronto(undefined));
  __definirPronto(p);
  return p;
}
