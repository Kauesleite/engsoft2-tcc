/**
 * Acesso ao banco. Em produção usa Postgres (Neon) via `pg`.
 * Sem DATABASE_URL usa PGlite (Postgres embutido), só para desenvolvimento e testes.
 * A mesma SQL (dialeto Postgres) roda nos dois.
 */
export interface Executor {
  query<T = any>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<void>;
}
export interface Database extends Executor {
  transaction<T>(fn: (tx: Executor) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

async function criarPg(url: string): Promise<Database> {
  const { Pool } = await import("pg");
  const local = /localhost|127\.0\.0\.1/.test(url);
  const pool = new Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 10_000,
    ssl: local ? undefined : { rejectUnauthorized: false },
  });
  const wrap = (c: { query: (s: string, p?: unknown[]) => Promise<{ rows: any[] }> }): Executor => ({
    query: (sql, params) => c.query(sql, params as unknown[]),
    exec: async (sql) => {
      await c.query(sql);
    },
  });
  return {
    ...wrap(pool),
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const r = await fn(wrap(client));
        await client.query("COMMIT");
        return r;
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

export async function criarPglite(dir?: string): Promise<Database> {
  const { PGlite } = await import("@electric-sql/pglite");
  if (dir && !dir.includes("://")) (await import("node:fs")).mkdirSync(dir, { recursive: true });
  const pg = new PGlite(dir);
  await pg.waitReady;
  const wrap = (c: { query: (s: string, p?: any[]) => Promise<{ rows: any[] }>; exec: (s: string) => Promise<unknown> }): Executor => ({
    query: (sql, params) => c.query(sql, params as any[]) as Promise<{ rows: any[] }>,
    exec: async (sql) => {
      await c.exec(sql);
    },
  });
  return {
    ...wrap(pg),
    transaction: (fn) => pg.transaction((tx) => fn(wrap(tx as any))),
    close: () => pg.close(),
  };
}

type Globais = { __protccDb?: Promise<Database>; __protccPronto?: Promise<void> };
const g = globalThis as unknown as Globais;

export function getDb(): Promise<Database> {
  if (!g.__protccDb) {
    const url = process.env.DATABASE_URL;
    g.__protccDb = url ? criarPg(url) : criarPglite(process.env.PGLITE_DIR ?? ".data/pglite");
  }
  return g.__protccDb;
}

/** Usado pelos testes para injetar um banco em memória. */
export function __definirDbParaTestes(db: Database) {
  g.__protccDb = Promise.resolve(db);
  g.__protccPronto = undefined;
}
export function __pronto() {
  return g.__protccPronto;
}
export function __definirPronto(p: Promise<void> | undefined) {
  g.__protccPronto = p;
}
