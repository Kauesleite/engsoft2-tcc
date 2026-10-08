# Missão 3 – Raio-X estrutural do projeto

> Engenharia de Software II · UNIFAP · Encontro 3
> Aplicação dos princípios de projeto (abstração, decomposição, modularidade, separação de interesses, ocultação de informação, refinamento gradual, independência funcional, coesão e acoplamento) a um único caso de uso central.

## 1. Caso de uso escolhido

**UC05 – Submeter etapa do TCC.** É a operação que sustenta boa parte do ProTCC: a partir de uma submissão acontecem o histórico de versões, a avaliação do orientador e a atualização do progresso (RF08, RF10, RF11 e RF12 da [Missão 2](missao-2-das-necessidades-aos-requisitos.md)).

## 2. Descrição em alto nível (abstração)

Um aluno vinculado ao TCC registra uma entrega referente a uma etapa do trabalho — seja a primeira tentativa, seja uma nova versão após correção solicitada — sem precisar seguir a ordem das etapas. Neste nível não interessa o formato do arquivo nem como o banco organiza as versões.

## 3. Decomposição em responsabilidades

| ID | Responsabilidade | Descrição |
|---|---|---|
| R1 | Confirmar vínculo do aluno | Verificar se quem submete é aluno vinculado ao TCC dono da etapa. |
| R2 | Verificar se a etapa aceita submissão | Conferir se a etapa não está aprovada (RN10) e se há solicitação de alteração em aberto. |
| R3 | Determinar a versão da submissão | Definir se é a primeira versão ou uma nova versão corretiva (RN12). |
| R4 | Registrar os dados da entrega | Guardar o conteúdo enviado pelo aluno. |
| R5 | Persistir a submissão preservando o histórico | Salvar a nova versão sem apagar as anteriores (RNF06). |
| R6 | Atualizar o status da etapa | Marcar a etapa como "aguardando avaliação". |
| R7 | Notificar o orientador | Avisar o orientador vinculado sobre a nova entrega. |

## 4. Módulos conceituais

| Módulo | Responsabilidades |
|---|---|
| Vínculo e Permissão | R1 |
| Regras de Submissão (Política de Etapa) | R2, R3 |
| Entregas | R4, R5, R6 |
| Notificações | R7 |

## 5. O que cada módulo sabe, faz e não deveria conhecer

| Módulo | Sabe | Faz | Não deveria conhecer |
|---|---|---|---|
| Vínculo e Permissão | Quais alunos estão vinculados a cada TCC (RN04, RN05, RN08) | Confirma se o aluno pode submeter na etapa | O conteúdo da entrega; como o orientador é avisado |
| Regras de Submissão | O estado atual da etapa e as regras RN10/RN11/RN12 | Decide se a submissão é aceita e qual versão recebe | Onde a entrega é armazenada; o canal de aviso |
| Entregas | A estrutura de uma entrega, suas versões e histórico | Registra, persiste e atualiza o status da etapa | Quem está autorizado a submeter; o canal de notificação |
| Notificações | Quem é o orientador vinculado | Avisa sobre a nova entrega | As regras de validação; a estrutura interna da entrega |

## 6. Coesão

Vínculo e Permissão e Notificações têm uma responsabilidade cada (coesão alta por definição). Regras de Submissão reúne duas responsabilidades em torno da mesma pergunta ("essa submissão entra, e com que versão?"). Entregas concentra três, mas todas tratam do mesmo objeto — o estado da entrega. Nenhum módulo virou uma "classe faz tudo".

## 7. Dependências

```
Vínculo e Permissão → Regras de Submissão → Entregas ──(evento "entrega registrada")──▶ Notificações
```

Notificações não precisa consultar os outros módulos diretamente.

## 8. Interfaces propostas (redução de acoplamento)

| Módulo | Interface exposta |
|---|---|
| Vínculo e Permissão | "Esse aluno pode submeter nesta etapa?" |
| Regras de Submissão | "Essa submissão é aceita, e com que versão?" |
| Entregas | `registrar(entrega, versão)` + evento `entrega registrada` |
| Notificações | Escuta o evento `entrega registrada` |

Trocar o canal de notificação ou a regra de aceite de versão não deve exigir mudanças nos outros módulos.

## 9. Refinamento gradual de R3 (determinar a versão da submissão)

1. **Nível 1:** determinar a versão da submissão.
2. **Nível 2:** verificar o estado da última avaliação da etapa.
3. **Nível 3:**
   - sem entrega anterior → versão 1;
   - última avaliação "alteração solicitada" → versão seguinte (RN12);
   - etapa "aprovada" → submissão recusada (RN10).
4. **Nível 4:** dados necessários — número da última versão e resultado da última avaliação, nada além disso.

## 10. Diário de decisões

| ID | Decisão | Motivo | Alternativas | Consequência |
|---|---|---|---|---|
| D06 | Separar a decisão de aceitar/versionar a submissão num módulo próprio (Regras de Submissão) | Essa regra pode mudar sem afetar como a entrega é guardada | Manter a regra dentro de Entregas | Entregas fica mais simples; a regra muda isoladamente |
| D07 | Notificar o orientador por evento disparado após salvar a entrega | O canal de aviso pode mudar sem mexer na submissão | Notificar diretamente na rotina de submissão | Trocar o canal não afeta o núcleo de submissão |

## Considerações finais

Este é um mapa exploratório focado no UC05, não a arquitetura definitiva do ProTCC. Serve de ponto de partida para o diagrama de classes da Unidade 2 — a fronteira entre Regras de Submissão e Entregas ainda pode mudar.

> **Atualização:** na [Missão 4](missao-4-mapa-de-responsabilidades.md), o módulo Regras de Submissão foi incorporado à própria Etapa (decisão D08, que revisa a D06).
