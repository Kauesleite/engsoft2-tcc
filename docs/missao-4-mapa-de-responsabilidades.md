# Missão 4 – Mapa de Responsabilidades e Qualidade

> Engenharia de Software II · UNIFAP · Docente: Adeildo Telles da Silva
> Continuação da [Missão 3](missao-3-raio-x-estrutural.md): os módulos conceituais do UC05 são refinados em elementos candidatos, com responsabilidades e colaboradores explícitos.

## 1. Caso de uso escolhido

**UC05 – Submeter etapa do TCC** (ator principal: aluno). Foi mantido em relação à Missão 3 para que os módulos conceituais definidos ali (Vínculo e Permissão, Regras de Submissão, Entregas e Notificações) sejam refinados em elementos candidatos.

O UC05 concentra os requisitos RF08, RF10, RF11 e RF12 e as regras RN08, RN10, RN11 e RN12. Além disso, alimenta diretamente o UC06 (Avaliar entrega) e os dashboards do orientador e da coordenação (RF14 e RF15).

**Cenário de referência:** um aluno que desenvolve o TCC em dupla submete uma nova versão da etapa "Fundamentação teórica" depois que o orientador solicitou alterações na versão anterior.

## 2. Mapa preliminar de responsabilidades

| ID | Responsabilidade | Descrição | Rastreabilidade |
|---|---|---|---|
| R1 | Confirmar o vínculo do aluno | Verificar se o aluno que submete integra o TCC ao qual a etapa pertence | RN04, RN05, RN08, RNF02 |
| R2 | Verificar se a etapa aceita submissão | Conferir se a etapa ainda não foi aprovada e se não há outra entrega aguardando avaliação | RN10, RN11 |
| R3 | Determinar a versão da submissão | Definir se é a primeira versão ou uma nova versão corretiva | RN12 |
| R4 | Registrar os dados da entrega | Guardar o arquivo, o aluno responsável e a data e hora da submissão | RF08, RF11, RNF05 |
| R5 | Persistir preservando o histórico | Salvar a nova versão sem apagar ou substituir as anteriores | RNF06 |
| R6 | Atualizar a situação da etapa | Passar a etapa para "aguardando avaliação", visível ao aluno e ao orientador | RF13, RF14 |
| R7 | Notificar o orientador | Avisar o orientador vinculado de que há nova entrega para análise | RF14 |

### Elementos candidatos

Cada responsabilidade foi atribuída ao elemento que possui as informações necessárias para cumpri-la:

| Elemento | Precisa conhecer | Precisa fazer | Resp. |
|---|---|---|---|
| **TCC** | alunos integrantes, orientador ativo e etapas previstas | informar se um aluno é integrante; calcular o progresso | R1 |
| **Etapa** | situação atual e sequência de entregas (versões) | decidir se aceita submissão; calcular a próxima versão; mudar a situação | R2, R3, R6 |
| **Entrega** | versão, arquivo, autor, data e hora | preservar um registro que não pode ser alterado | R4 |
| **RepositorioTCC** | como TCCs, etapas e entregas são armazenados | salvar novas versões sem alterar ou excluir as anteriores | R5 |
| **ServicoSubmissao** | a sequência do caso de uso e seus colaboradores | coordenar o fluxo e publicar o evento `EntregaRegistrada` | — |
| **ServicoNotificacao** | destinatário, mensagem e canal de envio | avisar o orientador sobre a nova entrega | R7 |

O `ServicoSubmissao` não assume nenhuma das responsabilidades R1 a R7: ele apenas orquestra a sequência. Carrega o TCC pelo repositório, pergunta ao TCC se o aluno é integrante, pede à Etapa que receba a entrega, solicita a gravação e publica o evento `EntregaRegistrada`, escutado pelo `ServicoNotificacao`.

Em relação à Missão 3, o módulo "Regras de Submissão" deixou de ser um elemento separado e passou a ser comportamento da própria Etapa, que é quem conhece seu estado e suas versões. Assim se evita uma Etapa só com dados ao lado de um serviço que concentra todas as regras (decisão D08).

## 3. Cartões CRC

| Classe candidata | Responsabilidades | Colaboradores |
|---|---|---|
| **TCC** | conhecer os integrantes (no máximo dois – RN01) e o orientador ativo (RN06); conhecer as etapas previstas; informar se um aluno é integrante; fornecer uma etapa pelo identificador; calcular o progresso (RN13) | Etapa; Aluno |
| **Etapa** | conhecer sua situação (pendente, aguardando avaliação, alterações solicitadas ou aprovada) e suas entregas; decidir se aceita nova submissão (RN10); calcular a próxima versão (RN12); anexar a entrega e passar para "aguardando avaliação" | Entrega |
| **Entrega** | conhecer versão, arquivo, autor, data e hora (RNF05); permanecer inalterada após criada (RNF06); conhecer a avaliação recebida, quando houver (UC06) | Aluno |
| **ServicoSubmissao** | coordenar o UC05; garantir que a operação seja concluída por inteiro ou não seja registrada; publicar o evento `EntregaRegistrada` | TCC; Etapa; RepositorioTCC; ServicoNotificacao (via evento) |
| **ServicoNotificacao** | escutar o evento `EntregaRegistrada`; identificar o orientador ativo; enviar a mensagem pelo canal configurado | RepositorioTCC; canal de envio (e-mail) |

O `RepositorioTCC` aparece como colaborador, mas não recebeu cartão próprio: sua única responsabilidade é abstrair o armazenamento, oferecendo operações de inclusão de versões e nenhuma operação de alteração ou exclusão de entregas.

## 4. Riscos de baixa coesão e acoplamento excessivo

- **ServicoSubmissao como classe "Deus"** — há a tentação de colocar no serviço a verificação de vínculo, o cálculo de versão, a gravação do arquivo e o envio do e-mail. Para evitar isso, o serviço apenas coordena: cada regra fica no elemento que conhece os dados (TCC e Etapa) e o aviso é disparado por evento.
- **Etapa acumulando responsabilidades** — a Etapa também participa do UC06 e poderia passar a calcular o progresso ou notificar o orientador. Todas as suas transições tratam do mesmo foco, o ciclo de vida da etapa; o progresso fica no TCC e o aviso fica fora do domínio.
- **Dependência entre Etapa e TCC nos dois sentidos** — se a Etapa consultasse o TCC para saber integrantes ou orientador, haveria acoplamento circular. A dependência foi mantida em um só sentido: o TCC contém as etapas e a Etapa não conhece o TCC.
- **Verificação de vínculo duplicada** — RNF02 (controle de acesso) e RN08 parecem fazer a mesma verificação em dois lugares. A duplicidade é justificada: o controle de acesso verifica o perfil do usuário (se é aluno), enquanto o TCC verifica o vínculo com aquele trabalho específico.
- **Entrega como objeto anêmico** — a Entrega possui praticamente só dados. Isso é aceitável, pois sua responsabilidade é preservar um registro imutável; as regras ficam na Etapa, que contém as entregas.

## 5. Requisitos não funcionais que pressionam o projeto

### RNF06 – Integridade do histórico (com RNF05 – Auditabilidade)

**Atributo de qualidade:** confiabilidade. A exigência de que nenhuma submissão apague as anteriores levou a estas escolhas:

- a Entrega não pode ser alterada depois de criada;
- o `RepositorioTCC` não oferece operação de atualização ou exclusão de entregas, apenas de inclusão;
- autor, data e hora são obrigatórios na criação da Entrega, de modo que não existe entrega sem autoria registrada.

A integridade do histórico é garantida pela própria estrutura do projeto. **Custo:** um envio com o arquivo errado só pode ser corrigido com uma nova versão, e o armazenamento cresce a cada correção.

### RNF03 – Desempenho

**Atributo de qualidade:** desempenho. Os dashboards do orientador e da coordenação (RF14 e RF15) precisam listar rapidamente as etapas que aguardam avaliação em vários TCCs, dentro do limite de 3 segundos. Se a situação de cada etapa fosse recalculada percorrendo todo o histórico, o tempo de consulta cresceria com o número de versões.

Por isso a situação da etapa é mantida como um dado próprio, atualizado pela Etapa no momento da submissão e da avaliação. **Custo:** esse dado derivado pode ficar inconsistente com o histórico; para reduzir o risco, somente a Etapa altera sua situação, sempre na mesma operação que grava a entrega (decisão D10).

## 6. Teste da mudança

| Mudança | Elementos afetados | Elementos não afetados | Avaliação |
|---|---|---|---|
| **1 – O aviso passa de e-mail para e-mail + notificação no sistema** | ServicoNotificacao (novo canal de envio) | TCC, Etapa, Entrega, ServicoSubmissao, RepositorioTCC | Mudança localizada: o evento `EntregaRegistrada` isola o núcleo da submissão do canal de aviso (D07) |
| **2 – Cada etapa passa a ter prazo e entregas atrasadas são sinalizadas** | Etapa (conhece o prazo e marca atraso), Entrega (indicador de atraso), RepositorioTCC (novo dado) e a consulta do dashboard da coordenação | ServicoSubmissao (já repassa data e hora), ServicoNotificacao, TCC | Propagação moderada e esperada; a regra cabe na Etapa, mas mostra o limite da D08: se as regras de aceite crescerem, será preciso extraí-las para um elemento próprio |

A Mudança 2 é plausível porque a Missão 1 já apontava a dificuldade da coordenação em identificar alunos com atrasos, embora prazos ainda não façam parte dos requisitos da Missão 2.

## 7. Diário de decisões

A numeração continua a partir da Missão 3 (D06 e D07), agora registrando o atributo de qualidade afetado e o trade-off assumido.

| ID | Decisão | Requisito / causa | Benefício | Custo / risco | Qualidade afetada |
|---|---|---|---|---|---|
| D08 | Regras de aceite e versionamento como comportamento da Etapa (revisa a D06 da Missão 3) | RN10, RN12; evitar objeto anêmico | estado e transições da etapa ficam em um só lugar | Etapa cresce; regras configuráveis exigiriam extraí-las | coesão; suportabilidade |
| D09 | Entrega imutável e repositório apenas com inclusão de versões | RNF05, RNF06 | histórico preservado pela própria estrutura | erro de envio só se corrige com nova versão; mais armazenamento | confiabilidade |
| D10 | Situação da etapa armazenada e alterada somente pela Etapa | RNF03, RF14, RF15 | dashboards consultam sem percorrer o histórico | dado derivado pode divergir; exige atualização na mesma operação | desempenho; consistência |
| D11 | **Dúvida:** as etapas previstas são uma lista fixa no sistema ou configurada pela coordenação? | RF07, RN13 | lista fixa simplifica a implementação | lista configurável exige funcionalidade fora do escopo atual | funcionalidade; escopo |

## Considerações finais

O mapa é exploratório e restrito ao UC05. Serve de entrada para a Clínica de Projetos (Encontro 5) e para o diagrama de classes da Unidade 2, no qual TCC, Etapa e Entrega devem se tornar as classes centrais do domínio. A dúvida D11 deve ser levada à Clínica, pois também afeta o RF07 e o cálculo do progresso (RN13).
