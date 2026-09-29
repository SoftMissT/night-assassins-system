---
tipo: blueprint
projeto: night-assassins-system
status: rascunho-v0
criado: 2026-09-29
repo: https://github.com/SoftMissT/night-assassins-system
legado: https://github.com/SoftMissT/night-assassins-csb-automation
foundry: 14
tags: [nas, foundry, sistema, blueprint, sdd]
---

# Blueprint: Night Assassins System

> [!info] Objetivo
> Migrar o Night Assassins de módulo sobre Custom System Builder (CSB) para um **Sistema próprio do Foundry VTT v14**, com DataModels, fichas em ApplicationV2 e migrador de mundos, sem perder a lógica e os testes já validados no módulo legado.

> [!warning] Status
> Rascunho v0. Os passos 3 e 4 dependem de material que só o autor tem (fichas exportadas do mundo). Veja a seção "Material necessário".

## 1. Contexto medido do legado

Números lidos direto do repositório `night-assassins-csb-automation` (v0.11.84):

**Código:** 69 arquivos em `scripts/` (~31,7 mil linhas), dos quais 44 tocam globals do Foundry (`game.`, `ui.`, `Hooks`, `foundry.`). Só cinco `*-core.mjs` e três arquivos em `scripts/core/` são explicitamente puros.

**Testes:** 100 arquivos em `tests/`, 173 suítes, 1088 testes passando (changelog v0.11.81), rodados com `node --test`.

**Dados (templates CSB em `src/templates/actors/`):**
- **Slayer:** 313 chaves únicas. 93 `numberField`, 27 `textField`, 9 `select`, 170 labels com chave (54 com fórmula).
- **Oni:** 189 chaves únicas. 107 `numberField`, 62 labels com chave (58 com fórmula).
- **Oni Minion:** 44 chaves únicas.
- **NPC:** 55 chaves únicas.

**Acesso a dados:** os scripts leem `actor.system.props.*`, inclusive com chaves dinâmicas (`props[`${key}_display`]`, `acoes_slayer_${key}_bonus`). Uma busca estática não enumera tudo; por isso o passo 3 combina template e varredura de padrões dinâmicos.

**Compêndios legados:** macros, templates-de-ficha, respirações, armas-slayer, arte. Fontes em `data/catalog-source/`, `catalogs/`, `src/templates/items/`. Pipeline de build em `tools/` (16 scripts) e `release.yml`.

**Estado de validação no legado (README):** Slayer N1–N20 e Vida e Morte validados; Oni N1–N20 validado com ajustes em andamento; armas normais com testes prontos mas sem validação runtime; armas especiais fora do fluxo atual; Água sem service (fora do publicado).

> [!note] Correção
> Uma estimativa anterior falava em "85 props". Era só o que a busca estática por `system.props.X` encontrava. O contrato real tem centenas de chaves e parte da lógica mora em **fórmulas dentro dos labels do template**, não nos scripts.

## 2. Decisões abertas

Cada decisão tem um padrão sugerido; o autor confirma ou troca antes do passo indicado.

**D1. ID do sistema** (antes do passo 1): padrão `night-assassins`. O repo se chama `night-assassins-system`. O ID precisa ser minúsculo, sem espaços, e diferente do módulo legado (`night-assassins-csb-automation`).

**D2. Tipos de Actor** (antes do passo 4): padrão `slayer`, `oni`, `oniMinion`, `npc`.

**D3. Tipos de Item** (antes do passo 4): padrão `weapon`, `specialWeapon`, `breathingForm`, `kekkijutsu`.

**D4. Dependências:** manter Dice So Nice como obrigatório em `relationships.requires`, como no legado (antes do passo 1).

**D5. Escopo do v1.0:** o SPEC do "NA Action HUD" fica **fora** do v1.0, a menos que o autor peça o contrário (antes do passo 11).

**D6. Armas especiais:** portar o código, mas **não publicar** como mecânica concluída, seguindo o estado do legado (antes do passo 10).

**D7. Licença e autoria:** o LICENSE gerado pelo GitHub já existe (MIT). Confirmar o nome de autoria no `system.json`.

## 3. Invariantes (verificados após cada passo)

- `node --test` passa, sem testes desativados para "passar".
- Nenhuma leitura de `system.props` no código novo, exceto em `module/migration/` e nos fixtures do legado.
- Nenhum arquivo em `module/core/` importa ou referencia globals do Foundry (`game.`, `ui.`, `Hooks`, `foundry.`, `canvas.`, `CONFIG.`). Um teste faz essa checagem por busca no texto.
- Strings de interface em `lang/pt-BR.json`, sem texto solto no código.
- Conteúdo gerado (`build/`, `packs/`) nunca é editado à mão nem versionado.
- Toda rolagem mecânica aguarda o Dice So Nice antes de postar o resultado (regra herdada do legado).
- Cada passo termina com PR próprio, CI verde e `docs/STATE.md` atualizado.

## 4. Grafo de dependência

```
1 -> 2 -> 3 -> 4 -> 5 -+-> 6 --+
                       +-> 7 --+-> 8 -> 9 -+-> 10a --+
                                           +-> 10b --+-> 11 -> 13 -> 14
                                           +-> 10c --+
                        7 + 10a -> 12 -----------------------^
```

**Passos paralelos:** 6 e 7 (após o 5); 10a, 10b e 10c (após o 9); 12 corre em paralelo com o 11.

**Caminho crítico:** 1, 2, 3, 4, 5, 8, 9, 10, 11, 13, 14.

**Nota de tamanho:** 14 passos passam do típico (3 a 12), mas o legado tem ~32 mil linhas e três subsistemas independentes; dividir menos geraria PRs impossíveis de revisar.

## 5. Passos

Formato de cada passo: **Depende de**, **Paralelo com**, **Modelo** (forte = raciocínio mais pesado, padrão = execução), **Contexto**, **Tarefas**, **Verificação**, **Critério de saída**, **Rollback**. Cada passo é autocontido: um agente novo consegue executá-lo lendo só este arquivo e o repo.

### Fase A. Fundação

#### Passo 1. Bootstrap do repositório

**Depende de:** D1, D4, D7.
**Paralelo com:** nenhum.
**Modelo:** padrão.

**Contexto:** o repo `night-assassins-system` está vazio, só com `LICENSE` (o `.gitignore` não foi criado na tela do GitHub). Precisa nascer como Sistema do Foundry v14 (`system.json`), não como módulo. O legado usa Node com `node --test` sem dependências, e o release é disparado por tag `v*`.

**Tarefas:**
- Criar `.gitignore` (Node, `build/`, `packs/`, `.env`, `node_modules/`).
- Criar `package.json` (`"type": "module"`, script `test: node --test`), sem dependências de runtime.
- Criar `system.json`: `id` (D1), `title`, `version` `0.1.0`, `compatibility` mínimo 14 e verificado 14.367 (mesmo do legado), `esmodules` apontando para `module/night-assassins.mjs`, `styles`, `languages` (pt-BR), `packs` vazio, `socket: true`, `relationships.requires` com `dice-so-nice`, URLs de `url`, `manifest` (`releases/latest/download/system.json`) e `download` do repo novo. **Antes de escrever**, consultar a doc oficial da v14 para confirmar como declarar os tipos de documento (`documentTypes` no `system.json` versus `template.json` legado) e registrar a resposta em `docs/adr/`.
- Criar `module/night-assassins.mjs` com apenas um `Hooks.once('init')` que loga a versão.
- Criar `lang/pt-BR.json` mínimo, `README.md` curto e `CHANGELOG.md`.
- Criar `tests/setup/foundry-mock.mjs` (mocks mínimos de `game`, `ui`, `Hooks`, `foundry`) e um teste de fumaça que importa `module/night-assassins.mjs`.
- Criar `.github/workflows/ci.yml` (roda `node --test` em push e PR) e `.github/workflows/release.yml` esqueleto (valida que a tag `vX.Y.Z` bate com `system.json`, roda testes, ainda sem pack).

**Verificação:** `node --test`; `node -e "JSON.parse(require('fs').readFileSync('system.json','utf8'))"`; instalar a pasta em `Data/systems/` e criar um mundo sem erros no console do Foundry.

**Critério de saída:** CI verde; o Foundry lista o sistema e cria um mundo vazio.

**Rollback:** apagar a branch; o repo volta a ter só o LICENSE.

#### Passo 2. Documentação SDD

**Depende de:** 1.
**Paralelo com:** nenhum.
**Modelo:** forte.

**Contexto:** a especificação precede o código. O legado tem README e CHANGELOG detalhados (99 KB de changelog) que servem de fonte de requisitos. O autor mantém um vault Obsidian; os docs devem ser copiáveis para lá.

**Tarefas:**
- Criar `docs/00-constitution.md` com os princípios: lógica pura em `module/core/`; dados em `system.*` (nunca `props`); teste antes de portar; pt-BR; conteúdo gerado nunca editado à mão; nada de mecânica marcada como concluída sem gate no Foundry.
- Criar `docs/01-requirements.md` em EARS (WHEN ... THE SYSTEM SHALL ...), com IDs `REQ-###`, extraídos do README e do CHANGELOG do legado. Agrupar por: Atributos e progressão, Combate, Respirações, Oni, Status e resistências, Vida e Morte, Descanso, Diagnóstico, Migração.
- Criar `docs/adr/ADR-0001` (repo novo em vez de fork), `ADR-0002` (DataModel em vez de CSB), `ADR-0003` (estratégia de migração: actors novos, nunca apagar os antigos), `ADR-0004` (registro da checagem `documentTypes`).
- Criar `docs/STATE.md` (memória de sessão por feature: passo atual, decisões, pendências).
- Formato dos docs de regra: sem tabelas Markdown (usar listas `**campo:**`), sem callouts recolhíveis, frontmatter compatível com Obsidian.

**Verificação:** cada `REQ-###` tem fonte citada (arquivo e versão do legado); nenhum requisito duplicado.

**Critério de saída:** constituição e requisitos revisados pelo autor; cada passo 3 a 14 referencia ao menos um `REQ`.

**Rollback:** reverter o PR (só documentação).

### Fase B. Contrato de dados

#### Passo 3. Extrator de contrato dos templates CSB

**Depende de:** 1.
**Paralelo com:** 2.
**Modelo:** padrão.

**Contexto:** os templates do legado (`src/templates/actors/*.json`, 92 KB a 1,1 MB) definem os dados como componentes com `key`. Slayer tem 313 chaves únicas; Oni 189; Minion 44; NPC 55. Os scripts também leem chaves dinâmicas montadas em runtime. Este passo é mecânico: extrai fatos, não decide nada.

**Tarefas:**
- Copiar snapshots somente-leitura dos templates de Actor e Item do legado para `docs/legacy/csb-templates/`, com um `README.md` registrando o commit (SHA) de origem.
- Criar `tools/extract-csb-contract.mjs` que, para cada template, percorre todos os componentes com `key` e emite: `key`, `type` do componente, valor padrão, fórmula (texto entre `${` e `}$`), caminho de aba e painel, visibilidade.
- Criar `tools/scan-dynamic-keys.mjs` que varre `scripts/` do legado (caminho por argumento) e lista padrões dinâmicos (`props[` com template string, prefixos e sufixos como `_display`, `_resumo`, `_json`, `_estado`).
- Gerar `docs/contract/<tipo>.contract.json` e `docs/contract/dynamic-keys.json`.
- Testes com um mini-template de fixture.

**Verificação:** a contagem de chaves únicas gerada bate com 313, 189, 44 e 55; os testes passam.

**Critério de saída:** contratos versionados; a extração é determinística (rodar duas vezes gera arquivos idênticos).

**Rollback:** remover `tools/` e `docs/contract/`; nada depende disso ainda.

#### Passo 4. Classificação do contrato e inventário de fórmulas

**Depende de:** 3, D2, D3 e do material de fichas exportadas.
**Paralelo com:** nenhum.
**Modelo:** forte.

**Contexto:** esta é a decisão mais importante do projeto. Cada chave do CSB precisa virar campo armazenado, valor derivado, elemento só de UI, JSON de runtime ou lixo. Os labels com fórmula (54 no Slayer, 58 no Oni) escondem regras que precisam virar funções puras. Os mesmos dados alimentam o DataModel (passo 5) e o migrador (passo 13).

**Tarefas:**
- Para cada chave em `docs/contract/*.contract.json`, classificar: `armazenado` (campo editável), `derivado` (fórmula, `*_display`, `*_resumo`), `ui` (decorativo), `runtime-json` (`*_json`, `*_estado`, presets, marcadores de turno) ou `morto` (sem uso em script nem em fórmula).
- Gerar `docs/contract/mapping.json`: `chaveCsb -> { tipo, caminhoSystem, tipoSchema, padrao, formulaRef }`.
- Para cada fórmula derivada, escrever em `docs/contract/formulas.md` a regra em português e a assinatura da função pura correspondente (`module/core/derived/`), com exemplos de entrada e saída tirados das fichas exportadas.
- Definir os fixtures dourados: fichas reais exportadas (Slayer N1, N10, N20; Oni N1, N20; Minion; NPC) guardadas em `tests/fixtures/csb-actors/`.
- Levar as decisões ambíguas ao autor numa lista única, em vez de assumir.

**Verificação:** script de checagem confirma 100% das chaves classificadas, zero `desconhecido`, e nenhum `caminhoSystem` duplicado.

**Critério de saída:** o autor aprova `mapping.json` e `formulas.md`.

**Rollback:** documentos apenas; reabrir a classificação de chaves específicas via protocolo de mutação.

### Fase C. Modelos de dados

#### Passo 5. DataModel base e Slayer

**Depende de:** 4.
**Paralelo com:** nenhum.
**Modelo:** forte para o desenho do schema base; padrão para o resto.

**Contexto:** atributos (VIT, DEX, FOR, CAR, FDV), PDV, PDR, nível e progressão N1 a N20 são compartilhados por Slayer e Oni. O Slayer é o maior ator (313 chaves). Os DataModels devem ser registrados no hook `init` via `Object.assign(CONFIG.Actor.dataModels, {...})` para preservar propriedades estáticas.

**Tarefas:**
- Criar `module/data/base-actor.mjs` (schema compartilhado) e `module/data/slayer.mjs`, com `defineSchema()` a partir de `mapping.json` (só campos `armazenado` e `runtime-json`).
- Implementar `prepareDerivedData()` chamando as funções puras de `module/core/derived/` (fórmulas do passo 4).
- Registrar o tipo no `init` e em `system.json`.
- Testes: para cada ficha dourada Slayer (N1, N10, N20), os valores derivados calculados pelo modelo devem igualar os valores exportados do CSB.
- Congelar `base-actor.mjs` ao fechar o passo; mudanças posteriores passam pelo protocolo de mutação (a base é consumida pelos passos 6 e 7).

**Verificação:** `node --test`; no Foundry, criar um Actor `slayer` sem erros de validação.

**Critério de saída:** os três fixtures Slayer passam com 100% de igualdade nos derivados; schema base congelado.

**Rollback:** reverter o PR; nada consome o modelo ainda.

#### Passo 6. DataModel Oni e Oni Minion

**Depende de:** 5.
**Paralelo com:** 7.
**Modelo:** padrão.

**Contexto:** Oni tem 189 chaves e recursos próprios (PDK em vez de PDR, Regeneração, Origens, Kekkijutsus, Especializações). Minion é uma ficha enxuta (44 chaves) com tipos, pacotes de atributos, ataques, traços e fraquezas. Ambos herdam a base do passo 5.

**Tarefas:**
- Criar `module/data/oni.mjs` e `module/data/oni-minion.mjs` seguindo `mapping.json`.
- Implementar `prepareDerivedData()` com as fórmulas do Oni (58 labels com fórmula) e do Minion.
- Testes com fixtures Oni N1, Oni N20 e Minion.

**Verificação:** `node --test`; criar Actors `oni` e `oniMinion` no Foundry.

**Critério de saída:** fixtures Oni e Minion com 100% de igualdade nos derivados.

**Rollback:** reverter o PR.

#### Passo 7. DataModel NPC e Items

**Depende de:** 5.
**Paralelo com:** 6.
**Modelo:** padrão.

**Contexto:** NPC (55 chaves) participa do relay genérico de dano e do motor de Acerto/Dano por armas normais. Os Items (arma normal, arma especial, forma de Respiração, Kekkijutsu) têm templates em `src/templates/items/` do legado; o crítico de arma vem do perfil do Item, não é fixo em 20.

**Tarefas:**
- Criar `module/data/npc.mjs` e os modelos de Item em `module/data/items/`.
- Registrar em `CONFIG.Actor.dataModels` e `CONFIG.Item.dataModels`.
- Testes com o fixture NPC e com um Item de cada tipo tirado dos templates do legado.

**Verificação:** `node --test`; criar um Item de cada tipo no Foundry.

**Critério de saída:** fixtures passam; modelos de Item cobrem todas as chaves do contrato dos Items.

**Rollback:** reverter o PR.

### Fase D. Lógica

#### Passo 8. Lógica pura

**Depende de:** 5, 6, 7.
**Paralelo com:** nenhum.
**Modelo:** padrão.

**Contexto:** só uma parte do legado é realmente pura (44 dos 69 arquivos tocam globals). Este passo leva o que pode viver em `module/core/` sem globals: `scripts/core/*` (combat-context, technique-definition, actor-transaction), os cinco `*-core.mjs` (blood-pact, dual-soul-ceremony, dual-soul-consequence, dual-soul-awakening-resistance, special-weapon-awakening), `parsing`, `status-engine`, `status-effects`, o cálculo de `level-service`, `oni/progression-engine`, os resolvedores (`origin`, `specialization`, `attribute`), `derived-bonus-service`, `actor-kind`, `constants`.

**Tarefas:**
- Portar cada módulo para `module/core/`, trocando toda leitura de `system.props.X` por acesso ao `system.<caminho>` conforme `mapping.json`.
- Portar junto os testes correspondentes (mesmos casos, adaptados aos novos caminhos).
- Adicionar o teste de invariante "sem globals em `module/core/`".
- Onde um módulo do legado misturar lógica pura com globals, separar: a parte pura vai para `core/`, a parte com globals fica para os passos 9 e 10.

**Verificação:** `node --test` (testes portados + invariante).

**Critério de saída:** todos os módulos listados portados, com a mesma cobertura de casos do legado.

**Rollback:** reverter o PR.

#### Passo 9. Serviços de combate

**Depende de:** 8.
**Paralelo com:** nenhum.
**Modelo:** padrão, com revisão forte em `damage-service` e no relay por socket.

**Contexto:** o coração da automação. Arquivos do legado: `hit-service` (893 linhas), `damage-service` (1834), `damage-relay` e `heal-relay` (socket, aprovação do GM), `roll-service`, `damage-preset-service`, `attack-builder`, `attack-follow-up`, `weapon-service`, `resistance-service`, `status-service`, `rest-service`, `life-death-service`, `action-service`, e os diálogos (`hit-dialog`, `damage-dialog`, `roll-dialog`, `attribute-dialogs`, `damage-preset-manager`). O diálogo de dano teve várias regressões de layout (v0.11.76 a 0.11.84); a solução final foi `modal: true`, largura 720, lista de entradas com scroll interno e rodapé fixo.

**Tarefas:**
- Portar os serviços para `module/services/` e os diálogos para `module/apps/dialogs/` (DialogV2 / ApplicationV2), preservando o contrato de API público do legado (`rollHit`, `rollDamage` etc.) para que macros continuem chamando o mesmo nome.
- Manter o `ActorTransaction` (commit em lote com `Promise.allSettled`).
- Preservar as regras: crítico pelo limiar do perfil da arma; espera do Dice So Nice antes do resultado; aprovação do GM no relay quando aplicável; nenhum diálogo aninhado.
- Portar os testes de cada serviço.

**Verificação:** `node --test`; no Foundry, fluxo Acerto, crítico, Dano com uma arma normal em um Slayer e em um NPC.

**Critério de saída:** fluxo de armas normais funcionando ponta a ponta no Foundry (este é o gate que o legado ainda não fechou; registrar o resultado em `docs/STATE.md`).

**Rollback:** reverter o PR; os passos 10 a 13 não iniciam.

#### Passo 10. Subsistemas (três PRs paralelos)

**Depende de:** 9, D6.
**Paralelo com:** 10a, 10b e 10c entre si.
**Modelo:** padrão; forte na revisão do 10c.

**10a. Respirações**
- **Contexto:** `breath-service` (2133 linhas), os serviços por Respiração (Chamas, Pedra, Névoa, Metal, Neve, Vento), os arquivos `*-data`, `breathing-defense`, `breath-passives`, `recovery-breathing-service`. Só as seis Respirações com service, teste e auditoria contra a fonte oficial entram; Água continua fora (sem service).
- **Tarefas:** portar serviços, dados e testes; a única mecânica por Respiração são passivas e acumuladores (`resp_passivas_estado`); custo, ação, calor e crítico seguem oficiais.
- **Critério de saída:** as seis Respirações com testes portados verdes e o painel de Respiração abrindo no Foundry.

**10b. Oni**
- **Contexto:** `oni/*` (kekkijutsu, regeneração, origens, especializações, minion-builder, gm-panel-data), `oni-action-service`, `oni/repair-service` (repara dados legados; avaliar se ainda faz sentido).
- **Tarefas:** portar serviços e testes; Oni não recebe Vida e Morte de Slayer; Regeneração roda uma vez por turno (`oni_regeneracao_usada_turno`).
- **Critério de saída:** progressão Oni N1 a N20 reproduz os fixtures.

**10c. Dupla Alma, armas especiais, Pacto de Sangue e estados avançados**
- **Contexto:** `dual-soul-*` (consequence-service 2427 linhas, ceremony 1285, awakening-resistance 1016), `special-weapon-*`, `blood-pact-core`, `slayer/advanced-states` (1193), `poison-user-service`, `interlude-service`. Maior bloco do legado. Armas especiais estão fora do fluxo publicado (D6).
- **Tarefas:** portar código e testes; manter armas especiais desativadas por padrão e documentadas como não publicadas.
- **Critério de saída:** testes portados verdes; nenhuma mecânica marcada como "concluída" sem gate.

**Verificação (todos):** `node --test`; smoke no Foundry do subsistema.

**Rollback:** cada PR reverte independente.

### Fase E. Interface, conteúdo e migração

#### Passo 11. Fichas e painéis (ApplicationV2)

**Depende de:** 9, 10a (botões de Respiração), D5.
**Paralelo com:** 12.
**Modelo:** padrão.

**Contexto:** as fichas hoje são montadas no editor visual do CSB. No sistema próprio viram `HandlebarsApplicationMixin(ActorSheetV2)` (Actors) e `ItemSheetV2` (Items), registradas com `DocumentSheetConfig.registerSheet` no `init`. Abas do legado: Slayer tem Perícias, Combate, Habilidades e Config/Dados; Oni tem Combate e Configurações/Dados; Minion é enxuta; NPC tem dados próprios. O visual do módulo (Orbitron/Rajdhani, dourado e sangue, prefixo `na-sheet-*`) deve ser reaproveitado de `styles/na-csb-automation.css`.

**Tarefas:**
- Criar `NASheetBase` e as fichas de Slayer, Oni, Minion e NPC, mais as fichas de Item.
- Migrar o CSS reaproveitando o design system, com escopo sob a classe do sistema.
- Portar o painel do GM (PDV/PDR ao vivo) como ApplicationV2.
- Ligar os botões da ficha aos serviços dos passos 9 e 10.
- Testes de contexto (`_prepareContext`) para cada ficha.

**Verificação:** `node --test`; abrir cada ficha no Foundry com um fixture importado; conferir que nenhum valor derivado mostra `ERROR` ou `undefined`.

**Critério de saída:** as quatro fichas navegáveis com os mesmos campos que o CSB mostrava, e ações funcionando.

**Rollback:** reverter o PR.

#### Passo 12. Compêndios e pipeline de build

**Depende de:** 7, 10a.
**Paralelo com:** 11.
**Modelo:** padrão.

**Contexto:** os compêndios do legado são gerados por `tools/` a partir de `data/catalog-source/`, `catalogs/` e `src/templates/items/`, e empacotados com `@foundryvtt/foundryvtt-cli`. No sistema novo, os Actors são nativos, então o compêndio `templates-de-ficha` deixa de existir.

**Tarefas:**
- Trazer as fontes de catálogo para `packs-src/`, ajustando o formato aos DataModels de Item do passo 7.
- Portar somente as ferramentas de `tools/` que ainda fazem sentido; registrar as descartadas.
- Compêndios: respirações, armas dos caçadores, arte, macros (só diagnóstico e ferramentas que continuarem úteis).
- Atualizar o `release.yml` para empacotar com `package pack --type System --id <D1>`.

**Verificação:** build local gera os packs; abrir cada compêndio no Foundry e arrastar um Item para uma ficha.

**Critério de saída:** todos os Items aparecem completos e com as mesmas propriedades do catálogo canônico.

**Rollback:** reverter o PR.

#### Passo 13. Migrador de mundos CSB para o sistema

**Depende de:** 5, 6, 7, 12.
**Paralelo com:** nenhum.
**Modelo:** forte.

**Contexto:** mundos existentes têm Actors do CSB com dados em `system.props` e Items embutidos remapeados pelo CSB. O tipo de um Actor no Foundry não é algo para trocar com um `update` simples; por isso a estratégia (ADR-0003) é **criar Actors novos** e nunca apagar os antigos. Os tokens em cenas apontam para `actorId`, então o migrador precisa reapontar. O tipo (slayer, oni, minion, npc) é decidido pela lógica de `actor-kind` do legado.

**Tarefas:**
- Criar `module/migration/csb-to-system.mjs` com modo **dry-run** (relatório do que mudaria, sem escrever nada) e modo **aplicar**.
- Antes de aplicar, exportar um backup JSON dos Actors e Items afetados.
- Para cada Actor: criar o novo Actor do tipo certo copiando nome, imagem, token, efeitos, pasta, propriedade e flags; converter `props` para `system.*` via `mapping.json`; recriar Items a partir dos compêndios com sobrescritas de dados; marcar `flags.<D1>.migratedFrom` com a versão do módulo e a data.
- Reapontar os tokens das cenas para os Actors novos; mover os Actors antigos para a pasta "Legado CSB".
- Idempotência: rodar de novo não duplica nada.
- Macro GM "Migrar mundo CSB para o sistema", com confirmação explícita antes de aplicar.
- Testes com os fixtures do passo 4.

**Verificação:** `node --test`; em um **mundo clonado**, dry-run e aplicar, e comparar valores derivados antes e depois.

**Critério de saída:** zero divergência nos derivados dos fixtures e do mundo clonado; segunda execução sem alterações.

**Rollback:** o backup JSON e os Actors antigos preservados; nada é apagado.

#### Passo 14. Piloto, release v1.0.0 e transição

**Depende de:** 11, 12, 13.
**Paralelo com:** nenhum.
**Modelo:** padrão.

**Contexto:** o legado só declara validado o que passou pelo gate no Foundry. O sistema novo segue a mesma regra. A mesa piloto usa um clone do mundo real.

**Tarefas:**
- Rodar os gates no clone migrado: Slayer N1 a N20; Vida e Morte do Slayer; Oni N1 a N20; fluxo Acerto, crítico, Dano com arma normal (Slayer e NPC) com Dice So Nice; gate de desempenho (sem varreduras pesadas no caminho crítico).
- Exportar o Journal de diagnóstico e corrigir o que aparecer.
- Fechar `release.yml` (tag, testes, packs, `system.json` e `system.zip` como assets) e publicar `v1.0.0`.
- Testar a instalação pelo manifest em uma instalação limpa do Foundry.
- No módulo legado, publicar uma última versão 0.11.x com aviso de descontinuação apontando para o sistema; **não arquivar** o repo até o autor decidir.
- Atualizar README, CHANGELOG e `docs/STATE.md`.

**Verificação:** todos os gates registrados como aprovados em `docs/STATE.md`; instalação limpa funcionando.

**Critério de saída:** `v1.0.0` publicado e uma mesa jogando no sistema novo.

**Rollback:** despublicar a release e manter as mesas no módulo legado.

## 6. Material necessário

Para avançar nos passos 3 e 4 sem suposições:

- Fichas exportadas em JSON do mundo real: Slayer N1, N10 e N20; Oni N1 e N20; um Oni Minion; um NPC.
- Um backup (ou clone) de um mundo de mesa para o piloto do passo 14.
- Documentos de regras que valem como fonte dos requisitos (notas do vault Obsidian).
- Confirmação das decisões D1 a D7.

## 7. Revisão adversarial (autorrevisão)

Sem sub-agente disponível, a revisão foi feita contra a lista de anti-padrões do blueprint e da arquitetura do projeto. Achados e correções já aplicadas neste rascunho:

**Crítico. Contrato subestimado.** A contagem inicial de props vinha de busca estática e ignorava chaves dinâmicas e fórmulas de label. Correção: passo 3 combina template e varredura dinâmica; passo 4 exige zero chaves `desconhecido`.

**Crítico. Lógica escondida em templates.** As fórmulas dos labels (54 Slayer, 58 Oni) não estão nos scripts; portar só os scripts geraria divergência silenciosa. Correção: fixtures dourados exportados e testes de igualdade dos derivados nos passos 5, 6 e 7.

**Crítico. Trocar o tipo do Actor.** Atualizar o `type` de um Actor existente não é uma operação segura. Correção: o migrador cria Actors novos, reaponta tokens e nunca apaga os antigos (ADR-0003, passo 13).

**Alto. "Lógica pura" menor do que parece.** 44 de 69 arquivos usam globals. Correção: o passo 8 leva só o que é realmente puro e separa o restante para os passos 9 e 10.

**Alto. Base compartilhada congelada cedo.** O schema base é consumido por 6 e 7. Correção: congelar ao fim do passo 5; qualquer mudança passa pelo protocolo de mutação.

**Alto. Mecânicas não validadas no legado.** Armas especiais estão fora do fluxo publicado; armas normais ainda sem gate runtime. Correção: D6 e o critério de saída do passo 9.

**Médio. Declaração de tipos na v14.** O `template.json` é o mecanismo legado; a forma atual precisa ser confirmada na doc oficial. Correção: tarefa explícita no passo 1 e ADR-0004.

**Médio. Migrador tardio.** Se o mapeamento mudar depois do passo 13, os dados migrados quebram. Correção: `mapping.json` é fonte única para modelos e migrador, e mudanças nele exigem reexecutar os testes de ambos.

**Baixo. `.gitignore` ausente.** O repo novo só tem LICENSE. Correção: passo 1.

## 8. Protocolo de mutação

Quando um passo precisar mudar depois de aprovado:

- **Dividir:** criar `N.1`, `N.2`, mantendo dependências do original.
- **Inserir:** novo passo com número decimal (ex.: `5.5`), registrando o motivo.
- **Pular ou abandonar:** marcar o passo como `abandonado` com a razão e revisar os dependentes.
- **Reordenar:** só se o grafo de dependência continuar acíclico.
- **Toda mutação** entra em `docs/STATE.md` com data, motivo e passos afetados, e o `mapping.json` congelado só é reaberto com nova aprovação do autor.
