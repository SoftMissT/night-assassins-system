---
title: "Constituição — Night Assassins System"
created: 2026-09-29
status: proposta
type: constituicao
projeto: night-assassins-system
blueprint: plans/night-assassins-system-blueprint.md
tags:
  - night-assassins
  - sdd
  - principios
  - foundry-vtt
---

# Constituição

Princípios não-negociáveis do Night Assassins System. Toda decisão de
implementação dos passos 3 a 14 é subordinada a este documento. Quando um
princípio conflitar com uma instrução pontual, o princípio vence e a exceção
precisa ser registrada em `docs/STATE.md` com o motivo.

Cada princípio tem **título**, **regra** e **consequência prática**.

## 1. Lógica pura em `module/core/`

- **Regra:** todo cálculo de regra vive em funções puras sob `module/core/`. Um
  arquivo de `module/core/` não pode importar nem referenciar globais do
  Foundry: `game.`, `ui.`, `Hooks`, `foundry.`, `canvas.`, `CONFIG.`.
- **Consequência prática:** efeitos colaterais (persistência, socket, chat,
  diálogos, hooks) ficam em `module/services/` e `module/apps/`. O passo 8
  adiciona um teste que varre o texto de `module/core/` e falha se um global
  aparecer.

## 2. Dados em `system.*`, nunca em `props`

- **Regra:** o sistema novo lê e escreve dados tipados em `actor.system.*` e
  `item.system.*`. `system.props` do legado CSB é proibido no código novo.
- **Consequência prática:** a única leitura permitida de `system.props` ocorre
  em `module/migration/` e nos fixtures do legado. Cada chave do legado vira um
  caminho `system.<caminho>` definido em `mapping.json` (passo 4).

## 3. Teste antes de portar

- **Regra:** nenhuma lógica do legado é portada sem um teste equivalente ao
  que a protegia no módulo antigo. O teste precede ou acompanha a portação; não
  existe portação "para testar depois".
- **Consequência prática:** os fixtures dourados do passo 4 (fichas Slayer N1,
  N10, N20; Oni N1, N20; Minion; NPC) fixam o resultado esperado. Derivados
  calculados pelo DataModel precisam bater 100% com o export do CSB.

## 4. pt-BR na interface e nos documentos

- **Regra:** interface, mensagens de chat, diálogos, documentação e commits são
  em pt-BR. Identificadores técnicos e chaves de dados preservam o contrato do
  operador.
- **Consequência prática:** toda string de interface vive em
  `lang/pt-BR.json`; texto solto no código é defeito. Os documentos deste
  repositório devem ser copiáveis para o vault Obsidian do autor sem reescrita.

## 5. Conteúdo gerado nunca é editado à mão

- **Regra:** `build/` e `packs/` são artefatos de build. Não são fonte de
  verdade, não são editados manualmente e não são versionados.
- **Consequência prática:** a fonte é `packs-src/`/`tools/` (passo 12). Se um
  compêndio divergir, corrige-se a fonte e regenera-se o pacote. LevelDB nunca
  é editado à mão.

## 6. Nada é "concluído" sem gate no Foundry

- **Regra:** teste Node verde **não** encerra uma mecânica. Só o gate em Foundry
  v14 real (Actor, hooks, chat, Dice So Nice, permissões e persistência) fecha
  um passo de mecânica.
- **Consequência prática:** `docs/STATE.md` mantém o gate manual como pendente
  até o autor executá-lo. Marcar um gate como concluído por inferência é
  violação direta desta constituição.

## 7. Dice So Nice aguardado antes de postar

- **Regra:** toda rolagem mecânica aguarda a animação do Dice So Nice antes de
  publicar o resultado no chat. `ChatMessage.create` com `rolls` **não** pode
  ser precedido de chamada manual a `game.dice3d.showForRoll`, porque isso
  duplica a animação.
- **Consequência prática:** parcelas puramente fixas não inventam dados; apenas
  parcelas que contêm dados vão à API 3D. O chat nunca é publicado antes de a
  única animação terminar.

## 8. Display fields são visuais; `*_num` e `*_conta` são números

- **Regra:** `*_num` e `*_conta` carregam número puro, sem HTML, e são a única
  fonte para fórmulas numéricas. `*_display` e `*_valor_visual` são etiquetas
  visuais, nunca entram em fórmula numérica e não contêm HTML inline.
- **Consequência prática:** CSS semântico (PDV/PDK/SAB/CAR/FDV/DEX/FOR/VIT) usa
  `!important` para não ser sobrescrito pela especificidade do `na-sheet-text`.
  Testes anti-regressão validam as duas regras antes de cada release.

## 9. Contratos do operador são lei

- **Regra:** templates oficiais, fórmulas fornecidas pelo operador e repetições
  intencionais (ex.: VIT/FDV repetidos em fórmulas de PDV/PDK do Oni) são
  contrato. Não podem ser "normalizados", simplificados ou reinterpretados por
  inferência do agente.
- **Consequência prática:** qualquer ambiguidade vira pergunta registrada em
  `docs/STATE.md`; o agente não decide pela mesa. Layout, componentes e CSS do
  export oficial governam a estrutura.

## 10. Performance no caminho crítico

- **Regra:** operações em lote substituem loops sequenciais de escrita;
  identidades usam `getName()`/`fromUuid()`/flags, nunca IDs hardcoded; nenhuma
  varredura pesada de Actors/Items roda no caminho crítico ou no `ready`.
- **Consequência prática:** rotinas de `ready` registram motores e sincronizam
  apenas o pequeno Compêndio de macros. Manutenções de mundo viram comandos
  explícitos do GM. `ActorTransaction` consolida custos e efeitos em uma escrita
  por Actor.

## 11. Identidade por namespace, nunca por inferência

- **Regra:** Caçador humano usa `slayer` (PDV/PDR); Oni usa `oni` (PDV/PDK).
  Atributos compartilhados usam keys neutras (`vit_display`, ...). Nenhuma key
  exclusiva do Oni pode usar `pdr`.
- **Consequência prática:** interfaces detectam a ficha pelo namespace, com o
  nome do Actor como fallback. Alvos sem identidade Slayer/Oni são rejeitados
  sem escrita, em vez de tratados automaticamente como Oni.

## 12. Um único GM autoritativo

- **Regra:** o GM ativo de menor ID é a autoridade de turnos, dano/cura entre
  atores, status persistentes e diagnóstico. O jogador solicita; o GM confirma
  quando a regra exige.
- **Consequência prática:** atualizações em Actors que o jogador não possui
  passam pelo socket do módulo com aprovação do GM. A idempotência usa chaves
  como `combatId:round:turn:combatantId` gravadas antes da resolução. O sistema
  escuta os hooks nativos do Foundry e não depende de módulos externos de UI.

## Relações

- [Requisitos](01-requirements.md)
- [ADR-0001 — Repositório novo em vez de fork](adr/ADR-0001-repo-novo-em-vez-de-fork.md)
- [ADR-0002 — DataModel em vez de CSB](adr/ADR-0002-datamodel-em-vez-de-csb.md)
- [ADR-0003 — Migração cria Actors novos](adr/ADR-0003-migracao-actors-novos.md)
- [ADR-0004 — Declaração de tipos na v14](adr/ADR-0004-declaracao-de-tipos-v14.md)
- [STATE](STATE.md)
- [Blueprint](../plans/night-assassins-system-blueprint.md)
