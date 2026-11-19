# ADR-01 · Entregas imutáveis e repositório apenas com inclusão de versões

- **Status:** Aceito (implementado)
- **Origem:** D09 da Missão 4 · RNF05 · RNF06 · RN12

## Contexto
Ao submeter uma nova versão de uma etapa (UC05), o sistema precisa registrar a entrega sem perder as versões anteriores (RNF06) e identificar autor, data e hora de cada ação (RNF05). Restrições: equipe de 6 estudantes, um semestre, sem integração com outros sistemas da UNIFAP.

## Alternativas
- **A.** Um registro por etapa, sobrescrito a cada envio, com uma tabela de log das alterações.
- **B.** Cada envio vira uma nova Entrega imutável; o repositório só permite incluir.

## Decisão
Vamos registrar cada submissão como uma Entrega imutável. O `RepositorioTCC` não tem operações de alterar ou excluir entregas. A avaliação do orientador também é um registro próprio e imutável (tabela `avaliacao`).

## Consequências
- (+) A integridade do histórico é garantida pela própria estrutura, não por disciplina; a auditoria fica simples; o UC07 consulta versões diretamente.
- (−) Um envio com arquivo errado só se corrige com nova versão; o armazenamento cresce a cada correção; os dashboards precisam da situação da etapa armazenada (D10) para não percorrer o histórico.

## Conformidade (como verificar)
Três camadas, todas verificadas por teste automatizado (`tests/protcc.test.ts`, bloco *RNF06 / ADR-01*):
1. **Domínio:** a classe `Entrega` é um objeto congelado (`Object.freeze`).
2. **Repositório:** teste falha se `RepositorioTCCPostgres` expuser método de alterar/excluir entrega ou avaliação.
3. **Banco:** *triggers* `BEFORE UPDATE OR DELETE` em `entrega`, `avaliacao` e `log_auditoria` lançam exceção; o teste tenta `UPDATE`/`DELETE` direto e exige a recusa.

## Condição para reavaliar
Se o custo de armazenamento crescer demais ou se a coordenação exigir a remoção de envios indevidos (por exemplo, arquivo com dados pessoais enviado por engano): avaliar exclusão lógica com registro de quem excluiu.
