/** Esquema do banco (idempotente). Regras de integridade do modelo estão aqui como constraints e triggers. */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS usuario (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('ALUNO','PROFESSOR','COORDENACAO')),
  matricula TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tcc (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  resumo TEXT NOT NULL,
  area TEXT,
  modalidade TEXT NOT NULL DEFAULT 'INDIVIDUAL' CHECK (modalidade IN ('INDIVIDUAL','DUPLA')),
  situacao TEXT NOT NULL DEFAULT 'ATIVO' CHECK (situacao IN ('ATIVO','CONCLUIDO','CANCELADO')),
  orientador_id INT REFERENCES usuario(id),
  criado_por INT NOT NULL REFERENCES usuario(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RN04: um aluno não pode estar em mais de um TCC (garantido pelo índice único)
CREATE TABLE IF NOT EXISTS tcc_integrante (
  tcc_id INT NOT NULL REFERENCES tcc(id) ON DELETE CASCADE,
  aluno_id INT NOT NULL REFERENCES usuario(id),
  entrou_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tcc_id, aluno_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_integrante_aluno ON tcc_integrante (aluno_id);

CREATE TABLE IF NOT EXISTS convite_dupla (
  id SERIAL PRIMARY KEY,
  tcc_id INT NOT NULL REFERENCES tcc(id) ON DELETE CASCADE,
  convidante_id INT NOT NULL REFERENCES usuario(id),
  convidado_id INT NOT NULL REFERENCES usuario(id),
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE','ACEITO','RECUSADO')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  respondido_em TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_convite_dupla_pendente ON convite_dupla (tcc_id) WHERE status = 'PENDENTE';

CREATE TABLE IF NOT EXISTS convite_orientacao (
  id SERIAL PRIMARY KEY,
  tcc_id INT NOT NULL REFERENCES tcc(id) ON DELETE CASCADE,
  convidante_id INT NOT NULL REFERENCES usuario(id),
  professor_id INT NOT NULL REFERENCES usuario(id),
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE','ACEITO','RECUSADO')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  respondido_em TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_convite_orient_pendente ON convite_orientacao (tcc_id) WHERE status = 'PENDENTE';

-- D10: a situação da etapa é um dado armazenado (dashboards não percorrem o histórico)
CREATE TABLE IF NOT EXISTS etapa (
  id SERIAL PRIMARY KEY,
  tcc_id INT NOT NULL REFERENCES tcc(id) ON DELETE CASCADE,
  ordem INT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  situacao TEXT NOT NULL DEFAULT 'PENDENTE'
    CHECK (situacao IN ('PENDENTE','AGUARDANDO_AVALIACAO','ALTERACOES_SOLICITADAS','APROVADA')),
  situacao_atualizada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tcc_id, ordem)
);
CREATE INDEX IF NOT EXISTS ix_etapa_tcc ON etapa (tcc_id);
CREATE INDEX IF NOT EXISTS ix_etapa_situacao ON etapa (situacao);

-- D09: Entrega imutável (ver triggers abaixo)
CREATE TABLE IF NOT EXISTS entrega (
  id SERIAL PRIMARY KEY,
  etapa_id INT NOT NULL REFERENCES etapa(id),
  versao INT NOT NULL CHECK (versao >= 1),
  autor_id INT NOT NULL REFERENCES usuario(id),
  comentario TEXT,
  arquivo_nome TEXT,
  arquivo_tipo TEXT,
  arquivo_tamanho INT,
  arquivo_dados BYTEA,
  link_externo TEXT,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (etapa_id, versao),
  CHECK (arquivo_dados IS NOT NULL OR link_externo IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS ix_entrega_etapa ON entrega (etapa_id);

CREATE TABLE IF NOT EXISTS avaliacao (
  id SERIAL PRIMARY KEY,
  entrega_id INT NOT NULL UNIQUE REFERENCES entrega(id),
  avaliador_id INT NOT NULL REFERENCES usuario(id),
  decisao TEXT NOT NULL CHECK (decisao IN ('APROVADA','ALTERACOES_SOLICITADAS')),
  parecer TEXT NOT NULL DEFAULT '',
  criada_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RNF05: quem, quando e o quê
CREATE TABLE IF NOT EXISTS log_auditoria (
  id SERIAL PRIMARY KEY,
  usuario_id INT,
  usuario_nome TEXT NOT NULL,
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id INT,
  tcc_id INT,
  detalhes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_log_criado ON log_auditoria (criado_em DESC);

CREATE TABLE IF NOT EXISTS notificacao (
  id SERIAL PRIMARY KEY,
  destinatario_id INT NOT NULL REFERENCES usuario(id),
  tcc_id INT,
  mensagem TEXT NOT NULL,
  link TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_notif_dest ON notificacao (destinatario_id, lida);

-- RNF06 / ADR-01: entregas, avaliações e logs só aceitam inclusão.
CREATE OR REPLACE FUNCTION bloquear_alteracao() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Registro imutável (RNF06): operação % não é permitida em %', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_entrega_imutavel ON entrega;
CREATE TRIGGER trg_entrega_imutavel BEFORE UPDATE OR DELETE ON entrega
  FOR EACH ROW EXECUTE FUNCTION bloquear_alteracao();
DROP TRIGGER IF EXISTS trg_avaliacao_imutavel ON avaliacao;
CREATE TRIGGER trg_avaliacao_imutavel BEFORE UPDATE OR DELETE ON avaliacao
  FOR EACH ROW EXECUTE FUNCTION bloquear_alteracao();
DROP TRIGGER IF EXISTS trg_log_imutavel ON log_auditoria;
CREATE TRIGGER trg_log_imutavel BEFORE UPDATE OR DELETE ON log_auditoria
  FOR EACH ROW EXECUTE FUNCTION bloquear_alteracao();
`;

export async function garantirEsquema(db: import("./db").Database) {
  const r = await db.query<{ t: string | null }>("SELECT to_regclass('public.notificacao') AS t");
  if (r.rows[0]?.t) {
    // já criado; garante só os triggers/funções mais recentes sem lock pesado
    return;
  }
  await db.transaction(async (tx) => {
    await tx.exec("SELECT pg_advisory_xact_lock(727272)");
    await tx.exec(SCHEMA_SQL);
  });
}
