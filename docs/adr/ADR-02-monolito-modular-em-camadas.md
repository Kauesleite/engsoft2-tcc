# ADR-02 · Estilo arquitetural: monólito modular em camadas

- **Status:** Proposto (adotado na implementação; aguarda confirmação do grupo na Ficha C)
- **Origem:** RNF03 · RNF04 · RNF06 · restrições de equipe e prazo

## Contexto
O ProTCC atende a um curso, com dezenas de TCCs simultâneos, equipe de 6 estudantes e um semestre de prazo. Os atributos prioritários são consistência/integridade (RNF06), desempenho dos dashboards (RNF03: 3 s em 95% das requisições) e facilidade de alteração (Missão 4, "teste da mudança").

## Alternativas
- **A. Monólito modular em camadas** (interface → serviços → domínio → repositório → banco), um único deploy.
- **B. Microsserviços** (ex.: serviços de Submissão, Avaliação, Notificação e Consulta, cada um com seu banco).

## Cenários avaliados (ATAM simplificado)
| Cenário | A. Monólito modular | B. Microsserviços |
|---|---|---|
| **RNF06/D10:** gravar a entrega, mudar a situação da etapa e registrar auditoria **na mesma operação** | Uma transação ACID no mesmo banco | Exige consistência eventual / saga entre serviços e bancos |
| **RNF03:** dashboard lista etapas aguardando avaliação de vários TCCs em < 3 s | Uma consulta SQL com agregação | Composição de chamadas entre serviços (latência soma) |
| **Mudança 1 (Missão 4):** e-mail passa a e-mail + notificação no sistema | Novo canal plugável em `ServicoNotificacao`; núcleo intacto (D07) | Também localizada, mas com custo de contrato e implantação |
| **Operação:** equipe de 6 estudantes, deploy gratuito | 1 projeto, 1 banco | N serviços, N pipelines, rede, observabilidade |

## Decisão
Vamos construir o ProTCC como **monólito modular em camadas**, com as fronteiras da Missão 4 preservadas como módulos (TCC, Etapa, Entrega, RepositorioTCC, ServicoSubmissao, ServicoNotificacao) e a dependência em um só sentido. A notificação é desacoplada por **evento de domínio** (D07).

## Consequências
- (+) Transação única garante RNF06/D10; menor custo operacional; testes rápidos; fronteiras claras para extrair módulos se necessário.
- (−) Escala vertical apenas; um defeito grave derruba tudo; a disciplina de camadas depende de revisão.

## Conformidade
`src/domain` não importa de `src/infra` nem de `src/services` (verificável por teste de arquitetura ou revisão); `Etapa` não conhece `TCC`.

## Condição para reavaliar
Se o sistema passar a atender vários cursos/instituições com picos de carga independentes por módulo, ou se uma integração externa (SIGAA) exigir isolamento de falhas.
