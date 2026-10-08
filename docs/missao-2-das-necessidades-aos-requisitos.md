# Missão 2 – Das necessidades aos requisitos

> Engenharia de Software II · UNIFAP · Docente: Adeildo Telles da Silva
> PDF original: [`pdf/missao-2-das-necessidades-aos-requisitos.pdf`](pdf/missao-2-das-necessidades-aos-requisitos.pdf)

## 1. Necessidades centrais

- Centralizar as entregas e avaliações relacionadas ao desenvolvimento do TCC;
- Permitir o acompanhamento do progresso de cada TCC;
- Manter o histórico das submissões e avaliações realizadas;
- Permitir ao orientador identificar rapidamente entregas que aguardam sua análise;
- Permitir ao aluno identificar etapas concluídas, pendentes e em avaliação;
- Permitir que o TCC seja desenvolvido individualmente ou em dupla, mantendo os alunos vinculados ao mesmo pré-projeto, etapas, entregas e progresso;
- Permitir à coordenação acompanhar a situação geral dos TCCs do curso.

## 2. Stakeholders e suas necessidades

**Alunos** — cadastrar o pré-projeto, formar dupla quando aplicável, estabelecer o vínculo com o orientador, realizar as entregas das etapas, receber avaliações, realizar novas submissões quando necessário e acompanhar o progresso. Em dupla, ambos ficam vinculados ao mesmo pré-projeto e compartilham etapas, entregas, avaliações e progresso.

**Professores orientadores** — receber e responder convites de orientação, acompanhar os orientandos, visualizar entregas, aprovar etapas, solicitar alterações e identificar rapidamente trabalhos aguardando avaliação.

**Coordenação do curso** — visão geral do andamento dos TCCs: alunos vinculados a cada trabalho, orientadores, progresso, etapas concluídas e pendências.

## 3. Requisitos funcionais

| ID | Requisito | Descrição |
|---|---|---|
| RF01 | Cadastro de usuário | O sistema deve permitir o cadastro de usuários como aluno ou professor. |
| RF02 | Cadastro do pré-projeto | O sistema deve permitir que o aluno cadastre seu pré-projeto de TCC. |
| RF03 | Convite de integrante | O aluno responsável pelo pré-projeto pode convidar outro aluno cadastrado para formar dupla. |
| RF04 | Aceite do convite de integrante | O aluno convidado pode aceitar ou recusar o convite. |
| RF05 | Convite ao orientador | Um aluno vinculado ao TCC pode enviar convite de orientação a um professor cadastrado. |
| RF06 | Aceite da orientação | O professor pode aceitar ou recusar um convite de orientação. |
| RF07 | Visualização das etapas | Alunos vinculados e orientador visualizam as etapas previstas do trabalho. |
| RF08 | Submissão de etapa | Qualquer aluno vinculado pode submeter uma entrega de qualquer etapa, independentemente da ordem. |
| RF09 | Avaliação de entrega | O orientador analisa uma entrega e a aprova ou solicita alterações. |
| RF10 | Nova submissão | Qualquer aluno vinculado pode realizar nova submissão quando forem solicitadas alterações. |
| RF11 | Histórico de submissões | O sistema mantém o histórico de submissões e avaliações de cada etapa, identificando o responsável por cada ação. |
| RF12 | Atualização do progresso | O progresso do TCC é atualizado sempre que uma etapa é aprovada. |
| RF13 | Acompanhamento pelo aluno | Alunos vinculados visualizam progresso, etapas concluídas, pendentes e entregas aguardando avaliação. |
| RF14 | Dashboard do orientador | Visão geral dos orientandos e TCCs, com progresso e entregas aguardando avaliação. |
| RF15 | Dashboard da coordenação | Visão dos TCCs em andamento, alunos, orientadores, progresso e situação das etapas. |

## 4. Requisitos não funcionais

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Segurança | Somente usuários autenticados acessam as funcionalidades internas. |
| RNF02 | Controle de acesso | Cada usuário acessa apenas as funcionalidades do seu perfil e os TCCs dos quais participa. |
| RNF03 | Desempenho | Páginas de consulta e dashboards carregam em até 3 s em 95% das solicitações, em condições normais. |
| RNF04 | Usabilidade | Funcionalidades principais utilizáveis em computadores, smartphones e tablets sem rolagem horizontal. |
| RNF05 | Auditabilidade | Submissões, avaliações, aprovações, solicitações de alteração, convites e aceites registram usuário, data e hora. |
| RNF06 | Integridade do histórico | Uma nova submissão não apaga nem substitui versões anteriores. |

## 5. Regras de negócio e restrições

### 5.1 Regras de negócio

| ID | Regra |
|---|---|
| RN01 | Um TCC pode ser desenvolvido individualmente ou por, no máximo, dois alunos. |
| RN02 | O aluno que cadastrou o pré-projeto pode convidar outro aluno cadastrado para formar dupla. |
| RN03 | O vínculo da dupla só é efetivado após o aceite do aluno convidado. |
| RN04 | Um aluno não pode estar vinculado simultaneamente a mais de um TCC ativo. |
| RN05 | Integrantes de uma dupla compartilham pré-projeto, orientador, etapas, entregas, avaliações e progresso. |
| RN06 | Cada TCC deve possuir apenas um orientador ativo. |
| RN07 | A orientação só é considerada ativa após o professor aceitar o convite. |
| RN08 | Qualquer aluno vinculado ao TCC pode realizar submissões de suas etapas. |
| RN09 | Somente o orientador vinculado pode aprovar uma entrega ou solicitar alterações. |
| RN10 | Uma etapa só é considerada concluída após aprovação do orientador. |
| RN11 | As etapas podem ser submetidas independentemente da ordem em que estão apresentadas. |
| RN12 | Quando uma entrega necessita de alterações, a nova submissão é registrada como nova versão, preservando as anteriores. |
| RN13 | O progresso é a proporção de etapas aprovadas sobre o total previsto, compartilhado entre os integrantes da dupla. |

### 5.2 Restrições

- Destinado inicialmente aos TCCs do Bacharelado em Ciência da Computação da UNIFAP;
- Não realiza procedimentos administrativos externos ao acompanhamento do TCC;
- Não integra com SIGAA, DERCA, biblioteca ou outros sistemas institucionais nesta versão.

## 6. Fronteira do sistema

### 6.1 O sistema faz

- Cadastro de usuários e do pré-projeto;
- Definição do TCC como individual ou em dupla;
- Convite de outro aluno para formação de dupla, com aceite ou recusa;
- Vinculação de até dois alunos ao mesmo TCC;
- Convite de professor para orientação, com aceite ou recusa;
- Visualização das etapas previstas;
- Submissão das entregas e registro de novas versões;
- Avaliação das entregas pelo orientador (aprovação ou solicitação de alterações);
- Registro do histórico de submissões e avaliações;
- Atualização e acompanhamento do progresso do TCC;
- Compartilhamento de etapas, entregas, avaliações e progresso entre os integrantes da dupla;
- Visualização da situação do TCC pelos alunos, acompanhamento dos orientandos pelo professor e acompanhamento geral pela coordenação.

### 6.2 O sistema não faz

- Escolha ou indicação automática de professor-orientador;
- Formação ou indicação automática de duplas;
- Elaboração ou edição do conteúdo do TCC dentro do sistema;
- Comunicação ou chat entre aluno e orientador fora das avaliações das entregas;
- Agendamento ou gerenciamento de banca e defesa;
- Processos posteriores à defesa do TCC;
- Emissão de documentos acadêmicos ou oficiais;
- Integração com SIGAA, DERCA, biblioteca ou outros sistemas e setores da UNIFAP.

## 7. Casos de uso principais

| ID | Caso de uso | Ator principal |
|---|---|---|
| UC01 | Cadastrar pré-projeto | Aluno |
| UC02 | Formar dupla | Aluno |
| UC03 | Convidar orientador | Aluno |
| UC04 | Responder convite de orientação | Professor |
| UC05 | Submeter etapa do TCC | Aluno |
| UC06 | Avaliar entrega | Professor-orientador |
| UC07 | Consultar histórico de uma etapa | Aluno / Professor-orientador |
| UC08 | Acompanhar progresso do TCC | Aluno |
| UC09 | Acompanhar orientandos | Professor-orientador |
| UC10 | Acompanhar TCCs do curso | Coordenação |

## 8. Tabela inicial de rastreabilidade

| Requisito | Origem / Stakeholder | Caso de uso relacionado |
|---|---|---|
| RF01 | Aluno / Professor | — |
| RF02 | Aluno | UC01 – Cadastrar pré-projeto |
| RF03 | Aluno | UC02 – Formar dupla |
| RF04 | Aluno | UC02 – Formar dupla |
| RF05 | Aluno | UC03 – Convidar orientador |
| RF06 | Professor | UC04 – Responder convite de orientação |
| RF07 | Aluno / Professor-orientador | UC05 / UC06 |
| RF08 | Aluno | UC05 – Submeter etapa do TCC |
| RF09 | Professor-orientador | UC06 – Avaliar entrega |
| RF10 | Aluno | UC05 – Submeter etapa do TCC |
| RF11 | Aluno / Professor-orientador | UC07 – Consultar histórico de uma etapa |
| RF12 | Aluno / Professor-orientador / Coordenação | UC08 / UC09 / UC10 |
| RF13 | Aluno | UC08 – Acompanhar progresso do TCC |
| RF14 | Professor-orientador | UC09 – Acompanhar orientandos |
| RF15 | Coordenação | UC10 – Acompanhar TCCs do curso |
