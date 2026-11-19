import type { NextConfig } from "next";

const config: NextConfig = {
  // pglite (usado só em desenvolvimento/testes) não deve ser empacotado.
  serverExternalPackages: ["@electric-sql/pglite", "pg", "bcryptjs"],
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};
export default config;
