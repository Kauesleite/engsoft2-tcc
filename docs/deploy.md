# Deploy gratuito: Vercel + Neon

Tudo em camadas gratuitas, sem cartão de crédito.

## 1. Banco de dados (Neon)
1. Entre em <https://neon.tech> com o GitHub e crie um projeto na região **AWS US East (N. Virginia)**, a mesma região padrão da Vercel, para menor latência.
2. Em **Connection Details**, copie a *connection string* (formato `postgresql://…?sslmode=require`).
   Prefira a versão com **pooler** (`-pooler` no host).

> Não é preciso criar tabelas: o sistema cria o esquema e os dados de exemplo no primeiro acesso.

## 2. Aplicação (Vercel)
1. Em <https://vercel.com> entre com o GitHub → **Add New… → Project** → importe o repositório.
2. *Framework Preset*: Next.js (detectado automaticamente). Não altere comandos de build.
3. Em **Environment Variables** adicione:
   - `DATABASE_URL` = a string do Neon
   - `SESSION_SECRET` = qualquer texto aleatório longo (opcional)
4. **Deploy**. Ao terminar, abra a URL: a primeira carga demora alguns segundos (cria as tabelas e semeia os dados).

## 3. Conferir
- Abra `/login`: devem aparecer os perfis de demonstração.
- Entre como coordenação e abra `/coordenacao`: 5 TCCs.

## Observações
- **Arquivos** enviados ficam no próprio Postgres (limite de 3,5 MB por arquivo, por causa do limite de requisição da Vercel).
- **Partida a frio:** após um tempo sem uso, a Neon e a Vercel "dormem"; a primeira requisição é mais lenta (isso afeta a medição do RNF03: meça após aquecer).
- **Reiniciar os dados de demonstração:** no SQL Editor da Neon, `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` e recarregue o site.
- **Desligar a demonstração em produção real:** `DEMO_SEED=false` e `DEMO_LOGIN=false`.
