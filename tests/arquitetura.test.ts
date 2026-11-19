import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const dir = path.resolve(__dirname, "../src/domain");
const arquivos = readdirSync(dir).filter((f) => f.endsWith(".ts"));
const imports = (f: string) => [...readFileSync(path.join(dir, f), "utf8").matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);

describe("ADR-02 – Conformidade das camadas", () => {
  it("o domínio não depende de infraestrutura, serviços ou interface", () => {
    for (const f of arquivos) {
      const proibidos = imports(f).filter((i) => /@\/(infra|services|app|lib|components)|next|react|pg|pglite/.test(i));
      expect(proibidos, `${f} importa camada superior`).toEqual([]);
    }
  });

  it("a Etapa não conhece o TCC (dependência em um só sentido)", () => {
    expect(imports("etapa.ts").filter((i) => /tcc/.test(i))).toEqual([]);
  });
});
