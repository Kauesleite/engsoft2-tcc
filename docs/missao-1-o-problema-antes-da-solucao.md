# Missão 1 – O problema antes da solução

> Engenharia de Software II · UNIFAP · Docente: Adeildo Telles da Silva
> PDF original: [`pdf/missao-1-o-problema-antes-da-solucao.pdf`](pdf/missao-1-o-problema-antes-da-solucao.pdf)

## 1. Descrição do sistema

O sistema tem como objetivo acompanhar o desenvolvimento do Trabalho de Conclusão de Curso (TCC) dos alunos do curso de Bacharelado em Ciência da Computação da Universidade Federal do Amapá.

## 2. Situação-problema

Atualmente, o acompanhamento do desenvolvimento do TCC pode ocorrer de forma fragmentada, por meio de e-mails, aplicativos de mensagem, arquivos enviados separadamente e anotações individuais de alunos e professores. Essa falta de centralização dificulta a visualização do histórico do trabalho e o entendimento claro sobre o que já foi entregue, revisado ou aprovado.

Para o orientador, esse cenário também dificulta o acompanhamento simultâneo de vários alunos, principalmente para identificar rapidamente:

- quais orientandos possuem entregas pendentes;
- quais aguardam análise;
- quais etapas já foram concluídas.

A coordenação do curso, por sua vez, pode ter dificuldade para obter uma visão geral e atualizada do andamento dos TCCs, o que torna mais trabalhoso identificar alunos com atrasos, pendências ou pouca evolução no processo de desenvolvimento do trabalho.

## 3. Público-alvo

Alunos em fase de desenvolvimento do TCC que já possuem orientador definido e professores responsáveis por essas orientações. Esses usuários são diretamente afetados pela dificuldade de organizar e acompanhar entregas, revisões, correções e aprovações realizadas durante o desenvolvimento do trabalho.

## 4. Stakeholders

| Stakeholder | Necessidades |
|---|---|
| **Alunos** | Registrar entregas; receber avaliações e orientações sobre correções; acompanhar com clareza o próprio progresso ao longo das etapas. |
| **Professores orientadores** | Acompanhar orientandos de forma organizada; visualizar entregas; analisar e aprovar etapas; solicitar correções; identificar rapidamente trabalhos que aguardam avaliação. |
| **Coordenação do curso** | Visão geral do andamento dos TCCs; acompanhar o progresso dos alunos; identificar etapas concluídas, pendências, atrasos ou situações que exijam acompanhamento. |

## 5. Escopo inicial

O projeto abrange o acompanhamento do TCC a partir do momento em que o aluno já possui orientador definido, com base no registro das entregas do aluno, na análise dessas entregas pelo orientador e na atualização do progresso conforme as etapas são aprovadas.

### Inclui

- Acesso ao sistema por alunos, professores orientadores e coordenação do curso;
- Visualização das etapas previstas para o desenvolvimento do TCC;
- Submissão, pelo aluno, das entregas referentes a cada etapa;
- Registro de novas versões quando forem solicitadas correções;
- Análise das entregas pelo professor orientador;
- Aprovação da entrega ou solicitação de alterações pelo orientador;
- Registro do histórico de submissões, avaliações e aprovações;
- Atualização do progresso do TCC conforme as etapas forem aprovadas;
- Visualização, pelo aluno, de suas etapas, pendências e progresso;
- Dashboard do professor: visão geral dos orientandos, progresso individual, etapa atual e entregas aguardando análise;
- Dashboard da coordenação: visão geral dos alunos em TCC, seus orientadores, progresso e possíveis pendências.

### Não inclui

- Escolha ou indicação de professor-orientador;
- Processo de vinculação entre aluno e orientador *(revisto na Missão 2: o convite e aceite de orientação passaram a fazer parte do sistema)*;
- Elaboração ou edição do conteúdo do TCC dentro do sistema;
- Comunicação ou chat entre aluno e orientador fora das avaliações das entregas;
- Agendamento ou gerenciamento de banca e defesa;
- Processos posteriores à defesa do TCC;
- Emissão de documentos acadêmicos ou oficiais;
- Integração com SIGAA, DERCA, biblioteca ou outros sistemas e setores da UNIFAP.

## 6. Resumo do fluxo proposto

O processo inicia com o cadastro do pré-projeto pelo aluno, que em seguida convida um professor cadastrado no sistema para ser seu orientador. O professor recebe o pré-projeto e, ao aceitar a orientação, passa a acompanhar o desenvolvimento do TCC.

A partir daí, o aluno pode submeter as diferentes etapas de forma independente, sem ordem obrigatória. Cada etapa submetida é analisada pelo orientador, que pode aprová-la ou solicitar alterações. Quando aprovada, a etapa é considerada concluída e o progresso geral do TCC é atualizado, mantendo-se o histórico das submissões e avaliações.
