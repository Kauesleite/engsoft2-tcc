# ProTCC · Roteiro de apresentação e de validação

Engenharia de Software II · UNIFAP · Docente: Adeildo Telles da Silva

> **Senha de todas as contas de demonstração:** `protcc123`.
> Na tela de login, cada conta tem um botão de entrada com um toque (modo demonstração).
> Para voltar ao estado inicial dos dados: no Neon, apague as tabelas (ou crie um novo banco) e recarregue a página: o sistema recria o esquema e os dados de exemplo sozinho.

## Contas e o que cada uma mostra

| Conta | Perfil | Situação inicial dos dados |
|---|---|---|
| `coordenacao@protcc.demo` | Coordenação | Vê os 5 TCCs, KPIs, alertas e auditoria |
| `rafael@protcc.demo` | Professor | Orienta TCC 1 (Ana e Bruno) e TCC 3 (Diego); tem 1 entrega aguardando |
| `helena@protcc.demo` | Professora | Orienta TCC 2 (Camila); entrega aguardando há 10 dias |
| `marcos@protcc.demo` | Professor | Tem 1 **convite de orientação pendente** (Eduarda) |
| `ana@protcc.demo` | Aluna | Dupla com Bruno; etapa 2 com **alterações solicitadas** |
| `bruno@protcc.demo` | Aluno | Dupla com Ana; enviou a etapa 4 **antes** da 3 |
| `camila@protcc.demo` | Aluna | TCC individual, 43% (3 de 7 etapas aprovadas) |
| `diego@protcc.demo` | Aluno | TCC individual, parado há mais de 30 dias |
| `eduarda@protcc.demo` | Aluna | Aguardando o aceite de Marcos |
| `felipe@protcc.demo` | Aluno | Convidou Gabriela para formar dupla |
| `gabriela@protcc.demo` | Aluna | Tem **convite de dupla pendente** |
| `henrique@protcc.demo` | Aluno | **Sem TCC** (para cadastrar um pré-projeto do zero) |

---

# Parte A · Roteiro de apresentação (≈ 10 min)

Ordem pensada para contar a história do problema (Missão 1) até a solução, passando pelos casos de uso.

| # | Tela / conta | O que mostrar | O que falar (liga ao modelo) |
|---|---|---|---|
| 1 | **Login** (`/login`) | Visual institucional (verde-escuro, grafite, grafismo) e o modo demonstração | "Resolve a fragmentação de e-mails e mensagens: tudo gira em torno das entregas." Três perfis (RF01). |
| 2 | **Aluna Ana → Meu TCC** (`/aluno`) | Progresso 14%, resumo das etapas, "próxima ação sugerida" | UC08/RF13: o aluno vê concluídas, pendentes e em avaliação. Dupla compartilha tudo (RN05). |
| 3 | **TCC da Ana** (`/tcc/1`) | Lista de 7 etapas; a **etapa 4 aguarda avaliação enquanto a 3 está pendente** | RN11: submissão **sem ordem rígida**. Etapas fixas por ora (decisão D11 ainda "proposta"). |
| 4 | **Etapa "Fundamentação teórica"** | Histórico v1 + parecer do orientador; formulário "Enviar nova versão (v2)" | UC05/UC07, RN12: correção = **nova versão**. Enviar a v2 (link) e mostrar que a **v1 continua lá** (RNF06). |
| 5 | **Aviso ao orientador** (header → Avisos) | Entrar como Rafael: aviso "enviou a versão 2…" | D07: o núcleo da submissão só **publica um evento**; o ServicoNotificacao escuta. |
| 6 | **Orientador Rafael → Painel** (`/professor`) | Fila "aguardando minha avaliação", orientandos com progresso | UC09/RF14: identificar rapidamente o que aguarda análise. |
| 7 | **Avaliar** (clique em Avaliar) | Tentar "Solicitar alterações" sem parecer (erro); depois **Aprovar** | UC06, RN09: só o orientador avalia. Aprovar → progresso sobe (RF12, RN13). |
| 8 | **Voltar como Ana** | Barra de progresso atualizada; aviso de aprovação | Progresso = aprovadas ÷ total, instantâneo. |
| 9 | **Henrique → Cadastrar pré-projeto** (`/aluno/novo`) e convidar `marcos@protcc.demo` | 7 etapas criadas; convite "aguardando aceite" | UC01/UC03. RN07: orientação só vale **após o aceite**. |
| 10 | **Marcos → Painel** | Aceitar o convite (há 2 se já fez o passo 9) | UC04. RN06: um orientador ativo por TCC (o formulário de convite some). |
| 11 | **Gabriela → Aceitar dupla** | O TCC do Felipe vira "Em dupla" | UC02, RN03: vínculo só após aceite; RN01: máximo de 2. |
| 12 | **Coordenação** (`/coordenacao`) | KPIs, barra de situação das etapas, filtros (Com alerta / Sem orientador), alertas por TCC | UC10/RF15, RNF03. "Alertas" são indicadores (ainda sem prazos por etapa). |
| 13 | **Auditoria** (`/coordenacao/auditoria`) | Quem, quando e o quê de cada ação | RNF05. Registros imutáveis. |
| 14 | **Modelagem** (`/sobre`) | Elementos da Missão 4 → arquivos; D06–D11 → situação; UC → telas | Rastreabilidade: modelo → código. ADR-01 e ADR-02 em `docs/adr`. |
| 15 | **Terminal:** `npm test` | 30 testes verdes | RNF06 verificado até no banco (triggers). Conformidade do ADR-01 e do ADR-02. |

**Dica de fala:** sempre dizer o ID (RF, RN, RNF, UC, D) enquanto clica: o professor reconhece o material das Missões 2 a 4.

---

# Parte B · Roteiro de validação

Cada caso tem **passos**, **resultado esperado** e uma caixa para marcar. Os identificadores são os das Missões 2 e 4.
Execução recomendada: duas janelas (uma normal, uma anônima) para trocar de perfil sem sair.

## B.1 Cadastro, acesso e vínculos

| ID | Requisito | Passos | Resultado esperado | ✔ |
|---|---|---|---|---|
| V01 | RF01 | `/cadastro` → perfil Aluno → preencher → criar | Conta criada e login automático em `/aluno`. Perfil "Coordenação" **não** é oferecido | ☐ |
| V02 | RF01 | Repetir o cadastro com o mesmo e-mail | Erro "Já existe uma conta com este e-mail" | ☐ |
| V03 | RNF01 | Sem login, abrir `/aluno`, `/professor`, `/tcc/1` | Redireciona para `/login` | ☐ |
| V04 | RF02, UC01 | Henrique → "Cadastrar pré-projeto" com título e descrição (≥ 20 caracteres) | Cria o TCC com **7 etapas** "Nenhuma entrega ainda" | ☐ |
| V05 | RN04 | Henrique (já com TCC) abre `/aluno/novo` | Volta para `/aluno` (não cria segundo TCC) | ☐ |
| V06 | RN02, RN04 | Felipe (TCC 5) → convidar `ana@protcc.demo` | Erro: "Ana … já está vinculado a um TCC (RN04)" | ☐ |
| V07 | RF03, RN03 | Em `/tcc/5` (Felipe) o integrante é só ele; o convite a Gabriela aparece "pendente" | Vínculo **ainda não existe** | ☐ |
| V08 | RF04, RN03, RN01 | Gabriela → Aceitar. Felipe reabre `/tcc/5` | TCC "Em dupla" com 2 integrantes; formulário de convite de parceiro **desaparece** (RN01) | ☐ |
| V09 | RF04 | **Antes de V08:** Henrique (após V04) convida `gabriela@protcc.demo`; Gabriela **recusa** o convite do Henrique | TCC do Henrique permanece "Individual"; convite aparece como "recusado"; Gabriela continua sem TCC (e ainda pode aceitar o do Felipe) | ☐ |
| V10 | RF05, RN07 | Eduarda abre `/tcc/4` | Mostra convite "aguardando aceite"; "Ainda sem orientador ativo" | ☐ |
| V11 | RF06, RN07 | Marcos → `/professor` → Aceitar | Eduarda vê Marcos como orientador; formulário de convite de orientador some (RN06) | ☐ |

## B.2 Submissão, versões e avaliação (UC05, UC06, UC07)

| ID | Requisito | Passos | Resultado esperado | ✔ |
|---|---|---|---|---|
| V12 | RF07 | Ana e Rafael abrem `/tcc/1` | Ambos veem as 7 etapas e suas situações | ☐ |
| V13 | RF08, RN11 | Camila → etapa **5** (enquanto a 4 aguarda) → enviar por link | Aceita: submissão fora de ordem | ☐ |
| V14 | RN08 | Bruno → etapa 3 do TCC 1 → enviar | Autor **Bruno** aparece no histórico; Ana também enxerga | ☐ |
| V15 | R2 (Missão 4) | Após enviar, voltar à mesma etapa | Formulário some: "há uma entrega aguardando avaliação" | ☐ |
| V16 | R4 | Enviar sem arquivo e sem link | Erro "Envie um arquivo ou informe um link" | ☐ |
| V17 | R4 | Enviar um arquivo (ex.: PDF pequeno) | Aparece o nome e tamanho; o link ⬇ baixa o mesmo arquivo | ☐ |
| V18 | RF09, UC06 | Rafael → etapa → "Solicitar alterações" **sem parecer** | Erro "Descreva as alterações solicitadas" | ☐ |
| V19 | RF09 | Rafael → solicitar alterações **com parecer** | Etapa vira "Alterações solicitadas"; Ana recebe aviso | ☐ |
| V20 | RF10, RN12, RNF06 | Ana/Bruno → etapa → "Enviar nova versão (v2)" | Histórico mostra **v2 e v1** (v1 e seu parecer intactos) | ☐ |
| V21 | RN10 | Rafael aprova. Ana volta à etapa | Situação "Aprovada"; **sem formulário** de envio | ☐ |
| V22 | RF12, RN13 | Helena aprova a etapa 4 da Camila (TCC 2) | Progresso da Camila de **43% → 57%** (4 de 7), na hora | ☐ |
| V23 | RF11, UC07 | Abrir o histórico de uma etapa com 2 versões | Para cada versão: autor, data/hora, comentário, arquivo/link e parecer | ☐ |

## B.3 Painéis e visibilidade

| ID | Requisito | Passos | Resultado esperado | ✔ |
|---|---|---|---|---|
| V24 | RF13, UC08 | Camila → `/aluno` | Mostra aprovadas, aguardando, alterações, pendentes e a barra de progresso | ☐ |
| V25 | RF14, UC09 | Rafael → `/professor` | KPIs, fila "Aguardando minha avaliação" (mais antiga primeiro) e orientandos com barra | ☐ |
| V26 | RF14 | Helena → `/professor` | Entrega da Camila com selo "+7 dias esperando" | ☐ |
| V27 | RF15, UC10 | Coordenação → `/coordenacao` | 5 TCCs, KPIs, distribuição das etapas | ☐ |
| V28 | RF15 | Filtros "Com alerta", "Aguardando avaliação", "Sem orientador" | A lista muda conforme o filtro; selos indicam o motivo | ☐ |
| V29 | D07 | Ana envia uma etapa; Rafael abre "Avisos" | Aviso "…enviou a versão N da etapa…" com link direto | ☐ |

## B.4 Controle de acesso, auditoria e integridade

| ID | Requisito | Passos | Resultado esperado | ✔ |
|---|---|---|---|---|
| V30 | RNF02 | Helena abre `/tcc/1` (não é orientadora) | Volta ao painel com "Você não tem acesso a este TCC" | ☐ |
| V31 | RNF02 | Camila abre `/tcc/1` (outro TCC) | Mesma recusa | ☐ |
| V32 | RNF02 | Ana abre `/coordenacao` e `/professor` | Redireciona ao próprio painel | ☐ |
| V33 | RNF02 | Como Helena, abrir `/arquivo/1` (arquivo de outro TCC) | **403** | ☐ |
| V34 | RN09 | Como Ana, tentar avaliar (não há botão); como Rafael, avaliar TCC 2 (não é dele) | Sem acesso | ☐ |
| V35 | RNF05 | Coordenação → `/coordenacao/auditoria` | Registros com **quem, quando e o quê** (cadastro, convites, aceites, submissões, aprovações) | ☐ |
| V36 | RNF06 | No SQL Editor da Neon: `UPDATE entrega SET comentario='x';` | Erro "Registro imutável (RNF06): operação UPDATE não é permitida em entrega" | ☐ |
| V37 | RNF06 | `DELETE FROM entrega;` e `UPDATE log_auditoria SET usuario_nome='x';` | Mesmo erro de imutabilidade | ☐ |

## B.5 Requisitos não funcionais

| ID | Requisito | Como medir | Critério | ✔ |
|---|---|---|---|---|
| V38 | RNF03 | Chrome → F12 → Network → recarregar `/coordenacao` e `/professor` 10×; ver *DOMContentLoaded* | ≤ 3 s em ≥ 95% das cargas (a 1ª carga após inatividade pode ser mais lenta: partida a frio do serverless) | ☐ |
| V39 | RNF04 | F12 → modo dispositivo (390 px) em `/aluno`, `/tcc/1`, `/coordenacao`, login | **Sem rolagem horizontal** | ☐ |
| V40 | RNF01/02 | Conferido em V03 e V30–V34 | — | ☐ |

## B.6 Testes automatizados (`npm test`)

Rodam o sistema inteiro contra um Postgres embutido. Cada bloco corresponde a requisitos do modelo:

| Bloco de testes | Verifica |
|---|---|
| UC05 – Submeter etapa | Cenário da Missão 4 (dupla envia v2 após alterações), RN08, RN10, RN11, RN12, R1, R2, entrega vazia, arquivo, **concorrência** (duas submissões simultâneas: só uma entra) |
| UC06 – Avaliar entrega | RN09, parecer obrigatório, RF12/RN13 (progresso 3/7 = 43%) |
| RNF06 / ADR-01 | UPDATE/DELETE recusados pelo banco; repositório sem operações de alterar/excluir; `Entrega` congelada; sem autor/data não nasce |
| RNF05 – Auditoria | Registro de quem/quando/o quê em submissão, aprovação, convites |
| Vínculos | RN01, RN02, RN03, RN04, RN06, RN07 |
| RNF02 | Acesso por perfil e por TCC |
| D07 | Notificação por evento; **falha no canal não desfaz a submissão** |
| UC10 | Dados de demonstração e filtros da coordenação |
| ADR-02 | O domínio não depende de infraestrutura; Etapa não conhece TCC |

## B.7 Teste da mudança (Missão 4)

| Mudança | Como demonstrar |
|---|---|
| **Mudança 1:** aviso passa a e-mail + notificação no sistema | Em `src/services/notificacao.ts`, o array `canais` já tem **dois canais** (sistema e e-mail simulado). Acrescentar um terceiro é uma linha; `ServicoSubmissao`, `Etapa`, `TCC` e `Entrega` não mudam. |
| **Mudança 2:** prazo por etapa e atrasos | Hoje há alertas por tempo de espera (indicadores). Prazos formais exigiriam: coluna na `etapa` + regra na `Etapa` + consulta da coordenação, sem tocar em `ServicoNotificacao`. |

## Limitações conhecidas (para falar com honestidade)

- **D11 em aberto:** as etapas são uma lista fixa de 7 itens (`ETAPAS_PADRAO`); ainda não há configuração pela coordenação.
- **E-mail simulado:** o canal de e-mail apenas registra no log do servidor (sem SMTP nesta versão); o aviso dentro do sistema é real.
- **Arquivos até 3,5 MB** (limite da plataforma gratuita); acima disso, usar link.
- **Alertas de atraso** são indicadores por tempo parado/aguardando; não há prazos por etapa (não estão nos requisitos da Missão 2).
- **Autoatendimento de coordenação:** a conta de coordenação é criada pela instituição (seed), não por cadastro.
